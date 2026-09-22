import { unified } from "unified";
import remarkStringify from "remark-stringify";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import yaml from "js-yaml";
import type { Root, RootContent, PhrasingContent } from "mdast";

const serializer = unified()
  .use(remarkStringify, {
    bullet: "-",
    emphasis: "_",
    strong: "*",
    resourceLink: false,
  })
  .use(remarkFrontmatter, ["yaml"])
  .use(remarkMdx)
  .use(remarkGfm)
  .use(remarkMath, { singleDollarTextMath: true });

export function serializeMDAST(
  root: Root,
  frontmatter: Record<string, unknown>,
): string {
  const fmKeys = Object.keys(frontmatter);
  const tree: Root = { ...root, children: [...root.children] };

  if (fmKeys.length > 0) {
    const yamlStr = yaml.dump(frontmatter, { lineWidth: -1 });
    tree.children.unshift({
      type: "yaml",
      value: yamlStr.replace(/\n$/, ""),
    });
  }

  return serializer.stringify(
    tree as Parameters<typeof serializer.stringify>[0],
  ) as string;
}

/**
 * 把单个 JSX 元素节点（mdxJsxFlowElement/mdxJsxTextElement）序列化为其原始 MDX 源码片段。
 *
 * 背景：Callout/Figure 等 JSX 节点在 Tiptap 中对应 atom 节点，无法承载可编辑子内容。
 * 当元素带正文/图注等子内容时，读回编辑器若直接丢弃子内容会造成数据丢失，因此把整个元素
 * 串行化成源码片段以 rawMdx 占位节点保底。remark-stringify 配 remarkMdx 能把 mdxJsx*Element
 * 完整还原为 `<Callout>...</Callout>` 形式；若序列化失败（如未知节点类型），回退用文本拼装。
 */
export function serializeJsxElement(
  node: RootContent | PhrasingContent,
): string {
  try {
    return serializer.stringify({
      type: "root",
      children: [node],
    } as unknown as Root) as string;
  } catch (err) {
    // 兜底会丢属性与嵌套子节点（有损）：把降级原因打出来，否则未知节点类型导致的
    // 往返数据丢失完全无从排查
    console.warn("[serialize-mdx] remark-mdx 序列化失败，改用文本兜底:", err);
    return mdastToJsxFallback(node);
  }
}

/** 兜底：手动拼装 `<Name attr="v" ...>子内容</Name>`，不依赖 remark-mdx 的 JSX 序列化。 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mdastToJsxFallback(node: any): string {
  const name = node.name ?? "";
  const attrs = (node.attributes ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((a: any) => a.type === "mdxJsxAttribute")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => {
      // 无值属性（disabled）要输出裸名，否则会写成 disabled=""
      if (a.value === null || a.value === undefined) return a.name;
      // 表达式属性 {count={1}}：a.value 是 AST 对象，直接 String() 会得到 "[object Object]"
      if (typeof a.value === "object") {
        return `${a.name}={${String(a.value.value ?? "")}}`;
      }
      return `${a.name}="${String(a.value)}"`;
    })
    .join(" ");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children = (node.children ?? []) as any[];
  const inner =
    children
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => {
        if (c.type === "text") return c.value ?? "";
        // 这个兜底存在的意义就是「别丢内容」，嵌套元素不能替换成空串：
        // JSX 子节点递归序列化，其余节点退回通用 stringify
        if (c.type === "mdxJsxFlowElement" || c.type === "mdxJsxTextElement") {
          return serializeJsxElement(c);
        }
        try {
          return serializer.stringify({
            type: "root",
            children: [c],
          } as unknown as Root) as string;
        } catch {
          return "";
        }
      })
      .join("") || "";
  const open = `<${name}${attrs ? " " + attrs : ""}>`;
  const close = `</${name}>`;
  if (inner) return `${open}\n${inner}\n${close}`;
  return `${open}${close}`;
}
