/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Root, Table, List } from "mdast";
import type { JSONContent } from "@tiptap/core";
import { toString as mdastToString } from "mdast-util-to-string";
import { serializeJsxElement } from "./serialize-mdx";

// MDAST 中这些是包裹文本的父节点，Tiptap 中它们是文本节点上的标记。
interface MarkContext {
  type: "strong" | "emphasis" | "delete" | "link" | "inlineCode";
  attrs?: Record<string, unknown>;
}

// MDAST 标记类型 → Tiptap 标记类型（未列出的原样透传，见 marksToTiptap）
const MARK_TYPE_MAP: Record<string, string> = {
  strong: "bold",
  emphasis: "italic",
  delete: "strike",
  inlineCode: "code",
  link: "link",
};

// 把 mdast 祖先链转成 MarkContext（link 要带上 href 属性）；三处内联分支共用，
// 避免 link 属性（如将来加 title）要改三遍
function buildMarks(ancestors: any[]): MarkContext[] {
  return ancestors.map((a) => ({
    type: a.type as MarkContext["type"],
    attrs: a.type === "link" ? { href: (a as any).url } : undefined,
  }));
}

function marksToTiptap(marks: MarkContext[]): JSONContent["marks"] {
  if (marks.length === 0) return undefined;
  return marks.map((m) => {
    const markType = MARK_TYPE_MAP[m.type] ?? m.type;
    return { type: markType, ...(m.attrs ? { attrs: m.attrs } : {}) };
  });
}

function convertInlineChildren(
  children: any[],
  ancestors: any[],
): JSONContent[] {
  const result: JSONContent[] = [];

  for (const child of children) {
    switch (child.type) {
      case "text":
        result.push({
          type: "text",
          text: child.value as string,
          marks: marksToTiptap(buildMarks(ancestors)),
        });
        break;
      case "inlineCode":
        result.push({
          type: "text",
          text: child.value as string,
          marks: [
            ...(marksToTiptap(buildMarks(ancestors)) ?? []),
            { type: "code" },
          ],
        });
        break;
      case "strong":
      case "emphasis":
      case "delete":
      case "link":
        result.push(
          ...convertInlineChildren(child.children as any[], [
            ...ancestors,
            child,
          ]),
        );
        break;
      case "image": {
        // image 是块级节点（CustomImage 未开 inline:true），放进 paragraph.content 会被
        // schema 丢弃。内联位置的图片退化成原始 Markdown 文本：内容不丢且能原样往返。
        const img = child as {
          url: string;
          alt?: string;
          title?: string | null;
        };
        const title = img.title ? ` "${img.title}"` : "";
        result.push({
          type: "text",
          text: `![${img.alt ?? ""}](${img.url}${title})`,
        });
        break;
      }
      case "inlineMath": {
        // inlineMath 在 Tiptap 中是 Mark 而非节点：镜像编辑器的表示，
        // 用文本 + inlineMath mark（与 SlashMenu/工具栏插入时的格式一致）
        const math = child as { value: string };
        const value = math.value ?? "";
        result.push({
          type: "text",
          text: value,
          marks: [
            ...(marksToTiptap(buildMarks(ancestors)) ?? []),
            { type: "inlineMath", attrs: { latex: value } },
          ],
        });
        break;
      }
      case "break":
        // 硬换行在 Tiptap 里是 hardBreak 节点；走 mdastToString 会得到空串，
        // 空 text 节点是非法内容
        result.push({ type: "hardBreak" });
        break;
      case "html":
        // 行内 HTML（如 <br/>）保留原始文本，不经过 mdastToString 丢标签
        result.push({ type: "text", text: (child.value as string) ?? "" });
        break;
      case "mdxJsxTextElement":
        // 行内 JSX 用原始源码片段承载，保留标签名/属性/表达式
        result.push({ type: "text", text: serializeJsxElement(child) });
        break;
      default: {
        const text = mdastToString(child);
        // 未知无文本节点（如 footnoteReference）转出空串会产生非法空 text，直接跳过
        if (text) result.push({ type: "text", text });
      }
    }
  }

  return result;
}

