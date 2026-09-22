import { t } from "~/lib/i18n";
import { buildUrl } from "./paths";

/**
 * 路径比较用的归一化：去掉首尾斜杠 + 忽略大小写。
 * 大小写不敏感是**刻意**的：本站路由（blog/archive 等）由我们固定生成，
 * 但地址栏手输、外链回跳可能带任意大小写，按大小写敏感比较会让导航高亮失效。
 * 查询串/哈希不参与比较：该函数只用于判断「是不是同一个页面」。
 */
const normalizePath = (p: string): string =>
  p.replace(/^\/+|\/+$/g, "").toLowerCase();

export function pathsEqual(path1: string, path2: string): boolean {
  return normalizePath(path1) === normalizePath(path2);
}

export function getPostUrlBySlug(slug: string): string {
  // 与 getTagUrl/getCategoryUrl 保持一致：slug 里可能含空格、#、?、../ 等，
  // 不编码会产出畸形或可越权的路径
  return buildUrl(`/blog/posts/${encodeURIComponent(slug)}/`);
}

export function getTagUrl(tag: string): string {
  if (!tag) return buildUrl("/blog/archive/");
  return buildUrl(`/blog/archive/?tag=${encodeURIComponent(tag.trim())}`);
}

export function getCategoryUrl(category: string | null): string {
  if (
    !category ||
    category.trim() === "" ||
    category.trim().toLowerCase() === t("blog.uncategorized").toLowerCase()
  )
    return buildUrl("/blog/archive/?uncategorized=true");
  return buildUrl(
    `/blog/archive/?category=${encodeURIComponent(category.trim())}`,
  );
}

export function getDir(path: string): string {
  const lastSlashIndex = path.lastIndexOf("/");
  if (lastSlashIndex < 0) {
    return "/";
  }
  return path.substring(0, lastSlashIndex + 1);
}

export function url(path: string): string {
  return buildUrl(path);
}
