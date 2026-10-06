/** 从 MDX 的一级标题提取标题；跳过 YAML 元信息，无标题返回空串。 */
export function firstHeadingTitle(mdx: string): string {
  const body = mdx.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  return /^#\s+(.+)$/m.exec(body)?.[1]?.trim() ?? "";
}
