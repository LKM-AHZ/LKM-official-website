import type { FileEntry } from "../../../lib/api/modules/file-library";

/**
 * 全局搜索：query 去空白后小写，任一匹配字段（originalName/description/categoryName/
 * uploaderName/tags）包含关键词即命中；query 为空白返回 []。
 */
// 归一化后的检索串按 FileEntry 缓存：搜索在每次键入时都会重跑，
// 逐个文件重新拼字段 + toLowerCase 是 O(文件数 × 字段长度) 的重复开销
const haystackCache = new WeakMap<FileEntry, string>();

function haystackOf(f: FileEntry): string {
  const cached = haystackCache.get(f);
  if (cached !== undefined) return cached;
  const haystack = [
    f.originalName,
    f.description,
    f.categoryName,
    f.uploaderName,
    // tags 来自未校验的 JSON 负载，运行时可能不是数组（类型只保证编译期）
    ...(f.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  haystackCache.set(f, haystack);
  return haystack;
}

export function searchFiles(files: FileEntry[], query: string): FileEntry[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [];
  return files.filter((f) => haystackOf(f).includes(keyword));
}
