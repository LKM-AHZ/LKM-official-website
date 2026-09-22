import { ok, err } from "neverthrow";
import type { Result } from "neverthrow";
import { t } from "~/lib/i18n";
import type {
  DocumentData,
  DocumentMeta,
  DocumentSummary,
  AutosavePayload,
  AutosaveResponse,
} from "../engine/types";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const DRAFTS_KEY = "lkm-editor-drafts";
const DRAFTS_INDEX_KEY = "lkm-editor-drafts-index";

// 内存缓存：减少 autosave 高频触发的 JSON.parse 开销
let draftsCache: Record<string, DocumentData> | null = null;
let indexCache: DocumentMeta[] | null = null;

function readDrafts(): Record<string, DocumentData> {
  if (draftsCache) return draftsCache;
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    draftsCache = raw ? JSON.parse(raw) : {};
  } catch (e) {
    // 参数不能叫 err：会遮蔽 neverthrow 的 err() 构造器，将来在这里包 AppError 会变成 TypeError
    console.warn("[document-api] readDrafts 失败:", e);
    draftsCache = {};
  }
  return draftsCache ?? {};
}

function writeDrafts(
  drafts: Record<string, DocumentData>,
): Result<void, AppError> {
  try {
    // 先落盘再提交内存缓存：反过来的话写失败内存已脏，后续读会看到未持久化的数据
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    draftsCache = drafts;
    return ok(undefined);
  } catch (e) {
    return err(
      new AppError("DB_WRITE_FAILED", t("editor.persistence.writeFailed"), e),
    );
  }
}

function readIndex(): DocumentMeta[] {
  if (indexCache) return indexCache;
  try {
    const raw = localStorage.getItem(DRAFTS_INDEX_KEY);
    indexCache = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("[document-api] readIndex 失败:", e);
    indexCache = [];
  }
  return indexCache ?? [];
}

function writeIndex(index: DocumentMeta[]): Result<void, AppError> {
  try {
    // 同上：先落盘再提交缓存
    localStorage.setItem(DRAFTS_INDEX_KEY, JSON.stringify(index));
    indexCache = index;
    return ok(undefined);
  } catch (e) {
    return err(
      new AppError(
        "DB_WRITE_FAILED",
        t("editor.persistence.writeIndexFailed"),
        e,
      ),
    );
  }
}

export function getDocument(id: string): DocumentData | null {
  try {
    const drafts = readDrafts();
    return drafts[id] ?? null;
  } catch (e) {
    console.warn("[document-api] getDocument 失败:", e);
    return null;
  }
}

/** 索引条目的唯一构造点：字段集在多处写盘路径必须一致，否则索引会随实现漂移 */
function toMeta(doc: DocumentData): DocumentMeta {
  return {
    id: doc.id,
    title: doc.title,
    lastModified: doc.lastModified,
    status: doc.status,
    version: doc.version,
    slug: doc.slug,
  };
}

export function listDocuments(): DocumentSummary[] {
  // 返回副本：readIndex() 给的是模块级缓存数组的引用，调用方一次 sort/splice 就会改写
  // 持久化层的内部状态，并被后续写盘一起序列化
  return readIndex().map((m) => ({ ...m }));
}

export function createDocument(title?: string): Result<DocumentData, AppError> {
  try {
    const now = new Date().toISOString();
    const doc: DocumentData = {
      id: crypto.randomUUID(),
      title: title ?? t("editor.untitled"),
      contentMdx: "",
      editorJson: null,
      status: "draft",
      version: 1,
      lastModified: now,
      createdAt: now,
      updatedAt: now,
    };

    const drafts = readDrafts();
    drafts[doc.id] = doc;
    const wd = writeDrafts(drafts);
    if (!wd.isOk()) return err(wd.error);

    const index = readIndex();
    // 索引一并落 slug，供 wiki 双链 `/docs/<slug>` 解析使用（slug 贯通存储层）
    index.unshift(toMeta(doc));
    // 索引写失败必须报错：只看草稿写入成功会返回 ok，而文档在列表里根本不存在
    const wi = writeIndex(index);
    if (!wi.isOk()) return err(wi.error);
    return ok(doc);
  } catch (e) {
    return err(
      new AppError("DB_WRITE_FAILED", t("editor.persistence.createFailed"), e),
    );
  }
}

