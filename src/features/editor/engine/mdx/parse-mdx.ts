import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import yaml from "js-yaml";
import type { Root } from "mdast";
import type { ParsedMdx } from "./types";

/** frontmatter 里的这些 key 会在展开/合并时改写原型链，一律剔除 */
const UNSAFE_FRONTMATTER_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

/** 复制成干净的普通对象：frontmatter 来自不可信的 YAML，下游会直接存盘/导出 */
function sanitizeFrontmatter(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (UNSAFE_FRONTMATTER_KEYS.has(key)) continue;
    out[key] = v;
  }
  return out;
}

const parser = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ["yaml"])
  .use(remarkGfm)
  .use(remarkMath, { singleDollarTextMath: true })
  .use(remarkMdx);

export function parseMdxString(mdx: string): ParsedMdx {
  // parser.parse 对畸形 MDX/markdown（游离的 `{`、未闭合的类 JSX 标签等）同步抛错：
  // 原样冒出去会是一个裸解析器错误，这里补上来源与原文，便于上层展示与定位
  let root: Root;
  try {
    root = parser.parse(mdx) as Root;
  } catch (err) {
    throw new Error(
      `[parse-mdx] MDX 解析失败: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  }
  let frontmatter: Record<string, unknown> = {};

  // 从树中提取并移除 YAML frontmatter
  const firstChild = root.children[0];
  if (firstChild?.type === "yaml") {
    // 原先 YAML 出错只 console.warn 然后照旧切片：调用方拿到 frontmatter: {} 却不知道
    // 元数据已被丢弃（下次保存就把用户的 frontmatter 抹掉）。数据丢失必须显式报错。
    let parsed: unknown;
    try {
      parsed = yaml.load(firstChild.value);
    } catch (err) {
      throw new Error(
        `[parse-mdx] frontmatter YAML 解析失败: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      );
    }
    // 顶层是数组（`---\n- a\n- b\n---`）或标量时不能当 frontmatter：Record 形状不成立，
    // 下游按下标取键只会拿到数组下标/undefined
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      // 刻意不做字段白名单：编辑器要能往返自定义 frontmatter（date/tags/业务字段），
      // 只做原型污染防护（剔除 __proto__/constructor/prototype）
      frontmatter = sanitizeFrontmatter(parsed as Record<string, unknown>);
    } else if (parsed !== undefined && parsed !== null) {
      throw new Error(
        "[parse-mdx] frontmatter 必须是键值映射（YAML mapping），实际形状不是对象",
      );
    }
    root.children = root.children.slice(1);
  }

  return { frontmatter, root };
}
