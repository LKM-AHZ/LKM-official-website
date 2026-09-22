import type {
  ExpressiveCodeConfig,
  LicenseConfig,
  ProfileConfig,
  SiteConfig,
} from "~/types/config";
import projectConfigRaw from "virtual:config";

// virtual:config 运行时数据没有编译期类型 —— 在此唯一断言一次。
// 必须兜底空值：配置文件为空/畸形时 yaml.load() 可能返回 undefined，
// 直接 projectConfig.fuwari 会在 import 期抛 TypeError，整站构建/SSR 一起挂掉。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const projectConfig = (projectConfigRaw ?? {}) as Record<string, any>;

/** 白名单校验：配置是外部输入，非法值不能靠 as 断言塞进字面量联合类型 */
function pickFrom<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" &&
    (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

const SITE_LANGS = [
  "en",
  "zh_CN",
  "zh_TW",
  "ja",
  "ko",
  "es",
  "th",
  "vi",
  "tr",
  "id",
] as const;
const BANNER_POSITIONS = ["top", "center", "bottom"] as const;

/** Expressive Code 主题缺省值：ecCfg 兜底与末尾取值共用同一字面量，避免两处漂移 */
const DEFAULT_EC_THEME = "github-dark";

interface RawCredit {
  enable?: boolean;
  text?: string;
  url?: string;
}

interface RawBanner {
  enable?: boolean;
  src?: string;
  position?: string;
  credit?: RawCredit;
}

interface RawThemeColor {
  hue?: number;
  fixed?: boolean;
}

interface RawToc {
  enable?: boolean;
  depth?: number;
}

interface RawSiteConfig {
  title?: string;
  subtitle?: string;
  lang?: string;
  themeColor?: RawThemeColor;
  banner?: RawBanner;
  toc?: RawToc;
  favicon?: unknown[];
}

const cfg = projectConfig.fuwari as
  | {
      site?: RawSiteConfig;
      profile?: Record<string, unknown>;
      license?: Record<string, unknown>;
      expressiveCode?: { theme: string };
    }
  | undefined;

const siteCfg = cfg?.site ?? {};
const profileCfg = cfg?.profile ?? {};
const licCfg = cfg?.license ?? {};
const ecCfg = cfg?.expressiveCode ?? { theme: DEFAULT_EC_THEME };

export const siteConfig: SiteConfig = {
  title: siteCfg.title || "Fuwari",
  subtitle: siteCfg.subtitle || "",
  lang: pickFrom(siteCfg.lang, SITE_LANGS, "zh_CN"),
  themeColor: {
    hue: siteCfg.themeColor?.hue ?? 250,
    fixed: siteCfg.themeColor?.fixed ?? false,
  },
  banner: {
    enable: siteCfg.banner?.enable ?? false,
    src: siteCfg.banner?.src || "assets/images/demo-banner.png",
    position: pickFrom(siteCfg.banner?.position, BANNER_POSITIONS, "center"),
    credit: {
      enable: siteCfg.banner?.credit?.enable ?? false,
      text: siteCfg.banner?.credit?.text || "",
      url: siteCfg.banner?.credit?.url || "",
    },
  },
  toc: {
    enable: siteCfg.toc?.enable ?? true,
    depth:
      siteCfg.toc?.depth === 1 ||
      siteCfg.toc?.depth === 2 ||
      siteCfg.toc?.depth === 3
        ? siteCfg.toc.depth
        : 2,
  },
  favicon: Array.isArray(siteCfg.favicon)
    ? (siteCfg.favicon as SiteConfig["favicon"])
    : [],
};

export const profileConfig: ProfileConfig = {
  avatar: String(profileCfg.avatar || "assets/images/demo-avatar.png"),
  name: String(profileCfg.name || ""),
  bio: String(profileCfg.bio || ""),
  // 逐项校验：只判断容器是否为数组不够，缺 name/url/icon 的条目会以 undefined
  // 流进名片与图标查找逻辑
  links: (Array.isArray(profileCfg.links) ? profileCfg.links : [])
    .filter(
      (link): link is { name: string; url: string; icon?: unknown } =>
        !!link &&
        typeof (link as { name?: unknown }).name === "string" &&
        typeof (link as { url?: unknown }).url === "string",
    )
    .map((link) => ({
      name: String(link.name),
      url: String(link.url),
      icon: String(link.icon ?? ""),
    })),
};

export const licenseConfig: LicenseConfig = {
  enable: Boolean(licCfg.enable ?? true),
  name: String(licCfg.name || "CC BY-NC-SA 4.0"),
  url: String(
    licCfg.url || "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  ),
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
  // 用 || 而非 ??：空串同样视为「没配」，与上面各字段的兜底策略一致
  theme: ecCfg.theme || DEFAULT_EC_THEME,
};