export function updateDocument(
  id: string,
  data: Partial<DocumentData>,
): Result<DocumentData | null, AppError> {
  try {
    const drafts = readDrafts();
    const existing = drafts[id];
    if (!existing) return ok(null);

    // 剔除调用方能覆盖的内部关键字段：patch 里带新 id 会让 drafts[id] 与 updated.id 错位
    // （索引里写的是新 id，草稿按新 id 查不到也删不掉）；覆盖 version 会绕过乐观并发控制。
    const {
      id: _ignoredId,
      version: _ignoredVersion,
      createdAt,
      ...patch
    } = data;
    void _ignoredId;
    void _ignoredVersion;
    const now = new Date().toISOString();
    const updated: DocumentData = {
      ...existing,
      ...patch,
      id,
      createdAt: createdAt ?? existing.createdAt,
      updatedAt: now,
      lastModified: now,
    };
    drafts[id] = updated;
    const wd = writeDrafts(drafts);
    if (!wd.isOk()) return err(wd.error);

    const index = readIndex();
    const idx = index.findIndex((m) => m.id === id);
    // 与 upsertDocument 一致做 upsert：此前某次 writeIndex 失败会留下「有草稿、无索引」的文档，
    // 只在命中时更新的话这条索引永远补不回来，列表与草稿持续漂移。
    // 索引一并同步 slug，避免发布后索引缺失 slug 导致 wiki 双链 unresolved
    if (idx !== -1) index[idx] = toMeta(updated);
    else index.unshift(toMeta(updated));
    writeIndex(index);

    return ok(updated);
  } catch (e) {
    return err(
      new AppError("DB_WRITE_FAILED", t("editor.persistence.updateFailed"), e),
    );
  }
}

/**
 * 按调用方给定的 id 落库完整文档（不存在则新建）。
 * 不能用 createDocument 代替：它会另生成 crypto.randomUUID()，导致调用方持有的 id
 * 与库内 id 不一致 —— 每次自动保存都查不到、每次都新建一份幽灵文档，正文也全丢。
 */
export function upsertDocument(
  doc: DocumentData,
): Result<DocumentData, AppError> {
  try {
    const drafts = readDrafts();
    drafts[doc.id] = doc;
    const wd = writeDrafts(drafts);
    if (!wd.isOk()) return err(wd.error);

    const index = readIndex();
    const idx = index.findIndex((m) => m.id === doc.id);
    const meta = toMeta(doc);
    if (idx !== -1) {
      index[idx] = meta;
    } else {
      index.unshift(meta);
    }
    const wi = writeIndex(index);
    if (!wi.isOk()) return err(wi.error);

    return ok(doc);
  } catch (e) {
    return err(
      new AppError("DB_WRITE_FAILED", t("editor.persistence.updateFailed"), e),
    );
  }
}

export function autosave(
  id: string,
  payload: AutosavePayload,
): AutosaveResponse {
  const drafts = readDrafts();
  const existing = drafts[id];

  if (existing && existing.version !== payload.baseVersion) {
    return {
      ok: false,
      version: existing.version,
      code: "VERSION_CONFLICT",
      currentVersion: existing.version,
    };
  }

  const now = new Date().toISOString();
  const newVersion = (existing?.version ?? 0) + 1;

  const doc: DocumentData = {
    id,
    title: existing?.title ?? t("editor.untitled"),
    contentMdx: payload.contentMdx,
    editorJson: payload.editorJson,
    status: existing?.status ?? "draft",
    // 保留既有 slug，autosave 不丢发布信息
    slug: existing?.slug,
    version: newVersion,
    lastModified: now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  drafts[id] = doc;
  // 写盘失败不能仍回 ok:true：上层会以为已保存，实际什么都没落盘
  if (!writeDrafts(drafts).isOk())
    return { ok: false, version: existing?.version ?? 0 };

  const index = readIndex();
  const idx = index.findIndex((m) => m.id === id);
  const meta = toMeta(doc);
  if (idx !== -1) {
    index[idx] = meta;
  } else {
    index.unshift(meta);
  }
  // 索引写失败同样不能报成功（列表里查不到这篇文档）
  if (!writeIndex(index).isOk())
    return { ok: false, version: existing?.version ?? 0 };

  return { ok: true, version: newVersion };
}

export function deleteDocument(id: string): Result<void, AppError> {
  try {
    const drafts = readDrafts();
    delete drafts[id];
    const wd = writeDrafts(drafts);
    if (!wd.isOk()) return wd;

    const index = readIndex();
    return writeIndex(index.filter((m) => m.id !== id));
  } catch (e) {
    return err(
      new AppError("DB_DELETE_FAILED", t("editor.persistence.deleteFailed"), e),
    );
  }
}
