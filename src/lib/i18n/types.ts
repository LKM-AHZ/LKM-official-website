import type { en } from "./languages/en";

export type Locale = "en" | "zh-CN";

export type TranslationDict = typeof en;

export type DeepKeyOf<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : // 只展开普通嵌套对象：number/boolean 叶子会产出 "x.toFixed" 这类假键，
      // 数组会产出 "x.length"/"x.push" 等，都不是合法的翻译键
      T[K] extends readonly unknown[]
      ? never
      : T[K] extends object
        ? `${K}.${DeepKeyOf<T[K]>}`
        : never;
}[keyof T & string];

export type TranslationKey = DeepKeyOf<TranslationDict>;

export type DeepStringRecord<T> = {
  [K in keyof T & string]: T[K] extends string
    ? string
    : DeepStringRecord<T[K]>;
};

export type TranslationParams = Record<string, string | number | boolean>;

// 注意：不要改成 `as const` 派生 Locale —— useI18n.ts:9 与 middleware.ts:28 依赖
// `SUPPORTED_LOCALES as string[]` 的断言，改成 readonly 元组会让它们过不了类型检查
//（那两个文件不在本单元范围内，需一并调整后才能收敛为单一事实来源）。
export const SUPPORTED_LOCALES: Locale[] = ["en", "zh-CN"];

export const LOCALE_STORAGE_KEY = "lkm-locale";
