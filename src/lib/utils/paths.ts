import { SITE, APP_BLOG } from "~/lib/config";
import { trim } from "./utils";

// ── 内部 helpers ──

export const trimSlash = (s: string): string => trim(trim(s, "/"), "/");

// ── 纯字符串拼接 ──

export function joinPaths(...parts: string[]): string {
  const joined = parts.join("/");
  // 只合并“路径分隔符”产生的重复斜杠：scheme 后的 `//`（https://）和协议相对
  // URL 开头的 `//` 必须保留，否则传入完整 URL 的 base 会被破坏（https:/x）
  return joined
    .replace(/([a-z][a-z0-9+.-]*:)\/{2,}/gi, "$1//")
    .replace(/(?<!:)\/{2,}/g, "/");
}

// ── Web URL 拼接（编译时 BASE_URL） ──

export function buildUrl(path: string): string {
  return joinPaths("", import.meta.env.BASE_URL, path);
}

// ── Permalink 拼接 ──

const BASE_PATHNAME = SITE.base || "/";

/** 内容集合目录（与 content glob 的约定同步；目录一旦调整只改这一处） */
const CONTENT_POSTS_DIR = "content/posts/";

export const BLOG_BASE = trimSlash(
  (APP_BLOG?.list?.pathname as string) ?? "blog",
);
export const CATEGORY_BASE = trimSlash(
  (APP_BLOG?.category?.pathname as string) ?? "category",
);
export const TAG_BASE = trimSlash((APP_BLOG?.tag?.pathname as string) ?? "tag");

export interface BuildPermalinkOptions {
  type?: "page" | "post" | "category" | "tag" | "asset" | "blog" | "home";
  trailingSlash?: boolean;
}

export function buildPermalink(
  slug: string,
  options: BuildPermalinkOptions = {},
): string {
  const { type = "page", trailingSlash } = options;
  const useTrailingSlash = trailingSlash ?? SITE.trailingSlash ?? false;

  // 任意 scheme（http/https/mailto/tel/data…，大小写不敏感）与协议相对 URL 原样放行；
  // 可执行的 javascript:/vbscript: 替换成占位符，避免输出到 href
  if (/^[a-z][a-z0-9+.-]*:/i.test(slug) || slug.startsWith("//")) {
    return /^\s*(javascript|vbscript):/i.test(slug) ? "#" : slug;
  }
  if (slug.startsWith("#")) {
    return slug;
  }

  const hashIndex = slug.indexOf("#");
  if (hashIndex > 0) {
    const pathPart = slug.substring(0, hashIndex);
    const hashPart = slug.substring(hashIndex);
    return buildPermalink(pathPart, { type, trailingSlash }) + hashPart;
  }

  let path: string;
  switch (type) {
    case "home":
      path = "";
      break;
    case "blog":
      path = BLOG_BASE;
      break;
    case "asset": {
      const parts = [BASE_PATHNAME, slug]
        .map((el) => trimSlash(el))
        .filter((el) => !!el);
      return "/" + parts.join("/");
    }
    case "category":
      path = joinPaths(CATEGORY_BASE, trimSlash(slug));
      break;
    case "tag":
      path = joinPaths(TAG_BASE, trimSlash(slug));
      break;
    case "post":
      path = trimSlash(slug);
      break;
    case "page":
    default:
      path = slug;
      break;
  }

  const segments = [BASE_PATHNAME, path]
    .map((el) => trimSlash(el))
    .filter((el) => !!el);
  const result = "/" + segments.join("/");

  if (useTrailingSlash && result !== "/") {
    return result.endsWith("/") ? result : result + "/";
  }
  if (!useTrailingSlash && result.endsWith("/") && result !== "/") {
    return result.slice(0, -1);
  }
  return result;
}

// ── 图片 glob 路径 ──

export function getImageGlobBasePath(basePath: string, src: string): string {
  const joined = joinPaths(basePath, src);
  return joined.replace(/\\/g, "/");
}

export function getPostImageBasePath(entryId: string): string {
  const lastSlashIndex = entryId.lastIndexOf("/");
  const dir =
    lastSlashIndex < 0 ? "/" : entryId.substring(0, lastSlashIndex + 1);
  return joinPaths(CONTENT_POSTS_DIR, dir);
}

// ── Auth 运行时路径拼接 ──

/**
 * 使用运行时的 base（window.__BASE_URL__）拼接路径。
 * 适用于 Vue/Svelte 客户端组件，因为编译时 import.meta.env.BASE_URL 不可靠。
 */
export function buildAuthUrl(base: string, path: string): string {
  if (!path) return base.replace(/\/$/, "") || "/";
  return joinPaths(base, path);
}
