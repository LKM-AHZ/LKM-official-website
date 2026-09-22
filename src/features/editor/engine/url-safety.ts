/**
 * 导出链路（HTML / Markdown）共用的 URL 清洗。
 *
 * escapeHtml/escapeText 只做字符转义，挡不住 `javascript:`、`data:`、`vbscript:` 这类伪协议：
 * 导出的 HTML 会被浏览器直接打开，链接 href / 图片 src 里的伪协议等同于脚本执行。
 * 这里统一做 scheme 白名单，相对路径与锚点照常放行。
 */

/**
 * 允许的绝对 scheme（其余一律降级为 #）。
 *
 * 注意**不要**在末尾加 `$`：加了之后本正则只匹配「裸 scheme 字符串」（如 `"https:"`），
 * 而真实 URL（`https://x.com/a`、`mailto:a@b.c`、`tel:+86`）会**全部被判为不安全而降级成 `#`**
 * ——导出的 HTML 里所有链接与图片就都没了。这里要的是「以该 scheme 开头」的前缀匹配。
 */
const SAFE_SCHEMES = /^(https?:|mailto:|tel:)/i;
/** 形如 `foo:` 的 scheme 前缀 */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
/**
 * 浏览器解析 URL 时会先丢弃的控制字符与空白。
 * 判断前必须先剔除，否则 `java\tscript:` 之类能绕过 scheme 匹配。
 */
// eslint-disable-next-line no-control-regex -- 这里就是要匹配并剔除控制字符
const CONTROL_CHARS = /[\u0000-\u0020\u007f-\u009f]/g;

/**
 * 返回可安全写入 href/src 的 URL 字符串；不安全的输入降级为 "#"。
 * @param raw 来自编辑器 JSON 的原始属性值
 */
export function safeUrl(raw: unknown): string {
  const value = String(raw ?? "");
  const probe = value.replace(CONTROL_CHARS, "");
  if (!probe) return "#";
  // 无 scheme（相对路径 / 锚点 / 协议相对）沿用原值，交由调用方转义
  if (!HAS_SCHEME.test(probe)) return value;
  return SAFE_SCHEMES.test(probe) ? value : "#";
}

/**
 * Markdown 链接/图片目标位额外需要的转义：
 * `)` 会提前闭合 `](...)`，`<`/`>` 会被部分解析器当成尖括号形式，空白会截断目标。
 */
export function escapeMarkdownUrl(raw: unknown): string {
  return safeUrl(raw)
    .replace(/([()<>])/g, "\\$1")
    .replace(/\s/g, (c) => encodeURIComponent(c));
}