function convertTable(node: Table): JSONContent {
  const tableContent: JSONContent[] = [];
  const rows = (node as any).children as any[];
  // GFM 对齐元数据：mdast table.align 是按列的 ['left'|'right'|'center'|null] 数组，
  // 映射到 Tiptap 单元格的 align 属性（由 @tiptap/extension-table 内建支持），保证往返不丢。
  const aligns = (node.align ?? []) as Array<string | null>;
  rows.forEach((row, rowIndex) => {
    const cells = (row as any).children as any[];
    const rowContent: JSONContent[] = [];
    for (let ci = 0; ci < cells.length; ci++) {
      const cell = cells[ci];
      // GFM 表首行即表头（remark-gfm 不区分 cell 类型，但 markdown 语法首行就是 header）
      const cellType = rowIndex === 0 ? "tableHeader" : "tableCell";
      const children = cell.children as any[];
      const hasBlock = children.some((c) =>
        [
          "paragraph",
          "heading",
          "code",
          "list",
          "table",
          "blockquote",
          "math",
          "thematicBreak",
          "html",
          "image",
        ].includes(c.type),
      );
      let content: JSONContent[];
      if (hasBlock) {
        // 单元格含块级内容（罕见）时按块级转换
        content = convertBlockChildren(children);
      } else {
        // 常规 GFM 单元格是纯内联内容（text/strong/emphasis/link 等），不能丢给块级转换器转成 rawMdx
        const inline = convertInlineChildren(children, []);
        content =
          inline.length > 0
            ? [{ type: "paragraph", content: inline }]
            : [{ type: "paragraph" }];
      }
      const colAlign = aligns[ci] ?? null;
      const cellJson: JSONContent = { type: cellType, content };
      // 仅列有左/右/中对齐时才写入 align，保持 editorJson 最小化
      if (colAlign) (cellJson as any).attrs = { align: colAlign };
      rowContent.push(cellJson);
    }
    tableContent.push({ type: "tableRow", content: rowContent });
  });
  return { type: "table", content: tableContent };
}

function convertListItem(item: any, forceTask = false): JSONContent {
  const checked = item.checked !== null && item.checked !== undefined;
  if (checked || forceTask) {
    const content = convertBlockChildren(item.children);
    return {
      type: "taskItem",
      attrs: { checked: Boolean(item.checked) },
      // TaskItem 的 content 契约是 "paragraph block*"：首子必须是段落，
      // 否则以嵌套列表/代码块/标题开头的任务项会被 ProseMirror 静默丢弃
      content:
        content.length > 0 && content[0]?.type === "paragraph"
          ? content
          : [{ type: "paragraph" }, ...content],
    };
  }
  return {
    type: "listItem",
    content: convertBlockChildren(item.children),
  };
}

function convertList(node: List): JSONContent {
  const rawItems = node.children as any[];
  // GFM 任务列表 `- [x] 项` 的 listItem 带 checked，容器应为 taskList（与 Tiptap TaskList 一致）
  //
  // 混合列表（部分条目带 checked）在 Tiptap 里没有合法表示：TaskList 只接受 taskItem、
  // BulletList/OrderedList 只接受 listItem，任选其一都会产出被 ProseMirror 静默丢弃的非法
  // 文档。故按「有任一任务项」整表归一：全部转 taskItem，其余条目 checked=false。
  const isTaskList = rawItems.some(
    (i) => i.checked !== null && i.checked !== undefined,
  );
  const items = rawItems.map((item) => convertListItem(item, isTaskList));
  if (isTaskList) {
    return { type: "taskList", content: items };
  }
  return {
    type: node.ordered ? "orderedList" : "bulletList",
    attrs: node.ordered ? { start: node.start ?? 1 } : undefined,
    content: items,
  };
}

