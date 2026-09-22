import type { JSONContent } from "@tiptap/core";
import { parseMdxString } from "./parse-mdx";
import { normalizeMDAST } from "./normalize";
import { validateMDAST } from "./validate";
import { mdastToTiptap } from "./mdast-to-tiptap";
import type { ParsedMdx, ValidationIssue } from "./types";

export interface ImportResult {
  content: JSONContent[];
  frontmatter: Record<string, unknown>;
  issues: ValidationIssue[];
}

/** 校验失败（含安全类阻断）时抛出：issues 是类型化字段，消费方不必再做断言转换 */
export class MdxValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    // 只拼接 validate.ts 里已 t() 本地化的 issue 文案（原先硬编码英文前缀，既不会被翻译
    // 也会与它包裹的 issue 文案脱节）
    super(
      issues
        .filter((i) => i.severity === "error")
        .map((i) => i.message)
        .join("; "),
    );
    this.name = "MdxValidationError";
    this.issues = issues;
  }
}

export function importMdx(mdx: string): ImportResult {
  const parsed: ParsedMdx = parseMdxString(mdx);
  const normalized = normalizeMDAST(parsed.root);
  const issues = validateMDAST(normalized);

  const hasErrors = issues.some((i) => i.severity === "error");
  if (hasErrors) {
    throw new MdxValidationError(issues);
  }

  const content = mdastToTiptap(normalized);
  return { content, frontmatter: parsed.frontmatter, issues };
}
