import type { FileEntry } from "../../../lib/api/modules/file-library";

/**
 * 全局搜索：query 去空白后小写，任一匹配字段（originalName/description/categoryName/
 * uploaderName/tags）包含关键词即命中；query 为空白返回 []。
 */
// 归一化后的各字段按 FileEntry 缓存：搜索在每次键入时都会重跑，
// 逐个文件重新收集字段 + toLowerCase 是 O(文件数 × 字段长度) 的重复开销
const fieldsCache = new WeakMap<FileEntry, string[]>();

function fieldsOf(f: FileEntry): string[] {
  const cached = fieldsCache.get(f);
  if (cached !== undefined) return cached;
  const fields = [
    f.originalName,
    f.description,
    f.categoryName,
    f.uploaderName,
    // tags 来自未校验的 JSON 负载，运行时可能不是数组（类型只保证编译期约束）
    ...(Array.isArray(f.tags) ? f.tags : []),
  ].map((v) => (v ?? "").toLowerCase());
  fieldsCache.set(f, fields);
  return fields;
}

export function searchFiles(files: FileEntry[], query: string): FileEntry[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [];
  // 逐字段判定，不能把各字段 join(" ") 成一个串再 includes：那样跨字段的子串也算命中
  //（description 结尾的「文件」+ uploaderName 开头的「A」会被「件 a」命中），
  // 与上面「任一匹配字段包含关键词」的语义不符
  return files.filter((f) => fieldsOf(f).some((v) => v.includes(keyword)));
}
