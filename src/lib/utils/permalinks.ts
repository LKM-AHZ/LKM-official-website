import slugify from "limax";
import { SITE, APP_BLOG } from "~/lib/config";
import {
  buildPermalink,
  BLOG_BASE,
  CATEGORY_BASE,
  TAG_BASE,
  trimSlash,
} from "./paths";
import type { BuildPermalinkOptions } from "./paths";

export { BLOG_BASE, CATEGORY_BASE, TAG_BASE };

// 不加 `as string`：APP_BLOG 的类型（AppBlogConfig.post.permalink）本就是 string，
// 断言在这里只会挡住「配置类型被改坏」的信号，配置组装点（config/site.ts:175）已做 ?? 兜底
export const POST_PERMALINK_PATTERN = trimSlash(
  APP_BLOG.post.permalink ?? `${BLOG_BASE}/%slug%`,
);

export const getCanonical = (path = ""): string | URL => {
  let url: string;
  try {
    url = String(new URL(path, SITE.site));
  } catch {
    // 畸形 path 或 SITE.site 为空/非法时 new URL 会抛 TypeError。
    // 本函数在关键渲染路径上（Metadata.astro 直接取用），不接住会整页渲染失败。
    return String(path);
  }
  if (SITE.trailingSlash == false && path && url.endsWith("/")) {
    return url.slice(0, -1);
  } else if (SITE.trailingSlash == true && path && !url.endsWith("/")) {
    return url + "/";
  }
  return url;
};

export const getPermalink = (
  slug = "",
  type: BuildPermalinkOptions["type"] = "page",
): string => {
  return buildPermalink(slug, { type });
};

export const getHomePermalink = (): string =>
  buildPermalink("/", { type: "home" });

export const getBlogPermalink = (): string =>
  buildPermalink(BLOG_BASE, { type: "blog" });

export const getAsset = (path: string): string =>
  buildPermalink(path, { type: "asset" });

export const cleanSlug = (text = ""): string =>
  trimSlash(text)
    .split("/")
    .map((slug) => slugify(slug))
    // 连续斜杠或纯符号段 slugify 后会变成空串，不过滤就会出现 "a//b"、"/" 这类畸形 permalink
    .filter((slug) => !!slug)
    .join("/");

type MenuHref = { type?: BuildPermalinkOptions["type"]; url?: string };

export const applyGetPermalinks = (menu: unknown = {}): unknown => {
  if (Array.isArray(menu)) {
    return menu.map((item) => applyGetPermalinks(item));
  } else if (typeof menu === "object" && menu !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(menu)) {
      if (key === "href") {
        if (typeof value === "string") {
          result[key] = getPermalink(value);
        } else if (typeof value === "object" && value !== null) {
          const href = value as MenuHref;
          if (href.type === "home") {
            result[key] = getHomePermalink();
          } else if (href.type === "blog") {
            result[key] = getBlogPermalink();
          } else if (href.type === "asset") {
            result[key] = getAsset(href.url ?? "");
          } else if (href.url) {
            result[key] = getPermalink(href.url, href.type);
          }
        }
      } else {
        result[key] = applyGetPermalinks(value);
      }
    }
    return result;
  }
  return menu;
};

export const transitionName = (prefix: string, permalink: string): string =>
  `${prefix}-${String(permalink)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
