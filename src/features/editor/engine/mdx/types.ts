import type { Root } from "mdast";

/** 解析/导出两侧共用的 frontmatter 形状，避免两处各写一份而悄悄分叉 */
export type Frontmatter = Record<string, unknown>;

export interface ParsedMdx {
  frontmatter: Frontmatter;
  root: Root;
}

export interface MdxExport {
  frontmatter: Frontmatter;
  mdx: string;
}

export interface ValidationIssue {
  message: string;
  nodeType: string;
  severity: "warning" | "error";
  details?: string;
}
