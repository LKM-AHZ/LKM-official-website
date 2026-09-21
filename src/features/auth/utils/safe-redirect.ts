const rejectPattern = /^(javascript:|https?:|data:|blob:|mailto:|\/\/|\\)/i;

/** URL 解析时会在**任意位置**被丢弃的字符（制表符/换行/回车） */
const URL_STRIPPED_ANYWHERE = /[\t\n\r]/g;
/** 只在首尾被丢弃的 C0/C1 控制字符与空格；中间的空格是合法路径内容，不能删 */
const URL_STRIPPED_AT_EDGES =
  // eslint-disable-next-line no-control-regex -- 这里就是要匹配并剔除控制字符
  /^[\u0000-\u0020\u007f-\u009f]+|[\u0000-\u0020\u007f-\u009f]+$/g;

export function resolveSafeRedirect(raw: string | null | undefined): string {
  if (!raw) return "/";
  const candidate = stripControlChars(raw);
  if (!candidate || candidate === "/") return "/";
  // `\` 在 URL 解析中等价于 `/`：先按原始形态判定（`\evil` 这类一律拒绝）……
  if (rejectPattern.test(candidate)) return "/";
  // ……再按映射后的形态判定：`/\evil.com` 会被浏览器解析成 `//evil.com`（站外跳转），
  // 只有归一化之后才能看出来，所以必须在最终形态上再拦一次。
  const mapped = candidate.replace(/\\/g, "/");
  if (rejectPattern.test(mapped)) return "/";
  const base = getBase();
  const normalized = mapped.startsWith("/") ? mapped : `/${mapped}`;
  if (
    base &&
    base !== "/" &&
    base !== normalized &&
    !normalized.startsWith(base)
  ) {
    return "/";
  }
  return normalized;
}

/**
 * 按浏览器的 URL 解析规则归一化：制表符/换行任意位置都会被丢弃，
 * 控制字符与空格只在首尾被丢弃。不这么做的话 `"/\t/evil.com"` 会被
 * 判定为以 `/` 开头的站内路径，实际解析成 `//evil.com`（站外跳转）。
 */
function stripControlChars(raw: string): string {
  return raw
    .replace(URL_STRIPPED_ANYWHERE, "")
    .replace(URL_STRIPPED_AT_EDGES, "");
}

function getBase(): string {
  if (typeof window !== "undefined") {
    return String(
      (window as unknown as { __BASE_URL__?: string }).__BASE_URL__ ?? "/",
    );
  }
  return "/";
}
