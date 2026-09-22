import projectConfigRaw from "virtual:config";

// virtual:config 运行时数据无编译期类型 —— 在此唯一断言一次
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const projectConfig = projectConfigRaw as Record<string, any>;

// ── 解析层中间类型（仅内部使用） ──

interface RawOGImage {
  url?: string;
  width?: number;
  height?: number;
}

interface RawMetadata {
  title?: { default?: string; template?: string };
  description?: string;
  robots?: { index?: boolean; follow?: boolean };
  openGraph?: { type?: string; site_name?: string; images?: RawOGImage[] };
  twitter?: { handle?: string; site?: string; cardType?: string };
}

interface RawBlogPost {
  isEnabled?: boolean;
  permalink?: string;
  robots?: { index?: boolean; follow?: boolean };
}

interface RawBlogList {
  isEnabled?: boolean;
  pathname?: string;
  robots?: { index?: boolean; follow?: boolean };
}

interface RawBlog {
  isEnabled?: boolean;
  postsPerPage?: number;
  isRelatedPostsEnabled?: boolean;
  relatedPostsCount?: number;
  post?: RawBlogPost;
  list?: RawBlogList;
  category?: RawBlogList;
  tag?: RawBlogList;
}

// ── 公共配置类型 ──

interface SharedSiteConfig {
  name: string;
  site?: string;
  base?: string;
  trailingSlash?: boolean;
  googleSiteVerificationId?: string;
}

interface I18NConfig {
  language: string;
  textDirection: string;
}

interface MetaDataConfig {
  title: { default: string; template: string };
  description: string;
  robots: { index: boolean; follow: boolean };
  openGraph: {
    type: string;
    site_name?: string;
    images?: { url: string; width: number; height: number }[];
  };
  twitter: { handle?: string; site?: string; cardType?: string };
}

interface AppBlogConfig {
  isEnabled: boolean;
  postsPerPage: number;
  isRelatedPostsEnabled: boolean;
  relatedPostsCount: number;
  post: {
    isEnabled: boolean;
    permalink: string;
    robots: { index: boolean; follow: boolean };
  };
  list: {
    isEnabled: boolean;
    pathname: string;
    robots: { index: boolean; follow: boolean };
  };
  category: {
    isEnabled: boolean;
    pathname: string;
    robots: { index: boolean; follow: boolean };
  };
  tag: {
    isEnabled: boolean;
    pathname: string;
    robots: { index: boolean; follow: boolean };
  };
}

interface SharedUIConfig {
  theme: string;
}

interface SharedAnalyticsConfig {
  vendors: { googleAnalytics: { id?: string } };
}

const site = projectConfig.site ?? {};
const i18n = projectConfig.i18n ?? {};
const metadata = (projectConfig.metadata ?? {}) as RawMetadata;
const apps = projectConfig.apps ?? {};
const blog = (apps.blog ?? {}) as RawBlog;
const uiCfg = projectConfig.ui ?? {};
const analyticsCfg = projectConfig.analytics ?? {};

/** 配置里的数值是非类型化输入：字符串/0/负数/null 会直接破坏下游分页逻辑，
 *  统一规整为正整数，无法规整时回退默认值。 */
function toPositiveInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export const SITE: SharedSiteConfig = {
  name: site.name ?? "Website",
  site: site.site ?? undefined,
  base: site.base ?? "/",
  trailingSlash: site.trailingSlash ?? false,
  googleSiteVerificationId: site.googleSiteVerificationId ?? undefined,
};

export const I18N: I18NConfig = {
  language: i18n.language ?? "zh-CN",
  textDirection: i18n.textDirection ?? "ltr",
};

export const METADATA: MetaDataConfig = {
  title: {
    default: metadata.title?.default ?? SITE.name,
    template: metadata.title?.template ?? "%s",
  },
  description: metadata.description ?? "",
  robots: {
    // 默认 true：与随仓库发布的 src/data/config.yaml（index/follow 均为 true）及
    // APP_BLOG 各段默认值保持一致。原先默认 false 会让「未配置 metadata.robots」的部署
    // 整站 noindex、而博客分页仍 indexable，形成矛盾且难以察觉的 SEO 状态。
    index: metadata.robots?.index ?? true,
    follow: metadata.robots?.follow ?? true,
  },
  openGraph: {
    type: metadata.openGraph?.type ?? "website",
    site_name: metadata.openGraph?.site_name,
    // 缺 url 的条目不应产出标签：原先填 "" 会渲染出空的 og:image / twitter:image
    images: metadata.openGraph?.images
      ?.filter((img) => !!img.url)
      .map((img) => ({
        url: img.url as string,
        width: img.width ?? 0,
        height: img.height ?? 0,
      })),
  },
  twitter: {
    handle: metadata.twitter?.handle,
    site: metadata.twitter?.site,
    cardType: metadata.twitter?.cardType,
  },
};

export const APP_BLOG: AppBlogConfig = {
  isEnabled: blog.isEnabled ?? false,
  postsPerPage: toPositiveInt(blog.postsPerPage, 6),
  isRelatedPostsEnabled: blog.isRelatedPostsEnabled ?? false,
  relatedPostsCount: toPositiveInt(blog.relatedPostsCount, 4),
  post: {
    isEnabled: blog.post?.isEnabled ?? true,
    permalink: blog.post?.permalink ?? "/blog/posts/%slug%",
    robots: {
      index: blog.post?.robots?.index ?? true,
      follow: blog.post?.robots?.follow ?? true,
    },
  },
  list: {
    isEnabled: blog.list?.isEnabled ?? true,
    pathname: blog.list?.pathname ?? "blog",
    robots: {
      index: blog.list?.robots?.index ?? true,
      follow: blog.list?.robots?.follow ?? true,
    },
  },
  category: {
    isEnabled: blog.category?.isEnabled ?? true,
    pathname: blog.category?.pathname ?? "category",
    robots: {
      index: blog.category?.robots?.index ?? true,
      follow: blog.category?.robots?.follow ?? true,
    },
  },
  tag: {
    isEnabled: blog.tag?.isEnabled ?? true,
    pathname: blog.tag?.pathname ?? "tag",
    robots: {
      index: blog.tag?.robots?.index ?? false,
      follow: blog.tag?.robots?.follow ?? true,
    },
  },
};

export const UI: SharedUIConfig = {
  theme: uiCfg.theme ?? "system",
};

export const ANALYTICS: SharedAnalyticsConfig = {
  vendors: {
    googleAnalytics: {
      id: analyticsCfg.vendors?.googleAnalytics?.id ?? undefined,
    },
  },
};
