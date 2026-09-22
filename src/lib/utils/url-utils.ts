import { t } from "~/lib/i18n";
import { buildUrl } from "./paths";

export function pathsEqual(path1: string, path2: string): boolean {
  const normalizedPath1 = path1.replace(/^\/|\/$/g, "").toLowerCase();
  const normalizedPath2 = path2.replace(/^\/|\/$/g, "").toLowerCase();
  return normalizedPath1 === normalizedPath2;
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
