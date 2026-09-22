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
  const base = getBase() || "/";
  const normalized = mapped.startsWith("/") ? mapped : `/${mapped}`;
  // 残留的 . / .. 段（含 %2e 形式）会让 startsWith 判断失效：`/app/../evil` 字符串上属于 /app
  // 之内，导航时却解析到 /app 之外，一律拒绝
  if (/\.\.?(\/|$)/.test(normalized) || /%2e/i.test(normalized)) return "/";
  if (base !== "/" && !isWithinBase(normalized, base)) return "/";
  return normalized;
}

/**
 * 目标是否落在 base 内，按「路径段」比较：base=/app 时 /application/x 不算在 base 内
 * （裸 startsWith 会误判）。
 */
function isWithinBase(target: string, base: string): boolean {
  if (target === base) return true;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return target.startsWith(prefix);
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

/**
 * 归一化 base：保证前导 `/`、去掉尾随 `/`，并拒绝不可能是站点子路径的值
 * （空串、带 scheme 的完整 URL、协议相对 `//host`）。原状直接拿 `window.__BASE_URL__` 做
 * `startsWith` 比较：base 写成 `app` 时任何目标都判「不在 base 内」，写成完整 URL 时包含性
 * 判断被悄悄放宽。
 */
export function normalizeBase(raw: string): string {
  const value = raw.trim();
  if (!value || value.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return "/";
  }
  const withLeading = value.startsWith("/") ? value : `/${value}`;
  const trimmed = withLeading.replace(/\/+$/, "");
  return trimmed || "/";
}

function getBase(): string {
  if (typeof window !== "undefined") {
    return normalizeBase(
      String((window as unknown as { __BASE_URL__?: string }).__BASE_URL__ ?? "/"),
    );
  }
  // SSR 无 window：用编译期注入的 base，保证服务端与客户端对同一输入算出相同结果
  return normalizeBase(import.meta.env.BASE_URL || "/");
}
