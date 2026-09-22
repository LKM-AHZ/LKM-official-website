import type {
  AUTO_MODE,
  DARK_MODE,
  LIGHT_MODE,
} from "~/lib/constants/constants";

/** TOC 支持的最大标题层级：类型与渲染逻辑（siteConfig.toc.depth）共用同一处定义 */
export type TocDepth = 1 | 2 | 3;

export type SiteConfig = {
  title: string;
  subtitle: string;

  lang:
    "en" | "zh_CN" | "zh_TW" | "ja" | "ko" | "es" | "th" | "vi" | "tr" | "id";

  themeColor: {
    hue: number;
    fixed: boolean;
  };
  banner: {
    enable: boolean;
    src: string;
    position?: "top" | "center" | "bottom";
    credit: {
      enable: boolean;
      text: string;
      url?: string;
    };
  };
  toc: {
    enable: boolean;
    depth: TocDepth;
  };

  favicon: Favicon[];
};

export type Favicon = {
  src: string;
  theme?: "light" | "dark";
  sizes?: string;
};

// 用字符串字面量联合而非数字枚举：0(Home) 是 falsy，且数字不可序列化，
// 消费者得靠 typeof 判分支（全仓库目前没有消费方，保留类型定义备用）
export type LinkPreset = "home" | "archive" | "about";

export type NavBarLink = {
  name: string;
  url: string;
  external?: boolean;
  children?: NavBarLink[];
};

export type NavBarConfig = {
  links: (NavBarLink | LinkPreset)[];
};

export type ProfileConfig = {
  avatar?: string;
  name: string;
  bio?: string;
  links: {
    name: string;
    url: string;
    icon: string;
  }[];
};

export type LicenseConfig = {
  enable: boolean;
  name: string;
  url: string;
};

export type LIGHT_DARK_MODE =
  typeof LIGHT_MODE | typeof DARK_MODE | typeof AUTO_MODE;

export type ExpressiveCodeConfig = {
  theme: string;
};
