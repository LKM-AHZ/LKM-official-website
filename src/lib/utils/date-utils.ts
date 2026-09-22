/**
 * 格式化为本地时区的 `YYYY-MM-DD`。
 *
 * 刻意不用 `toISOString()`：它按 UTC 换算，UTC+8 的凌晨会得到“前一天”、
 * 负偏移时区会得到“后一天”，日期不可预期。这里显式取本地年月日。
 * （原名为 formatDateToYYYYMMDD，但输出一直带短横线，名实不符，故改名。）
 */
export function formatLocalDate(date: Date): string {
  // 入参来自接口/内容数据：缺失或 Invalid Date 时返回空串，
  // 否则会渲染出 "NaN-NaN-NaN"，getFullYear 在 null 上还会直接抛错
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
