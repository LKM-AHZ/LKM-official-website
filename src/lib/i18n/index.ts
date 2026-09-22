import { I18N } from "~/lib/config";
import type { Locale, TranslationKey, TranslationParams } from "./types";
import { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from "./types";
import { zhFlat } from "./generated/zh_CN.flat";
import type { FlatDict } from "./flatten";
import { getSsrCookie } from "~/lib/ssr-context";

const COOKIE_KEY = "lkm-locale";

/**
 * 词典注册表：运行时可命中的扁平词典。
 * 默认语 zh-CN 同步载入（SSR/水合防闪、立即可用）；en 由 ensureDict 按需 import。
 * 任何键缺失时 t() 回退 zh-CN → 原始 key（不抛错，mismatch 防崩降级）。
 */
const loadedDicts: Partial<Record<Locale, FlatDict>> = {
  "zh-CN": zhFlat,
};

// memoize：每个 locale 只拉一次
const dictPromises: Partial<Record<Locale, Promise<FlatDict>>> = {};

/**
 * 确保某 locale 的词典已载入（memoize）。en 走动态 import() 独立 chunk，
 * 命中后写入注册表供 t() 同步读取。SSR 端 zh-CN 默认已同步可用；
 * en 不是同步的 —— 需由 SSR 侧（如 middleware）先 await 本函数再渲染，否则 t() 只能回退 zh-CN。
 */
export async function ensureDict(locale: Locale): Promise<FlatDict> {
  const existing = loadedDicts[locale];
  if (existing) return existing;
  const pending = dictPromises[locale];
  if (pending) return pending;
  dictPromises[locale] = (
    locale === "en"
      ? import("./generated/en.flat").then((m) => m.enFlat)
      : Promise.resolve(zhFlat)
  )
    .then((dict) => {
      loadedDicts[locale] = dict;
      return dict;
    })
    .catch((err) => {
      // 载入失败（chunk 404 / 产物缺失）不能把 rejected promise 永久 memoize：
      // 否则 middleware 的 await 之后每次请求都失败，且该 locale 永不恢复。
      // 清掉 memo 让下次调用重试，本次降级为默认语词典。
      delete dictPromises[locale];
      console.error(`[i18n] 词典载入失败 locale=${locale}`, err);
      return zhFlat;
    });
  return dictPromises[locale]!;
}

/** 语言标记 → 受支持 Locale 的唯一匹配规则（无法匹配返回 null，由调用方决定回退） */
function matchLocale(raw: string | null | undefined): Locale | null {
  if (!raw) return null;
  const lang = raw.toLowerCase().replace("_", "-");
  if (lang.startsWith("en")) return "en";
  if (lang.startsWith("zh")) return "zh-CN";
  return null;
}

/** 根据配置默认语言推断 Locale */
function localeFromConfig(): Locale {
  return matchLocale(I18N.language) ?? "zh-CN";
}

/** 根据原始语言标记推断支持的 Locale（未知语种回落到配置语言） */
function normalizeLocale(raw: string | null | undefined): Locale {
  return matchLocale(raw) ?? localeFromConfig();
}

/** 解析当前 Locale —— SSR 优先读请求 Cookie，CSR 优先读 localStorage，缺省回落到站点配置语言 */
export function getLocale(): Locale {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && (SUPPORTED_LOCALES as string[]).includes(stored))
        return stored as Locale;
    } catch {
      /* noop */
    }
    return localeFromConfig();
  }
  // SSR：优先读请求 Cookie（语言切换后刷新页面可保持）
  const cookie = getSsrCookie();
  if (cookie) {
    const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_KEY}=([^;]+)`));
    if (match) {
      try {
        const parsed = normalizeLocale(decodeURIComponent(match[1]));
        if (SUPPORTED_LOCALES.includes(parsed)) return parsed;
      } catch {
        // 畸形 percent-encoding 回退默认语
      }
    }
  }
  return localeFromConfig();
}

/** 设置并持久化当前 Locale（写入 localStorage + Cookie，SSR 靠 Cookie 读取） */
export function setLocale(locale: Locale): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent(locale)};path=/;max-age=31536000;samesite=lax`;
      document.documentElement.setAttribute("lang", locale);
      window.dispatchEvent(
        new CustomEvent("lkm:locale-change", { detail: { locale } }),
      );
    } catch {
      /* noop */
    }
  }
  // 预热非默认语词典（不阻塞调用方；命中即缓存）
  void ensureDict(locale);
}

/** 插值：将 `{name}` 占位符替换为参数 */
function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/**
 * 翻译入口。key 类型为 TranslationKey（字典路径），但运行时也支持任意字符串。
 * 回退链：当前 locale → 默认语 zh-CN → 原始 key。词典未就绪时返回原始 key（防崩降级，不抛错）。
 */
export function t(
  key: TranslationKey | string | undefined | null,
  params?: TranslationParams,
): string {
  if (!key) return "";
  const locale = getLocale();
  const localeDict = loadedDicts[locale];
  const zhdict = loadedDicts["zh-CN"];
  const template =
    (localeDict ? localeDict[key] : undefined) ??
    (zhdict ? zhdict[key] : undefined) ??
    key;
  return interpolate(template, params);
}

export type { Locale, TranslationKey, TranslationParams };
