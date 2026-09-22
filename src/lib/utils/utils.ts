import { I18N } from "~/lib/config";

export const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat(
  I18N?.language,
  {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  },
);

export const getFormattedDate = (date: Date | undefined): string =>
  // Invalid Date 也是 truthy，直接 format 会抛 RangeError: Invalid time value
  date && !Number.isNaN(date.getTime()) ? formatter.format(date) : "";

export const trim = (str = "", ch?: string): string => {
  let start = 0,
    end = str.length || 0;
  while (start < end && str[start] === ch) ++start;
  while (end > start && str[end - 1] === ch) --end;
  return start > 0 || end < str.length ? str.substring(start, end) : str;
};

/** 数值单位表（B/M/K），按从大到小匹配 */
const AMOUNT_UNITS = [
  { value: 1e9, suffix: "B" },
  { value: 1e6, suffix: "M" },
  { value: 1e3, suffix: "K" },
] as const;

// 根据数值大小将数字格式化为 B / M / K 展示值
export const toUiAmount = (amount: number): string => {
  // 原先 falsy 分支返回 number 0、其余返回 string，调用方被迫处理两种类型；
  // 展示值统一为 string。非有限值也按 0 处理，避免把 NaN 渲染出去。
  if (!amount || !Number.isFinite(amount)) return "0";

  for (const { value, suffix } of AMOUNT_UNITS) {
    if (amount >= value) {
      // 先缩放再四舍五入：999_999_999 / 1e6 = 1000.0，若直接输出会得到 "1000M"，
      // 因此在同一单位内把缩放值钳到 999.9，保证不会出现跨单位的 1000
      const scaled = Math.min(amount / value, 999.9);
      const formattedNumber = scaled.toFixed(1);
      return Number(formattedNumber) === parseInt(formattedNumber)
        ? parseInt(formattedNumber) + suffix
        : formattedNumber + suffix;
    }
  }

  return Number(amount).toFixed(0);
};
