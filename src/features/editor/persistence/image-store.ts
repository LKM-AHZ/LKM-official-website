import Dexie, { type EntityTable } from "dexie";

export interface ImageRecord {
  id: string;
  blob: Blob;
  mime: string;
  width?: number;
  height?: number;
  /** 图片原始文件名，用于 `![[文件名]]` 附件语法复用 */
  orgName?: string;
  createdAt: string;
}

type ImageDb = Dexie & { images: EntityTable<ImageRecord, "id"> };

// 惰性建库：模块导入期就 new Dexie 会在 SSR / 禁用 IndexedDB 的环境直接抛错，
// 把整条 import 链一起拖垮，任何守卫都来不及跑
let imageDbCache: ImageDb | null = null;

function imageDb(): ImageDb {
  if (typeof indexedDB === "undefined") {
    throw new Error("当前环境不支持 IndexedDB，图片本地存储不可用");
  }
  if (!imageDbCache) {
    const db = new Dexie("lkm-editor-images") as ImageDb;
    db.version(1).stores({ images: "id, createdAt, orgName" });
    imageDbCache = db;
  }
  return imageDbCache;
}

/**
 * 图片引用前缀。
 * 不用 `blob:`：那是原生 ObjectURL 的 scheme（`URL.createObjectURL` 产出 `blob:http://host/<uuid>`），
 * 会被 isBlobRef 误判成内部引用、再被当作 id 去查库并静默解析成空串。
 */
export const BLOB_REF_PREFIX = "idb:";

function isBlobRef(src: string): boolean {
  return src.startsWith(BLOB_REF_PREFIX);
}

/** 从 blob 引用 id 中提取图片 id */
function parseBlobRefId(src: string): string | null {
  if (!isBlobRef(src)) return null;
  const id = src.slice(BLOB_REF_PREFIX.length);
  return id || null;
}

/**
 * 持久化一张图片 blob，返回 blob 引用 id（例如 `blob:abc-123`）。
 * 可选传入原始文件名 orgName 写入索引，供 `![[文件名]]` 附件语法按名复用。
 */
export async function saveImageBlob(
  blob: Blob,
  orgName?: string,
): Promise<string> {
  const id = crypto.randomUUID();
  let width: number | undefined;
  let height: number | undefined;

  // 尝试读取图片原始尺寸，做轻量元数据（失败则忽略）
  try {
    const bitmap = await createImageBitmap(blob);
    try {
      width = bitmap.width;
      height = bitmap.height;
    } finally {
      // 即使读宽高抛错也要释放：bitmap 持有解码后的像素内存
      bitmap.close();
    }
  } catch {
    // 非浏览器环境或解析失败，忽略
  }

  const record: ImageRecord = {
    id,
    blob,
    mime: blob.type || "application/octet-stream",
    width,
    height,
    createdAt: new Date().toISOString(),
  };
  if (orgName) record.orgName = orgName;
  try {
    await imageDb().images.put(record);
  } catch (err) {
    // 配额超限 / DB 被阻止时抛裸 Dexie 错误，粘贴图片会静默失败且留下取不到的 id。
    // 原始错误用 cause 保留：只把 message 拼进文案会让上层拿不到原始对象与栈
    console.warn("[image-store] 保存图片失败:", err);
    throw new Error("保存图片失败（本地存储不可用或已满）", { cause: err });
  }
  return BLOB_REF_PREFIX + id;
}

const objectUrlCache = new Map<string, string>();
// 正在生成 ObjectURL 的并发调用：同一 id 被多个渲染 effect 同时请求时，
// 各自都会 createObjectURL 并 set，后写的覆盖先写的 → 前一个 URL 永久泄漏
const objectUrlInflight = new Map<string, Promise<string>>();

/**
 * 把图片 src 解析为可展示的 URL。
 * - `blob:<id>` → 从 IndexedDB 读取 blob 生成 ObjectURL（带内存缓存，刷新后重新生成）
 * - 其它（http/https/data 等）→ 原样返回
 */
export async function resolveImageSrc(src: string): Promise<string> {
  const id = parseBlobRefId(src);
  if (!id) return src;

  const cached = objectUrlCache.get(id);
  if (cached) return cached;

  const inflight = objectUrlInflight.get(id);
  if (inflight) return inflight;

  const pending = (async () => {
    try {
      const record = await imageDb().images.get(id);
      if (!record) {
        // 记录缺失（已清理/换设备）不能静默：调用方会把 "" 直接赋给 <img src>，
        // 用户只看到空白图、没有任何线索
        console.warn("[image-store] 图片记录不存在:", id);
        return "";
      }
      const url = URL.createObjectURL(record.blob);
      objectUrlCache.set(id, url);
      return url;
    } finally {
      objectUrlInflight.delete(id);
    }
  })();
  objectUrlInflight.set(id, pending);
  return pending;
}

/**
 * 按原始文件名查图片，返回引用 id 或 null（供 `![[文件名]]` 复用）。
 * orgName 索引允许重复，`.first()` 取到的是任意一条 → 这里按 createdAt 升序取最早的一张，
 * 保证同一份数据在不同机器/不同运行下结果一致。
 */
export async function findImageByOrgName(
  orgName: string,
): Promise<string | null> {
  if (!orgName) return null;
  const matches = await imageDb()
    .images.where("orgName")
    .equals(orgName)
    .sortBy("createdAt");
  const [match] = matches;
  return match ? BLOB_REF_PREFIX + match.id : null;
}

/**
 * 删除多张 blob 引用图片（释放 IndexedDB 占用）。供删除文档等场景调用。
 *
 * 注意：本函数按 id 无条件删除，不判断该 blob 是否仍被其它文档引用
 * （`![[文件名]]` 复用或同一 id 出现在多份文档里）。调用方若要避免删掉仍在用的图片，
 * 需先跨文档收敛出「不再被任何剩余文档引用」的 id 再传进来。
 */
export async function deleteImageBlobs(srcList: string[]): Promise<void> {
  // 同一 src 重复出现时只处理一次，避免重复查删
  const ids = new Set(
    srcList
      .map((src) => parseBlobRefId(src))
      .filter((id): id is string => !!id),
  );
  await Promise.all(
    [...ids].map(async (id) => {
      const url = objectUrlCache.get(id);
      if (url) {
        URL.revokeObjectURL(url);
        objectUrlCache.delete(id);
      }
      await imageDb().images.delete(id);
    }),
  );
}

/** 遍历 editorJson 的最大深度：正常文档远达不到，用于兜住异常结构 */
const MAX_WALK_DEPTH = 100;

/** 从文档 editorJson 中收集所有图片 src（用于清理）。去重，并防环/限深。 */
export function collectImageSrcs(editorJson: unknown): string[] {
  const result = new Set<string>();
  const visited = new WeakSet<object>();
  const walk = (value: unknown, depth = 0): void => {
    if (value === null || value === undefined || depth > MAX_WALK_DEPTH) return;
    if (Array.isArray(value)) {
      value.forEach((item) => walk(item, depth + 1));
      return;
    }
    if (typeof value !== "object") return;
    // 同一对象被多处引用或成环时只走一次，避免无限递归与重复收集
    if (visited.has(value)) return;
    visited.add(value);
    const obj = value as Record<string, unknown>;
    const attrs = (obj.attrs ?? {}) as Record<string, unknown>;
    if (obj.type === "image" && typeof attrs.src === "string") {
      result.add(attrs.src);
    }
    for (const v of Object.values(obj)) walk(v, depth + 1);
  };
  walk(editorJson);
  return [...result];
}
