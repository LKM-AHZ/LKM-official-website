import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SaveStatus,
  PersistenceAdapter,
  DocumentData,
} from "../engine/types";
import { exportMdx } from "../engine/mdx/index";
import { t } from "~/lib/i18n";

const FALLBACK_PREFIX = "autosave_fallback_";

function writeFallback(docId: string, data: unknown): void {
  try {
    localStorage.setItem(FALLBACK_PREFIX + docId, JSON.stringify(data));
  } catch {
    // localStorage 也失败了，静默处理
  }
}

function readFallback(docId: string): unknown | null {
  try {
    const raw = localStorage.getItem(FALLBACK_PREFIX + docId);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

/** 只有内容被真正采纳后才清理兜底备份，避免读失败/未采纳时把唯一一份副本也删掉 */
function clearFallback(docId: string): void {
  try {
    localStorage.removeItem(FALLBACK_PREFIX + docId);
  } catch {
    // ignore
  }
}

export function useAutoSave(
  documentId: string,
  adapter: PersistenceAdapter,
  debounceMs = 1000,
  getFrontmatter?: () => Record<string, unknown>,
): {
  saveStatus: SaveStatus;
  triggerSave: (content: Record<string, unknown>, contentMdx?: string) => void;
  loadDraft: () => Promise<DocumentData | null>;
  flushImmediate: (content: Record<string, unknown>) => void;
} {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const hasUnsavedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseVersionRef = useRef(1);
  const savedCallbackRef = useRef<(() => void) | null>(null);
  const lastSavedJsonHashRef = useRef<string>("");
  const lastVersionSaveRef = useRef<number>(0);

  // 待保存的最新内容：卸载/刷新前 flush 用。doSave 是异步的，且卸载 effect 用的是空依赖
  // 闭包，因此保存原始 content 由 triggerSave/flushImmediate 实时写入本 ref，卸载时读取。
  const latestContentRef = useRef<Record<string, unknown>>({});
  // 源码模式下用户直接编辑 MDX，落盘内容不能再用 editorJson 反推。
  // null 表示「未指定」，走原有的 exportMdx 派生路径。
  const latestMdxRef = useRef<string | null>(null);
  // 串行化保存链：把可能并发的 doSave 排队执行（乐观锁依赖 baseVersionRef，并发会竞态）。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveChainRef = useRef<Promise<any>>(Promise.resolve());

  const loadDraft = useCallback(async () => {
    const doc = await Promise.resolve(adapter.loadDocument(documentId));
    if (!doc) return null;
    baseVersionRef.current = doc.version;
    const fallback = readFallback(documentId);
    // writeFallback 存的是 { content, mdxContent, version }，正文在 content 字段上；
    // 整块当成 editorJson 会把文档嵌错一层。
    const fallbackContent =
      fallback && typeof fallback === "object"
        ? (fallback as { content?: Record<string, unknown> }).content
        : null;
    if (fallbackContent && doc.editorJson) {
      console.info("[autosave] 从兜底备份恢复文档:", documentId);
      clearFallback(documentId);
      return { ...doc, editorJson: fallbackContent };
    }
    return doc;
  }, [documentId, adapter]);

  const saveImpl = useCallback(
    async (
      content: Record<string, unknown>,
      contentMdxOverride: string | null,
    ) => {
      setSaveStatus("saving");
      try {
        const jsonStr = JSON.stringify(content);
        // 去重键必须带上 mdx 覆盖值：源码模式下 editorJson 不变、MDX 却在变，
        // 只用 content 做键会把后续源码编辑全判成「无变化」直接丢弃。
        const saveKey =
          contentMdxOverride === null
            ? jsonStr
            : `${jsonStr}\u0000${contentMdxOverride}`;
        if (saveKey === lastSavedJsonHashRef.current) {
          setSaveStatus("saved");
          hasUnsavedRef.current = false;
          return;
        }

        let mdxContent = "";
        if (contentMdxOverride !== null) {
          // 源码模式：用户输入的 MDX 就是要落盘的内容
          mdxContent = contentMdxOverride;
        } else {
          try {
            const json = content as {
              content?: Array<Record<string, unknown>>;
            };
            const nodes = json.content ?? [];
            // 使用文档的 frontmatter（导入时记录），避免自动保存丢失文档元信息
            const frontmatter = getFrontmatter?.() ?? {};
            const result = exportMdx(nodes, frontmatter);
            mdxContent = result.mdx;
          } catch (err) {
            console.warn("[autosave] MDX 导出失败:", err);
            mdxContent = "";
          }
        }

        const existing = (await adapter.loadDocument(
          documentId,
        )) as DocumentData | null;

        if (existing && existing.version !== baseVersionRef.current) {
          setSaveStatus("conflict");
          return;
        }

        const now = new Date().toISOString();
        const newVersion = (existing?.version ?? 0) + 1;

        const doc: DocumentData = {
          id: documentId,
          title: existing?.title ?? t("editor.untitled"),
          contentMdx: mdxContent,
          editorJson: content,
          status: existing?.status ?? "draft",
          version: newVersion,
          lastModified: now,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };

        await adapter.saveDocument(doc);

        baseVersionRef.current = newVersion;
        lastSavedJsonHashRef.current = saveKey;
        setSaveStatus("saved");
        hasUnsavedRef.current = false;
        savedCallbackRef.current?.();

        // 异步备份
        try {
          await adapter.createBackup(documentId, {
            docId: documentId,
            title: doc.title,
            contentMdx: mdxContent,
            editorJson: content,
            status: doc.status,
            version: newVersion,
          });
        } catch {
          writeFallback(documentId, {
            content,
            mdxContent,
            version: newVersion,
          });
        }

        // 版本快照节流：同一文档同一分钟内最多一次
        const nowTs = Date.now();
        if (nowTs - lastVersionSaveRef.current > 60_000) {
          lastVersionSaveRef.current = nowTs;
          try {
            if (mdxContent) {
              await adapter.saveVersion(documentId, doc, "");
            }
          } catch (err) {
            console.warn("[autosave] 版本存储异常:", err);
          }
        }
      } catch (err) {
        console.warn("[autosave] 保存失败:", err);
        writeFallback(documentId, { content });
        setSaveStatus("error");
      }
    },
    [documentId, adapter, getFrontmatter],
  );

  // 把一次保存串行入队，避免多调用并发踩乐观锁；后一个保存必然拿到前一个保存后的 baseVersion。
  const enqueueSave = useCallback(() => {
    const content = latestContentRef.current;
    const mdx = latestMdxRef.current;
    saveChainRef.current = saveChainRef.current
      .then(() => saveImpl(content, mdx))
      .catch(() => {
        // 单个保存失败不中断后续链（saveImpl 内部已 try/catch 处理，正常不会走到这）
      });
    return saveChainRef.current;
  }, [saveImpl]);

  const triggerSave = useCallback(
    (content: Record<string, unknown>, contentMdx?: string) => {
      latestContentRef.current = content;
      latestMdxRef.current = contentMdx ?? null;
      hasUnsavedRef.current = true;
      setSaveStatus("unsaved");

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        enqueueSave();
      }, debounceMs);
    },
    [debounceMs, enqueueSave],
  );

  const flushImmediate = useCallback(
    (content: Record<string, unknown>) => {
      latestContentRef.current = content;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (hasUnsavedRef.current) {
        enqueueSave();
      }
    },
    [enqueueSave],
  );

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (hasUnsavedRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // 卸载时 flush 未落盘改动：组件卸载 / 路由切换 / 快速刷新前尽力把最新内容写回。
  // latestContentRef 避开空依赖闭包读不到最新 content 的问题。
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // 仅在确有未保存内容且尚未处于保存中时才发起（避免卸载瞬间重复写一次已保存内容）
      if (hasUnsavedRef.current) {
        // 用离线微任务而非同步网络请求，避免卸载路径上的可见异常
        void Promise.resolve().then(() => enqueueSave());
      }
    };
  }, []);

  return {
    saveStatus,
    triggerSave,
    loadDraft,
    flushImmediate,
  };
}
