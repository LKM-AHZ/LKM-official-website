import {
  useCallback,
  useEffect,
  useRef,
  useState,
  Suspense,
  lazy,
} from "react";
import type { ReactElement } from "react";
import FullscreenButton from "../toolbar/FullscreenButton";
import CommentPanel from "../panels/CommentPanel";
import { setupKeyboardAutoScroll } from "../../hooks/useMobileEditor";
import { useEditor, EditorContent } from "@tiptap/react";
import { getEditorExtensions } from "../../engine/extensions/index";
import { useEditorPersistence } from "../../hooks/useEditorPersistence";
import { exportMdx } from "../../engine/mdx/index";
import type {
  PersistenceAdapter,
  EditorMode,
  VersionEntry,
  DocumentData,
} from "../../engine/types";
import EditorToolbar from "../toolbar/EditorToolbar";
import ModeTabs from "./ModeTabs";
import SaveStatusIndicator from "../toolbar/SaveStatusIndicator";
import BubbleMenuWrapper from "../toolbar/BubbleMenu";
import SlashMenu from "../dialogs/SlashMenu";
import PreviewPanel from "../panels/PreviewPanel";
import PublishButton from "../dialogs/PublishButton";
import VersionHistoryPanel from "../panels/VersionHistoryPanel";
import ExportMenu from "../dialogs/ExportMenu";
import BackupMenu from "../panels/BackupMenu";
import PublishArticleDialog from "../dialogs/PublishArticleDialog";
import { blogApi } from "~/lib/api";
import { t } from "~/lib/i18n";

/** 从标题派生文件名 slug（与 git-persistence 的 deriveSlug 保持一致） */
function deriveSlug(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "");
  return s || "post";
}

