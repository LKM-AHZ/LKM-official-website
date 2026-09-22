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

/**
 * 插值参数（自由形态 Record，不做键级约束）。
 * 说明：占位符替换是**尽力而为**——只替换出现在参数里的 `{name}`，未提供的保持原样
 *（见 index.ts 的 interpolate）；因此漏传/拼错占位符不会抛错，只会在界面上露出 `{name}`。
 * 要做到编译期校验，需从每个词条的模板字面量类型里反解占位符再构造按 key 索引的参数类型，
 * 而 t() 的 key 在部分调用点（如 moodKey/后端下发的 name_key）本就是运行时字符串，故不做。
 */
export type TranslationParams = Record<string, string | number | boolean>;

// 注意：不要改成 `as const` 派生 Locale —— useI18n.ts:9 与 middleware.ts:28 依赖
// `SUPPORTED_LOCALES as string[]` 的断言，改成 readonly 元组会让它们过不了类型检查
//（那两个文件不在本单元范围内，需一并调整后才能收敛为单一事实来源）。
export const SUPPORTED_LOCALES: Locale[] = ["en", "zh-CN"];

export const LOCALE_STORAGE_KEY = "lkm-locale";
