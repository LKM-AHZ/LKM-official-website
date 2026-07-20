import type { MetaData } from '~/types';

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export type Config = {
  site?: DeepPartial<SiteConfig>;
  metadata?: DeepPartial<MetaDataConfig>;
  i18n?: DeepPartial<I18NConfig>;
  apps?: {
    blog?: DeepPartial<AppBlogConfig>;
  };
  ui?: unknown;
  analytics?: unknown;
};

export interface SiteConfig {
  name: string;
  site?: string;
  base?: string;
  trailingSlash?: boolean;
  googleSiteVerificationId?: string;
}

export interface MetaDataConfig extends Omit<MetaData, 'title'> {
  title?: {
    default: string;
    template: string;
  };
}

export interface I18NConfig {
  language: string;
  textDirection: string;
  dateFormatter?: Intl.DateTimeFormat;
}

interface AppBlogBlockConfig {
  isEnabled: boolean;
  pathname: string;
  robots: {
    index: boolean;
    follow: boolean;
  };
}

export interface AppBlogConfig {
  isEnabled: boolean;
  postsPerPage: number;
  isRelatedPostsEnabled: boolean;
  relatedPostsCount: number;
  post: AppBlogBlockConfig & { permalink: string };
  list: AppBlogBlockConfig;
  category: AppBlogBlockConfig;
  tag: AppBlogBlockConfig;
}

export interface AnalyticsConfig {
  vendors: {
    googleAnalytics: {
      id?: string;
      partytown?: boolean;
    };
  };
}

export interface UIConfig {
  theme: string;
}

const DEFAULT_SITE_NAME = 'Website';

const defaultSite: SiteConfig = {
  name: DEFAULT_SITE_NAME,
  site: undefined,
  base: '/',
  trailingSlash: false,
  googleSiteVerificationId: '',
};

const defaultI18N: I18NConfig = {
  language: 'en',
  textDirection: 'ltr',
};

const defaultBlogBlock = {
  isEnabled: true,
  pathname: '',
  robots: { index: true, follow: true },
} satisfies AppBlogBlockConfig;

const defaultAppBlog: AppBlogConfig = {
  isEnabled: false,
  postsPerPage: 6,
  isRelatedPostsEnabled: false,
  relatedPostsCount: 4,
  post: { ...defaultBlogBlock, permalink: '/blog/%slug%' },
  list: { ...defaultBlogBlock, pathname: 'blog' },
  category: { ...defaultBlogBlock, pathname: 'category' },
  tag: { ...defaultBlogBlock, pathname: 'tag', robots: { index: false, follow: true } },
};

const defaultUI = { theme: 'system' };

const defaultAnalytics: AnalyticsConfig = {
  vendors: { googleAnalytics: { id: undefined, partytown: true } },
};

function shallowMerge<T>(defaults: T, overrides?: Record<string, unknown>): T {
  if (!overrides) return defaults;
  return { ...defaults, ...overrides } as T;
}

const getSite = (config: Config): SiteConfig => shallowMerge(defaultSite, config?.site as Record<string, unknown>);

const getMetadata = (config: Config, siteConfig: SiteConfig): MetaDataConfig => {
  const defaults = {
    title: {
      default: siteConfig.name || DEFAULT_SITE_NAME,
      template: '%s',
    },
    description: '',
    robots: { index: false, follow: false },
    openGraph: { type: 'website' },
  };
  return shallowMerge(defaults, config?.metadata as Record<string, unknown>) as MetaDataConfig;
};

const getI18N = (config: Config): I18NConfig => shallowMerge(defaultI18N, config?.i18n as Record<string, unknown>);

const getAppBlog = (config: Config): AppBlogConfig =>
  shallowMerge(defaultAppBlog, config?.apps?.blog as Record<string, unknown>) as AppBlogConfig;

const getUI = (config: Config) => shallowMerge(defaultUI, config?.ui as Record<string, unknown>);

const getAnalytics = (config: Config): AnalyticsConfig =>
  shallowMerge(defaultAnalytics, config?.analytics as Record<string, unknown>) as AnalyticsConfig;

export default (config: Config) => {
  const SITE = getSite(config);
  return {
    SITE,
    I18N: getI18N(config),
    METADATA: getMetadata(config, SITE),
    APP_BLOG: getAppBlog(config),
    UI: getUI(config),
    ANALYTICS: getAnalytics(config),
  };
};