/** 从 MDX 首行 `# ` 提取标题；无标题返回空串 */
function firstHeadingTitle(mdx: string): string {
  const line = (mdx.split("\n")[0] ?? "").replace(/^#\s*/, "").trim();
  return line;
}

// 懒加载：CodeMirror（仅在切换到源码模式时加载）
const SourceEditor = lazy(() => import("./SourceEditor"));
// 懒加载：AI 助手（仅在点击 AI 按钮时加载）
const AiAssistant = lazy(() => import("../panels/AiAssistant"));
// 懒加载：面板和对话框（仅在需要时显示）
const PropertyPanel = lazy(() => import("../panels/PropertyPanel"));
const PublishDialog = lazy(() => import("../dialogs/PublishDialog"));

interface DocumentEditorProps {
  documentId: string;
  adapter: PersistenceAdapter;
  /** Git 系列写作模式（URL 带 ?seriesId 时为 series 主键；admin 本地模式为 undefined） */
  seriesId?: string;
}

import { computeTextMetrics } from "../../engine/text-metrics";
import {
  findImageByOrgName,
  saveImageBlob,
} from "../../persistence/image-store";
import {
  detectLink,
  detectWiki,
  wikiHref,
} from "../../engine/plugins/markdown-shortcuts";
import ObsidianImagePicker from "../dialogs/ObsidianImagePicker";

/** 上传图片为 blob 引用，避免 base64 塞满 localStorage */
function uploadImageToBlob(file: File): Promise<string> {
  return saveImageBlob(file);
}

export default function DocumentEditor({
  documentId,
  adapter,
  seriesId,
}: DocumentEditorProps): ReactElement {
  const gitMode = seriesId !== undefined;
  const [docId, setDocId] = useState(documentId === "new" ? "" : documentId);
  const {
    saveStatus,
    triggerSave,
    loadDraft,
    flushImmediate,
    importMdxContent,
    exportMdxContent,
    sourceMdxRef,
    frontmatterRef,
    lastValidJsonRef: lastValidEditorJsonRef,
  } = useEditorPersistence(docId, adapter);
  const [mode, setMode] = useState<EditorMode>("richtext");

  // Slash 菜单状态
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPos, setSlashPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // 发布状态
  const [publishOpen, setPublishOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 发布为文章状态（gitMode 专用）：预填元数据 + 弹框开合 + 发布中
  const [publishArticleOpen, setPublishArticleOpen] = useState(false);
  const [publishingArticle, setPublishingArticle] = useState(false);
  const [publishArticleInitial, setPublishArticleInitial] = useState<{
    slug: string;
    category: string;
    tags: string[];
  }>({ slug: "", category: "engineering", tags: [] });

  // 版本历史状态
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);

  // AI 助手状态
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // 评论面板状态
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);

  // Obsidian 附件 `![[文件名]]` 选图状态
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  // 待替换为图片的附件语法：记录原始 `![[文件名]]` 串 + 大致起始位置。
  // 选图是异步的（文件弹窗期间用户/光标可位移），用原始串在文档中重新定位，避免绝对区间过期。
  const pendingImageReplace = useRef<{
    from: number;
    to: number;
    syntax: string;
  } | null>(null);
  // 延迟转换候选（链接/维基）：闭合括号后不立刻转，等光标移开/回车再转（对齐 Obsidian live preview）。
  // 存绝对 from/to，光标离开该区间后据此替换。
  const pendingConvertRef = useRef<{
    from: number;
    to: number;
    kind: "link" | "wiki";
    label: string;
    href: string;
  } | null>(null);

  // 源码视图类型（MDX / HTML）
  const [sourceKind, setSourceKind] = useState<"mdx" | "html">("mdx");
  // HTML 源码（可编辑回写，进入源码模式时用 TipTap 原生 HTML 初始化）
  const [htmlSource, setHtmlSource] = useState("");

  // 解析文档：新建 → 创建，已有 → 加载
  useEffect(() => {
    if (documentId === "new") {
      // Git 系列写作：新建文档不写临时 uuid、不改 URL。
      // docId 保持 "new" 使 autosave 可触发；保存时由 createGitPersistence 按标题 deriveSlug 生成 filepath。
      if (gitMode) {
        setDocId("new");
        return;
      }
      (async () => {
        const doc: DocumentData = {
          id: crypto.randomUUID(),
          title: t("editor.untitled"),
          contentMdx: "",
          editorJson: null,
          status: "draft",
          version: 1,
          lastModified: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await adapter.saveDocument(doc);
        setDocId(doc.id);
        const base =
          (window as unknown as Record<string, string>).__BASE_URL__ || "";
        // base 为 '/' 时 `${base}/editor` 会拼成 '//editor'（协议相对 URL，被解析为 http://editor/...），
        // 导致 replaceState 抛 SecurityError。去尾部斜杠后再拼接。
        window.history.replaceState(
          null,
          "",
          `${base.replace(/\/+$/, "")}/editor?id=${doc.id}`,
        );
      })();
    }
  }, [documentId, adapter, gitMode]);

  const editor = useEditor({
    extensions: getEditorExtensions(t("editor.startWritingPlaceholder")),
    onUpdate({ editor: ed }) {
      if (!ed || !docId) return;
      const json = ed.getJSON();
      lastValidEditorJsonRef.current = json;
      triggerSave(json);
    },
    editorProps: {
      attributes: {
        class: "rte-editor-content",
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              uploadImageToBlob(file)
                .then((blobRef) => {
                  view.dispatch(
                    view.state.tr.replaceSelectionWith(
                      view.state.schema.nodes.image.create({ src: blobRef }),
                    ),
                  );
                })
                .catch(() => {
                  // 忽略上传错误
                });
              return true;
            }
          }
        }
        // TSV 粘贴
        const text = event.clipboardData?.getData("text/plain");
        if (text && text.includes("\t")) {
          const rows = text
            .trim()
            .split("\n")
            .map((r) => r.split("\t"));
          if (rows.length > 1 && rows[0].length > 1) {
            const { insertTable } = view.state.schema.nodes;
            if (insertTable) {
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  insertTable.create(
                    null,
                    Array.from({ length: rows.length }, (_, r) =>
                      view.state.schema.nodes.tableRow.create(
                        null,
                        rows[r].map((cell) =>
                          view.state.schema.nodes.tableCell.create(
                            null,
                            view.state.schema.text(cell),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              );
              return true;
            }
          }
        }
        return false;
      },
      handleDrop(view, event, _moved, _slice) {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        let handled = false;
        Array.from(files).forEach((file) => {
          if (file.type.startsWith("image/")) {
            handled = true;
            uploadImageToBlob(file)
              .then((blobRef) => {
                const coords = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });
                const pos = coords?.pos ?? view.state.selection.from;
                view.dispatch(
                  view.state.tr.insert(
                    pos,
                    view.state.schema.nodes.image.create({ src: blobRef }),
                  ),
                );
              })
              .catch(() => {
                // 忽略上传错误
              });
          }
        });
        return handled;
      },
    },
  });

  // 检测斜杠命令触发
  useEffect(() => {
    if (!editor) return;

    const handleTextInput = (): void => {
      const { $from } = editor.state.selection;
      const parentText = $from.parent.textBetween(
        Math.max(0, $from.parentOffset - 20),
        $from.parentOffset,
      );
      const slashMatch = parentText.match(/\/(\w*)$/);
      if (slashMatch) {
        setSlashQuery(slashMatch[1]);
        const coords = editor.view.coordsAtPos($from.pos);
        setSlashPos({ top: coords.bottom + 4, left: coords.left });
        setSlashOpen(true);
      } else if (slashOpen) {
        setSlashOpen(false);
      }
    };

    const handleUpdate = (): void => {
      if (slashOpen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { $from } = (editor.state as any).selection;
        const parentText = $from.parent.textBetween(
          Math.max(0, $from.parentOffset - 20),
          $from.parentOffset,
        );
        if (!parentText.includes("/")) {
          setSlashOpen(false);
        }
      }
    };

    // 把已确认的候选（链接/维基）替换为对应节点。
    // 候选 from/to 在探测时确定；若区间越界则放弃（并发编辑已改变文档），不落地。
    const applyConvert = async (cand: {
      from: number;
      to: number;
      kind: "link" | "wiki";
      label: string;
      href: string;
    }): Promise<void> => {
      if (!editor) return;
      const docSize = editor.state.doc.content.size;
      if (cand.from < 0 || cand.to > docSize || cand.from >= cand.to) return;
      if (cand.kind === "link") {
        editor
          .chain()
          .focus()
          .setTextSelection({ from: cand.from, to: cand.to })
          .insertContent({
            type: "text",
            text: cand.label,
            marks: [{ type: "link", attrs: { href: cand.href } }],
          })
          .run();
        editor
          .chain()
          .focus()
          .setTextSelection(Math.max(0, cand.from + cand.label.length))
          .run();
      } else {
        // wiki 的 href 需实时查已发布索引（slug 贯通后不再 cast）。
        // 索引读取失败不能把整个转换打断：本函数由 update 事件监听器 await，
        // rejection 没有接管方，退回候选自带的 href 继续转换
        let docs: { title: string; slug?: string }[] = [];
        try {
          const docList = await Promise.resolve(adapter.listDocuments());
          docs = docList.map((d) => ({ title: d.title, slug: d.slug }));
        } catch (err) {
          console.warn("[DocumentEditor] 读取文档索引失败，回退 href:", err);
        }
        const href = wikiHref(cand.label, () => docs) || cand.href;
        editor
          .chain()
          .focus()
          .setTextSelection({ from: cand.from, to: cand.to })
          .insertContent({
            type: "wikiLink",
            attrs: { href, label: cand.label },
          })
          .run();
        editor
          .chain()
          .focus()
          .setTextSelection(Math.max(0, cand.from + cand.label.length))
          .run();
      }
    };

    // Obsidian md 自动转换：链接 `[text](url)` 与维基 `[[名称]]` + 附件 `![[文件名]]`
    //
    // 延迟转换（对齐 Obsidian live preview）：光标停在闭括号处时不立刻渲染源语法，
    // 仅登记为 pendingConvertRef；等光标真正离开候选文本（回车/移开/后续输入使光标后
    // 不再紧跟闭括号）才做替换。因此「刚闭合」的瞬间触发依据 `$from.pos >= toAbs` 恒真
    // 的问题被消除——转换只发生在离开候选区间之后，且转换为幂等替换，不会死循环。
    const handleMarkdownTextInput = async (): Promise<void> => {
      if (!editor) return;
      const { $from } = editor.state.selection;
      const parentText = $from.parent.textBetween(0, $from.parentOffset);
      // 父文本在文档中的绝对起点，用于把 detect* 返回的相对 offset 换算成绝对位置
      const textStart = $from.pos - $from.parentOffset;

      // 附件：`![[文件名]]` → 弹隐藏文件选择器（优先检测并早退，避免 `![[file]]`
      // 同时被 detectWiki 的 `[[...]]` 误匹配）
      const attach = $from.parent.textBetween(
        Math.max(0, $from.parentOffset - 60),
        $from.parentOffset,
      );
      const attachMatch = attach.match(/!\[\[([^\]]*)\]\]$/);
      if (attachMatch) {
        pendingImageReplace.current = {
          from: $from.pos - attachMatch[0].length,
          to: $from.pos,
          syntax: attachMatch[0],
        };
        setImagePickerOpen(true);
        return;
      }

      // 1) 若存在待转换候选，先判断光标是否已离开其区间。
      //   「离开」= 光标所在段落的文本在光标处不再以该候选的闭括号收尾，即探测器不再命中，
      //   覆盖：回车（光标跳到新段）、向右移出、在后方继续输入等一切「离开」情形。
      const pending = pendingConvertRef.current;
      if (pending) {
        const close = pending.kind === "wiki" ? "]]" : ")";
        // href 闭括号后跟的是 url（`[label](url)` 以 `)` 收尾），与 wiki 不同；直接复用探测器更稳。
        const stillClosing =
          pending.kind === "wiki"
            ? parentText.endsWith(close)
            : detectLink(parentText) !== null;
        if (!stillClosing) {
          pendingConvertRef.current = null;
          await applyConvert(pending);
          return;
        }
      }

      // 2) 继续用当前光标处的收尾语法探测新候选：命中即登记 pending，不立刻转。
      const link = detectLink(parentText);
      const wiki = detectWiki(parentText);
      if (link) {
        const fromAbs = textStart + link.from;
        const toAbs = textStart + link.to;
        if (fromAbs < 0 || toAbs > textStart + $from.parentOffset) return;
        pendingConvertRef.current = {
          from: fromAbs,
          to: toAbs,
          kind: "link",
          label: link.label,
          href: link.href,
        };
      } else if (wiki) {
        const fromAbs = textStart + wiki.from;
        const toAbs = textStart + wiki.to;
        if (fromAbs < 0 || toAbs > textStart + $from.parentOffset) return;
        pendingConvertRef.current = {
          from: fromAbs,
          to: toAbs,
          kind: "wiki",
          label: wiki.label,
          href: "",
        };
      }
    };

    editor.on("selectionUpdate", handleTextInput);
    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleMarkdownTextInput);
    editor.on("update", handleMarkdownTextInput);

    return () => {
      editor.off("selectionUpdate", handleTextInput);
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleMarkdownTextInput);
      editor.off("update", handleMarkdownTextInput);
    };
  }, [editor, slashOpen, adapter]);

  // 移动端键盘自动滚动
  useEffect(() => {
    if (editor) {
      const el = (editor.view.dom as HTMLElement).closest(
        ".ProseMirror",
      ) as HTMLElement;
      return setupKeyboardAutoScroll(el);
    }
  }, [editor]);

  // 编辑器和 docId 就绪后加载已有内容
  useEffect(() => {
    if (!editor || !docId || documentId === "new") return;
    (async () => {
      const loaded = await adapter.loadDocument(docId);
      const doc: DocumentData | null = loaded ?? (await loadDraft());
      if (!doc) return;

      if (doc.contentMdx && doc.contentMdx.trim().length > 0) {
        importMdxContent(doc.contentMdx)
          .then((result) => {
            editor.commands.setContent({
              type: "doc",
              content: result.content,
            });
            lastValidEditorJsonRef.current = editor.getJSON();
          })
          .catch((err) => {
            console.warn("[DocumentEditor] MDX 加载回退到 editorJson:", err);
            if (doc.editorJson) {
              editor.commands.setContent(doc.editorJson);
            }
          });
      } else if (doc.editorJson) {
        editor.commands.setContent(doc.editorJson);
      }
    })();
  }, [
    editor,
    docId,
    documentId,
    loadDraft,
    importMdxContent,
    lastValidEditorJsonRef,
    adapter,
  ]);

  // 模式切换
  const handleModeChange = useCallback(
    async (newMode: EditorMode) => {
      if (newMode === mode) return;

      if (mode === "richtext" && newMode === "source") {
        if (editor) {
          const json = editor.getJSON();
          const doc =
            typeof json === "object" && json !== null && "content" in json
              ? (json as { content: unknown[] }).content
              : [];
          // 同步调用 exportMdx — 内部全是纯计算无网络请求，避免无意义 await
          const result = exportMdx(
            doc as unknown[] as Parameters<typeof exportMdx>[0],
            frontmatterRef.current,
          );
          sourceMdxRef.current = result.mdx;
          lastValidEditorJsonRef.current = editor.getJSON();
        }
      }

      if (mode === "source" && newMode === "richtext") {
        if (sourceKind === "html") {
          if (editor) {
            try {
              editor.commands.setContent(htmlSource);
              lastValidEditorJsonRef.current = editor.getJSON();
            } catch (err) {
              console.warn("[DocumentEditor] HTML 解析失败:", err);
              alert("HTML 解析失败，请检查源码格式后重试");
              return;
            }
          }
        } else {
          try {
            const result = await importMdxContent(sourceMdxRef.current);
            if (editor) {
              editor.commands.clearContent();
              editor.commands.setContent({
                type: "doc",
                content: result.content,
              });
              lastValidEditorJsonRef.current = editor.getJSON();
            }
          } catch (err) {
            console.warn("[DocumentEditor] MDX 手动解析失败:", err);
            alert(t("editor.mdxParseError"));
            return;
          }
        }
      }

      setMode(newMode);
    },
    [
      mode,
      editor,
      exportMdxContent,
      importMdxContent,
      sourceMdxRef,
      frontmatterRef,
      lastValidEditorJsonRef,
      sourceKind,
      htmlSource,
    ],
  );

  const handleSourceChange = useCallback(
    (mdx: string) => {
      sourceMdxRef.current = mdx;
      // 源码模式要落盘的是用户刚输入的 MDX 本身（第二个参数），
      // 且绝不能回退成 `{}`：那会让 exportMdx 产出空串，把磁盘上的文档写空。
      if (docId && lastValidEditorJsonRef.current) {
        triggerSave(lastValidEditorJsonRef.current, mdx);
      }
    },
    [docId, triggerSave, sourceMdxRef, lastValidEditorJsonRef],
  );

  const handleHtmlSourceChange = useCallback((html: string) => {
    setHtmlSource(html);
  }, []);

  const handlePublish = useCallback(
    async (title: string, slug: string) => {
      if (!docId) return;
      const doc = await adapter.loadDocument(docId);
      if (doc) {
        // 发布时落库 slug（未填则沿用既有 slug，供 wiki 双链 /docs/<slug> 解析）
        const updated: DocumentData = {
          ...doc,
          title,
          slug: slug || doc.slug,
          status: "published",
          updatedAt: new Date().toISOString(),
        };
        await adapter.saveDocument(updated);
        await adapter.saveVersion(docId, updated, t("editor.publish"));
        setRefreshKey((k) => k + 1);
      }
      setPublishOpen(false);
    },
    [docId, adapter],
  );

  const handleComment = useCallback(
    (from: number, to: number, text: string) => {
      if (!editor || !docId || !adapter.addThread) return;
      const threadId = crypto.randomUUID();
      editor
        .chain()
        .focus()
        // 标记必须落在与线程相同的区间上：只标记当前选区会让落库的 range
        // 与高亮位置不一致，后续点击高亮/恢复会定位到别的文本
        .setTextSelection({ from, to })
        .setMark("commentMark", { threadId, resolved: "false" })
        .run();
      adapter.addThread(docId, { from, to }, text);
      setCommentPanelOpen(true);
    },
    [editor, docId, adapter],
  );

  const handleCommentHighlightClick = useCallback(
    (_range: { from: number; to: number }) => {
      // 滚动编辑器到评论位置
      // 目前仅切换面板
    },
    [],
  );

  const handleRestoreVersion = useCallback(
    (version: VersionEntry) => {
      if (!editor) return;
      if (version.editorJson && typeof version.editorJson === "object") {
        editor.commands.clearContent();
        editor.commands.setContent(version.editorJson);
        if (docId) {
          triggerSave(version.editorJson);
        }
        setRefreshKey((k) => k + 1);
        setVersionPanelOpen(false);
      }
    },
    [editor, docId, triggerSave],
  );

  // rAF 延迟计算 metrics，避免同步递归遍历阻塞输入
  const [metrics, setMetrics] = useState({ characters: 0, words: 0 });
  const metricsRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editor) return;
    if (metricsRafRef.current) cancelAnimationFrame(metricsRafRef.current);
    metricsRafRef.current = requestAnimationFrame(() => {
      setMetrics(
        computeTextMetrics(editor.getJSON() as Record<string, unknown>),
      );
    });
    return () => {
      if (metricsRafRef.current) cancelAnimationFrame(metricsRafRef.current);
    };
  }, [editor?.state.doc]);

  const charCount = metrics.characters;
  const wordCount = metrics.words;

  // Git 系列写作：显式"保存到系列"——立即把当前内容经 git adapter 写回 series 仓库。
  // 复用 useEditorPersistence 的 flushImmediate（内部走 triggerSave → doSave），不另起一套保存逻辑。
  const handleSaveToSeries = useCallback((): void => {
    const json = editor?.getJSON();
    const content: Record<string, unknown> | null =
      json && typeof json === "object"
        ? (json as Record<string, unknown>)
        : lastValidEditorJsonRef.current;
    if (!content) return;
    flushImmediate(content);
  }, [editor, lastValidEditorJsonRef, flushImmediate]);

  /**
   * 打开"发布为文章"确认框，并预填元数据。
   * 预填来源：当前 frontmatter 的 slug/category/tags（loaded 时记录在 frontmatterRef）；
   * 缺失则 slug 用当前 filepath 去扩展名 或 由标题派生，category 默认 engineering。
   */
  const openPublishArticle = useCallback((): void => {
    const fm = frontmatterRef.current ?? {};
    const fmSlug = typeof fm.slug === "string" ? fm.slug : "";
    const fmCategory = typeof fm.category === "string" ? fm.category : "";
    const fmTags = Array.isArray(fm.tags)
      ? fm.tags.filter((x): x is string => typeof x === "string")
      : [];

    const filepath = docId === "new" ? "" : docId;
    const fileSlug = filepath
      ? (filepath
          .split("/")
          .pop()
          ?.replace(/\.(mdx|md)$/, "") ?? "")
      : "";
    // 标题从当前 MDX 首行取；无则回退未命名
    const title =
      firstHeadingTitle(sourceMdxRef.current) || t("editor.untitled");

    setPublishArticleInitial({
      slug: fmSlug || fileSlug || deriveSlug(title),
      category: fmCategory || "engineering",
      tags: fmTags,
    });
    setPublishArticleOpen(true);
  }, [docId, frontmatterRef, sourceMdxRef]);

  /**
   * 确认发布为文章：调 blogApi.publishSeriesFile(seriesId, filepath, override)。
   * 未保存（docId==="new"）先按当前内容派生 filepath 写入再发布。
   */
  const handlePublishArticle = useCallback(
    async (slug: string, category: string, tags: string[]): Promise<void> => {
      if (seriesId === undefined) return;
      setPublishingArticle(true);
      try {
        // 生成当前编辑内容的 MDX（与 autosave 的 exportMdx 一致）
        const json = editor?.getJSON() ?? lastValidEditorJsonRef.current;
        const nodes =
          json && typeof json === "object" && "content" in json
            ? (json as { content: unknown[] }).content
            : [];
        const mdx = exportMdx(
          nodes as Parameters<typeof exportMdx>[0],
          frontmatterRef.current,
        ).mdx;

        let filepath = docId;
        if (filepath === "new") {
          // 未保存：以选定的 slug 派生 filepath，先写入 series 仓库再发布
          filepath = `${slug || "post"}.mdx`;
          const saved = await blogApi.putSeriesFile(
            seriesId,
            filepath,
            mdx,
            "save",
          );
          if (saved.isErr()) {
            console.warn("[DocumentEditor] 发布前保存失败:", saved.error);
            // 这里是写 series 仓库失败，不是 MDX 解析失败：报 mdxParseError 会误导用户去改正文
            window.alert(saved.error.message || t("editor.mdxParseError"));
            return;
          }
          // 文件已在 series 内落盘，把 docId 固定成这个 filepath（git-persistence 的 docId 即 filepath），
          // 否则后续 autosave/再次发布仍按 docId==="new" 从标题重新派生 slug，
          // 标题或 slug 一变就会写出第二个文件
          setDocId(filepath);
        }

        const result = await blogApi.publishSeriesFile(seriesId, filepath, {
          slug,
          category,
          tags,
        });
        if (result.isErr()) {
          console.warn("[DocumentEditor] 发布为文章失败:", result.error);
          window.alert(result.error.message || t("editor.mdxParseError"));
          return;
        }
        window.alert(t("editor.publishArticleSuccess"));
        setPublishArticleOpen(false);
      } finally {
        setPublishingArticle(false);
      }
    },
    [seriesId, docId, editor, lastValidEditorJsonRef, frontmatterRef],
  );

  // 进入源码模式时，基于当前编辑器内容初始化 HTML 源码（TipTap 原生 HTML，可回写）
  useEffect(() => {
    if (mode === "source" && editor) {
      setHtmlSource(editor.getHTML());
    }
  }, [mode, editor]);

  return (
    <div className="rte-container">
      {/* Tier 1: sticky 顶栏容器（两行一起固定） */}
      <div className="rte-topbar">
        {/* 上行：状态 + 操作按钮 */}
        <div className="rte-statusbar">
          <SaveStatusIndicator
            status={saveStatus}
            charCount={mode === "richtext" ? charCount : undefined}
            wordCount={mode === "richtext" ? wordCount : undefined}
          />
          <div className="flex items-center gap-1 md:gap-2">
            {editor && <ExportMenu editor={editor} />}
            {docId && <BackupMenu adapter={adapter} />}
            {editor && (
              <button
                type="button"
                className={
                  aiPanelOpen
                    ? "rte-toolbar-btn is-active"
                    : "rte-btn rte-btn--ghost rte-btn--xs"
                }
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                title="AI 助手"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" />
                </svg>
              </button>
            )}
            {docId && mode === "richtext" && (
              <>
                <button
                  type="button"
                  className={
                    commentPanelOpen
                      ? "rte-toolbar-btn is-active"
                      : "rte-btn rte-btn--ghost rte-btn--xs"
                  }
                  onClick={() => {
                    setCommentPanelOpen(!commentPanelOpen);
                    setVersionPanelOpen(false);
                  }}
                  title={t("editor.comments")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {t("editor.comments")}
                </button>
                <button
                  type="button"
                  className="rte-btn rte-btn--ghost rte-btn--xs"
                  onClick={() => {
                    setVersionPanelOpen(!versionPanelOpen);
                    setCommentPanelOpen(false);
                  }}
                  title={t("editor.version")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M12 7v5l4 2" />
                  </svg>
                  {t("editor.version")}
                </button>
              </>
            )}
            {docId && (
              <div key={refreshKey}>
                <PublishButton
                  documentId={docId}
                  adapter={adapter}
                  onStatusChange={() => setRefreshKey((k) => k + 1)}
                  onOpenPublishDialog={() => setPublishOpen(true)}
                />
              </div>
            )}
            {gitMode && (
              <>
                <button
                  type="button"
                  className="rte-btn rte-btn--primary rte-btn--xs"
                  onClick={handleSaveToSeries}
                  title={t("editor.saveToSeries")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <path d="M17 21v-8H7v8" />
                    <path d="M7 3v5h8" />
                  </svg>
                  {t("editor.saveToSeries")}
                </button>
                <button
                  type="button"
                  className="rte-btn rte-btn--primary rte-btn--xs"
                  onClick={openPublishArticle}
                  title={t("editor.publishAsArticle")}
                  disabled={publishingArticle}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 2 11 13" />
                    <path d="M22 2 15 22l-4-9-9-4Z" />
                  </svg>
                  {t("editor.publishAsArticle")}
                </button>
              </>
            )}
            <FullscreenButton />
            <ModeTabs mode={mode} onModeChange={handleModeChange} />
          </div>
        </div>

        {/* 下行：格式化工具栏（仅 richtext 模式显示） */}
        {mode === "richtext" && editor && <EditorToolbar editor={editor} />}
      </div>

      {/* 编辑器内容区域 */}
      {mode === "richtext" && editor ? (
        <div className="rte-editor-area">
          <div className="rte-editor-main">
            <BubbleMenuWrapper editor={editor} onComment={handleComment} />
            {slashOpen && (
              <SlashMenu
                editor={editor}
                query={slashQuery}
                position={slashPos}
                onClose={() => setSlashOpen(false)}
                onSelect={() => setSlashOpen(false)}
                // AI 条目原先只有空 action：选中后菜单关闭但什么都没发生。
                // 这里接上 AI 面板（AiAssistant 暂不支持按操作预设，故 intent 不向下传）
                onAiRequest={() => setAiPanelOpen(true)}
              />
            )}
            <EditorContent editor={editor} />
          </div>
          {commentPanelOpen ? (
            <CommentPanel
              documentId={docId}
              adapter={adapter}
              onClose={() => setCommentPanelOpen(false)}
              onHighlightClick={handleCommentHighlightClick}
            />
          ) : versionPanelOpen ? (
            <VersionHistoryPanel
              documentId={docId}
              adapter={adapter}
              onRestore={handleRestoreVersion}
              onClose={() => setVersionPanelOpen(false)}
            />
          ) : (
            <Suspense fallback={null}>
              <PropertyPanel editor={editor} />
            </Suspense>
          )}
        </div>
      ) : mode === "source" ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center gap-1 p-2 border-b border-surface-3 shrink-0">
            <button
              type="button"
              className={`rte-mode-tab ${sourceKind === "mdx" ? "is-active" : ""}`}
              onClick={() => setSourceKind("mdx")}
            >
              MDX
            </button>
            <button
              type="button"
              className={`rte-mode-tab ${sourceKind === "html" ? "is-active" : ""}`}
              onClick={() => setSourceKind("html")}
            >
              HTML
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <Suspense
              fallback={
                <div className="rte-loading">
                  <div className="rte-spinner" />
                </div>
              }
            >
              {sourceKind === "mdx" ? (
                <SourceEditor
                  key="mdx"
                  value={sourceMdxRef.current}
                  onChange={handleSourceChange}
                />
              ) : (
                <SourceEditor
                  key="html"
                  value={htmlSource}
                  onChange={handleHtmlSourceChange}
                />
              )}
            </Suspense>
          </div>
        </div>
      ) : mode === "preview" && editor ? (
        <PreviewPanel editor={editor} />
      ) : (
        <div className="rte-loading">
          <div className="rte-spinner" />
          <span>{t("editor.loadingEditor")}</span>
        </div>
      )}

      {publishOpen && (
        <Suspense fallback={null}>
          <PublishDialog
            currentTitle={""}
            onConfirm={handlePublish}
            onCancel={() => setPublishOpen(false)}
          />
        </Suspense>
      )}

      {publishArticleOpen && (
        <PublishArticleDialog
          initialSlug={publishArticleInitial.slug}
          initialCategory={publishArticleInitial.category}
          initialTags={publishArticleInitial.tags}
          publishing={publishingArticle}
          onConfirm={handlePublishArticle}
          onCancel={() => {
            if (publishingArticle) return;
            setPublishArticleOpen(false);
          }}
        />
      )}

      {aiPanelOpen && (
        <Suspense fallback={null}>
          <AiAssistant editor={editor!} onClose={() => setAiPanelOpen(false)} />
        </Suspense>
      )}

      {imagePickerOpen && (
        <ObsidianImagePicker
          onSelect={(file) => {
            setImagePickerOpen(false);
            const pending = pendingImageReplace.current;
            pendingImageReplace.current = null;
            if (!editor || !pending) return;
            if (!file) {
              // 取消选图：保持 `![[文件名]]` 文本原样，不改动
              return;
            }
            // 选图是异步的，期间用户/光标可能位移，不能用探测时存死的绝对区间。
            // 依据原始 `![[文件名]]` 串在文档中重新定位：必须逐个文本节点取绝对位置，
            // doc.textBetween 拼出的全文在块之间没有分隔符，其字符偏移与 pos 会错位，
            // 直接拿偏移当 pos 传给 setTextSelection 会在多块文档里替换到错误位置。
            void (async () => {
              const hits: number[] = [];
              editor.state.doc.nodesBetween(
                0,
                editor.state.doc.content.size,
                (node, pos) => {
                  if (!node.isText) return true;
                  const idx = (node.text ?? "").indexOf(pending.syntax);
                  if (idx >= 0) hits.push(pos + idx);
                  return true;
                },
              );
              // 优先取原位之后的第一处（光标向前移过的情况），否则回退到最前一处
              const hit =
                hits.find((p) => p >= pending.from) ?? hits[0] ?? null;
              let from = pending.from;
              let to = pending.to;
              if (hit !== null) {
                from = hit;
                to = hit + pending.syntax.length;
              }
              if (from < 0 || to > editor.state.doc.content.size || from >= to)
                return;
              // 附件 `![[文件名]]` 复用：先按原始文件名查是否已有同名的已存图片，
              // 命中则直接复用它（避免对同名附件重复占用 IndexedDB 存储），未命中才新建并建 orgName 索引。
              const reusedRef = await findImageByOrgName(file.name);
              const ref = reusedRef ?? (await saveImageBlob(file, file.name));
              if (!editor.isDestroyed) {
                editor
                  .chain()
                  .focus()
                  .setTextSelection({ from, to })
                  .insertContent({ type: "image", attrs: { src: ref } })
                  .run();
              }
            })();
          }}
        />
      )}
    </div>
  );
}