function convertBlockChildren(children: any[]): JSONContent[] {
  const result: JSONContent[] = [];

  for (const child of children) {
    switch (child.type) {
      case "paragraph": {
        const content = convertInlineChildren(child.children as any[], []);
        result.push({ type: "paragraph", content });
        break;
      }
      case "heading": {
        result.push({
          type: "heading",
          attrs: { level: child.depth as number },
          content: convertInlineChildren(child.children as any[], []),
        });
        break;
      }
      case "blockquote": {
        result.push({
          type: "blockquote",
          content: convertBlockChildren(child.children as any[]),
        });
        break;
      }
      case "code": {
        result.push({
          type: "codeBlock",
          attrs: { language: (child.lang as string) ?? "" },
          content: [{ type: "text", text: child.value as string }],
        });
        break;
      }
      case "thematicBreak":
        result.push({ type: "horizontalRule" });
        break;
      case "list":
        result.push(convertList(child as unknown as List));
        break;
      case "table":
        result.push(convertTable(child as unknown as Table));
        break;
      case "math": {
        result.push({
          type: "blockMath",
          attrs: { latex: child.value as string },
        });
        break;
      }
      // 注：inlineMath 是 Mark，行内公式由 convertInlineChildren 处理，块级不存在该节点。
      case "image": {
        const img = child as {
          url: string;
          alt?: string;
          title?: string | null;
        };
        result.push({
          type: "image",
          attrs: { src: img.url, alt: img.alt ?? "", title: img.title ?? "" },
        });
        break;
      }
      case "html": {
        result.push({
          type: "rawMdx",
          attrs: { source: child.value as string, sourceKind: "flow" },
        });
        break;
      }
      case "mdxJsxFlowElement": {
        const el = child as {
          name?: string;
          children?: any[];
          attributes?: Array<{
            type: string;
            name: string;
            value: string | number | boolean;
          }>;
        };
        const name = el.name ?? "";
        if (name === "Callout" || name === "Figure") {
          const hasChildren = (el.children ?? []).length > 0;
          if (hasChildren) {
            // Callout/Figure 为 atom 节点，无法承载可编辑子内容（正文/图注）。
            // 带子内容的元素与其丢弃子内容造成数据丢失，不如整体降级为 rawMdx 保底，
            // 序列化回完整源码，往返不丢内容（还原自 serializeJsxElement）。
            result.push({
              type: "rawMdx",
              attrs: {
                source: serializeJsxElement(el as unknown as any),
                sourceKind: "flow",
              },
            });
            break;
          }
          const attrs: Record<string, unknown> = {};
          for (const attr of el.attributes ?? []) {
            if (attr.type === "mdxJsxAttribute") {
              attrs[attr.name] = attr.value;
            }
          }
          result.push({
            type: name === "Callout" ? "callout" : "figure",
            attrs,
          });
        } else {
          result.push({
            type: "rawMdx",
            attrs: { source: mdastToString(child), sourceKind: "flow" },
          });
        }
        break;
      }
      case "mdxJsxTextElement": {
        const el = child as { name?: string };
        const name = el.name ?? "";
        if (name === "Callout" || name === "Figure") {
          // 内联 Callout/Figure 不是可承载子内容的节点，但与块级分支同一原则：
          // 保留完整 JSX 源码（mdastToString 只留内文、会丢标签），往返不丢内容
          result.push({
            type: "rawMdx",
            attrs: {
              source: serializeJsxElement(el as unknown as any),
              sourceKind: "text",
            },
          });
        } else {
          result.push({
            type: "rawMdx",
            attrs: { source: mdastToString(child), sourceKind: "text" },
          });
        }
        break;
      }
      case "yaml":
        // frontmatter 已提取，跳过
        break;
      default:
        result.push({
          type: "rawMdx",
          attrs: { source: mdastToString(child), sourceKind: "flow" },
        });
    }
  }

  return result;
}

export function mdastToTiptap(root: Root): JSONContent[] {
  return convertBlockChildren(root.children);
}
