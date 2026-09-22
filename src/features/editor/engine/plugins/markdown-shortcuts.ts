/**
 * 链接 `[text](url)` 与维基链接 `[[名称]]` 的延迟转换检测纯函数。
 *
 * 本模块只产出可复用的纯函数与数据结构，不创建任何 ProseMirror Plugin 实例。
 * 已由 DocumentEditor 在「文本输入 / 选区变化」时调用，
 * 与 @tiptap/extension-link 等 InputRule 并存。
 */

/** 待转换候选：`from`/`to` 为文档字符串中的命中区间 */
export interface Detected {
  from: number;
  to: number;
  kind: "link" | "wiki";
  href: string;
  label: string;
}

/**
 * 匹配闭合的 `[label](url)` 链接语法。
 * 带 `!` 前缀的图片语法 `![alt](url)` 不会被匹配（`!` 已在开头被占位拒绝）。
 * 未闭合（缺 `)`）返回 `null`。
 *
 * @param text 光标前待检测的段落文本
 * @returns 命中的 Detected（`kind: 'link'`），未命中返回 `null`
 */
export function detectLink(text: string): Detected | null {
  const m = text.match(/(^|[^!])\[([^[\]\n]*)\]\(([^()\s]+)\)$/);
  if (!m || !m[3]) return null;
  const idx = m[1]?.length ?? 0; // 前缀（可能的前导字符）长度
  const fullStart = Math.max(0, text.length - m[0].length);
  return {
    from: fullStart + idx,
    to: text.length,
    kind: "link",
    href: m[3],
    label: m[2] ?? "",
  };
}

/**
 * 匹配闭合的 `[[label]]` 维基链接语法。
 * 空名 `[[]]` 或未闭合（缺 `]]`）返回 `null`。
 *
 * @param text 光标前待检测的段落文本
 * @returns 命中的 Detected（`kind: 'wiki'`，`href: ''`），未命中返回 `null`
 */
export function detectWiki(text: string): Detected | null {
  const m = text.match(/\[\[([^[\]]*)\]\]$/);
  if (!m || !m[1]) return null;
  const fullStart = text.length - m[0].length;
  return {
    from: fullStart,
    to: text.length,
    kind: "wiki",
    href: "",
    label: m[1],
  };
}

/**
 * 从已发布文档索引中，按标题匹配 slug 生成链接地址。
 * 标题命中且含 slug → 返回 `/docs/<slug>`；
 * 匹配失败或无 slug → 返回 `''`。
 *
 * @param label 要匹配的文档标题
 * @param getDocs 惰性获取已发布文档索引（懒加载，仅在调用时求值）
 * @returns 指向文档的绝对路径，或空串表示无匹配
 */
export function wikiHref(
  label: string,
  getDocs: () => Array<{ title: string; slug?: string }>,
): string {
  const hit = getDocs().find((d) => d.title === label && d.slug);
  return hit?.slug ? `/docs/${hit.slug}` : "";
}
