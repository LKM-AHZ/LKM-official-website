import type { Root, RootContent, PhrasingContent } from "mdast";
import type { JSONContent } from "@tiptap/core";

/** 将 Tiptap JSON 内容数组转换回 MDAST Root 树。 */
export function tiptapToMdast(nodes: JSONContent[]): Root {
  const tree: Root = {
    type: "root",
    children: convertBlocks(nodes),
  };
  return tree;
}

function convertBlocks(nodes: JSONContent[]): RootContent[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any[] = [];

  for (const node of nodes) {
    if (!node.type) continue;

    switch (node.type) {
      case "paragraph":
        result.push({
          type: "paragraph",
          children: convertInline(node.content ?? []),
        });
        break;
      case "heading":
        result.push({
          type: "heading",
          depth: Math.max(
            1,
            Math.min(
              6,
              (node.attrs as Record<string, number> | undefined)?.level ?? 1,
            ),
          ) as 1 | 2 | 3 | 4 | 5 | 6,
          children: convertInline(node.content ?? []),
        } as RootContent);
        break;
      case "blockquote":
        result.push({
          type: "blockquote",
          children: convertBlocks(node.content ?? []) as RootContent[],
        } as RootContent);
        break;
      case "codeBlock": {
        const lang =
          (node.attrs as Record<string, string> | undefined)?.language ?? "";
        // codeBlock 合法地可有多个 text 子节点（粘贴、高亮装饰把文本切开、程序化插入），
        // 只取第一个会把代码块截断，故拼接全部 text 子节点
        const text = (node.content ?? [])
          .map((child) => child.text ?? "")
          .join("");
        result.push({
          type: "code",
          lang: lang || null,
          meta: null,
          value: text,
        });
        break;
      }
      case "horizontalRule":
        result.push({ type: "thematicBreak" });
        break;
      case "bulletList":
      case "orderedList":
        result.push({
          type: "list",
          ordered: node.type === "orderedList",
          start: (node.attrs as Record<string, number> | undefined)?.start ?? 1,
          spread: false,
          children: (node.content ?? []).map(convertListItem),
        } as RootContent);
        break;
      case "taskList":
        result.push({
          type: "list",
          ordered: false,
          start: 1,
          spread: false,
          children: (node.content ?? []).map(convertListItem),
        } as RootContent);
        break;
      case "table": {
        const rowNodes = node.content ?? [];
        // 首行（GFM 总是表头）先求列数，便于对齐数组按列对齐
        const maxCols = Math.max(
          0,
          ...rowNodes.map((row) => (row.content ?? []).length),
        );
        // 按列收集对齐值：取每列中首个非空 align
        const alignMap = Array.from({ length: maxCols }, () => null) as Array<
          string | null
        >;
        for (const row of rowNodes) {
          (row.content ?? []).forEach((cell, cellIdx) => {
            if (cellIdx >= maxCols) return;
            const align =
              (cell.attrs as Record<string, string> | undefined)?.align ?? null;
            if (align && !alignMap[cellIdx]) alignMap[cellIdx] = align;
          });
        }
        const rows = rowNodes.map((row) => ({
          type: "tableRow" as const,
          children: (row.content ?? []).map(
            (cell) =>
              ({
                // GFM mdast 只定义 tableCell，表头由首行隐式决定。
                // 输出 tableHeader 会让 remark-stringify 抛
                // "Cannot handle unknown node 'tableHeader'"，含表格的文档直接导不出去。
                type: "tableCell" as const,
                // tableCell.children 必须是 PhrasingContent（GFM 契约）：单元格里是
                // 段落包裹的内联内容，直接 convertBlocks 会多包一层 paragraph，
                // 扁平表格序列化会因此错位；与导入侧（mdast-to-tiptap 把常规单元格
                // 当内联处理）保持一致，把段落展开成内联节点
                children: convertInline(
                  (cell.content ?? []).flatMap((child) => child.content ?? []),
                ),
              }) as unknown as RootContent,
          ) as RootContent[],
        }));
        const tableNode: Record<string, unknown> = {
          type: "table",
          children: rows,
        };
        // 汇总列对齐数组；只接受 GFM 支持的三种值，其余（justify、样式串等）一律按 null 处理——
        // 否则会被序列化器静默按错误对齐输出；长度按实际列数补齐 null，保障 `---`/`:--:` 正确
        const alignArr = alignMap.map((a) =>
          a === "left" || a === "right" || a === "center" ? a : null,
        );
        if (alignArr.some((a) => a)) tableNode.align = alignArr;
        result.push(tableNode as unknown as RootContent);
        break;
      }
      case "blockMath":
        result.push({
          // 块级公式：同样用 html 节点直接输出 $$...$$，绕开 mdast-util-math 序列化缺失
          // compilePattern 的兼容问题（见行内公式处说明）。
          type: "html",
          value: `$$\n${(node.attrs as Record<string, string> | undefined)?.latex ?? ""}\n$$`,
        } as RootContent);
        break;
      case "image": {
        const attrs = (node.attrs ?? {}) as Record<string, string>;
        result.push({
          type: "image",
          url: attrs.src ?? "",
          alt: attrs.alt ?? "",
          title: attrs.title || null,
        } as RootContent);
        break;
      }
      case "callout": {
        const attrs = (node.attrs ?? {}) as Record<string, unknown>;
        const attrStr = Object.entries(attrs)
          .filter(([, v]) => v !== "" && v !== undefined && v !== null)
          .map(([k, v]) =>
            typeof v === "string" ? `${k}="${v}"` : `${k}={${v}}`,
          )
          .join(" ");
        result.push({
          type: "html",
          value: `<Callout${attrStr ? " " + attrStr : ""} />`,
        } as RootContent);
        break;
      }
      case "figure": {
        const attrs = (node.attrs ?? {}) as Record<string, unknown>;
        const attrStr = Object.entries(attrs)
          .filter(([, v]) => v !== "" && v !== undefined && v !== null)
          .map(([k, v]) =>
            typeof v === "string" ? `${k}="${v}"` : `${k}={${v}}`,
          )
          .join(" ");
        result.push({
          type: "html",
          value: `<Figure${attrStr ? " " + attrStr : ""} />`,
        } as RootContent);
        break;
      }
      case "component":
      case "inlineComponent": {
        const attrs = (node.attrs ?? {}) as Record<string, unknown>;
        const source = typeof attrs.source === "string" ? attrs.source : "";
        if (source) {
          result.push({
            type: "html",
            value: source,
          } as RootContent);
        }
        break;
      }
      case "rawMdx": {
        const attrs = (node.attrs ?? {}) as Record<string, string>;
        result.push({
          type: "html",
          value: attrs.source ?? "",
        } as RootContent);
        break;
      }
      default:
        // 未知块类型（新注册的扩展、块级出现的 inlineComponent 等）：原来这里只写注释、
        // 实际静默丢弃，导出后内容无声消失。改为留告警 + 有 text 就按段落保底落一行。
        console.warn(
          "[tiptap-to-mdast] 未处理的块级节点，仅保留其文本：",
          node.type,
        );
        if (typeof node.text === "string" && node.text) {
          result.push({
            type: "paragraph",
            children: [{ type: "text", value: node.text }],
          } as RootContent);
        }
        break;
    }
  }

  return result;
}

// 内联转换的类型辅助（wrapWithMark 中使用）
interface MdastTextNode {
  type: "text";
  value: string;
}

function convertListItem(node: JSONContent): RootContent {
  if (node.type === "taskItem") {
    return {
      type: "listItem",
      checked:
        (node.attrs as Record<string, boolean> | undefined)?.checked ?? false,
      spread: false,
      children: convertBlocks(node.content ?? []),
    } as RootContent;
  }
  return {
    type: "listItem",
    spread: false,
    children: convertBlocks(node.content ?? []),
  } as RootContent;
}

/** 将 Tiptap mark 转换为 MDAST 包装节点 */
function wrapWithMark(
  content: PhrasingContent[],
  markType: string,
  markAttrs?: Record<string, unknown>,
): PhrasingContent[] {
  switch (markType) {
    case "bold":
      return [{ type: "strong", children: content } as PhrasingContent];
    case "italic":
      return [{ type: "emphasis", children: content } as PhrasingContent];
    case "strike":
      return [{ type: "delete", children: content } as PhrasingContent];
    case "code":
      // inlineCode is a leaf, extract text
      if (content.length === 1 && content[0].type === "text") {
        return [
          {
            type: "inlineCode",
            value: (content[0] as MdastTextNode).value,
          } as PhrasingContent,
        ];
      }
      return content;
    case "link":
      return [
        {
          type: "link",
          url: (markAttrs?.href as string) ?? "",
          title: null,
          children: content,
        } as PhrasingContent,
      ];
    default:
      return content;
  }
}

function convertInline(nodes: JSONContent[]): PhrasingContent[] {
  const result: PhrasingContent[] = [];

  for (const node of nodes) {
    if (!node.type) continue;

    if (node.type === "text") {
      const marks = node.marks ?? [];

      // inlineMath 是 Mark：当文本带该 mark 时整段作为行内公式导出（$...$）。
      // 用 html 节点直接输出 `$latex$`，绕开 mdast-util-math 的序列化（依赖更高版本
      // mdast-util-to-markdown 的 compilePattern，当前依赖树里缺失），remark-stringify
      // 会原样输出 html 节点值，remark-math 解析时能正确识别 $...$。
      const inlineMathMark = marks.find((m) => m.type === "inlineMath");
      if (inlineMathMark) {
        const latex =
          (inlineMathMark.attrs as Record<string, string> | undefined)?.latex ??
          node.text ??
          "";
        result.push({
          type: "html",
          value: `$${latex}$`,
        } as unknown as PhrasingContent);
        continue;
      }

      // 多行文本：Tiptap 中文本可含字面 `\n`（粘贴/自动换行遗留），若原样输出会
      // 破坏 MARKDOWN 结构。故按 `\n` 切分，段间插入 hardBreak（mdast `break`），
      // 并把同一组 marks 应用到一个段落内的每个文本片段上。
      const segments = (node.text ?? "").split("\n");
      // 末尾的空段会被下面的 continue 跳过，故用「最后一个非空段」决定是否还要插硬换行：
      // 否则 `"a\nb\n"` 会多出一个落在文末的 <br>（导出成 `a\\\nb\\\n`）
      let lastContentIdx = segments.length - 1;
      while (lastContentIdx >= 0 && segments[lastContentIdx] === "") {
        lastContentIdx--;
      }
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg === "" && i === segments.length - 1) continue;

        let current: PhrasingContent[] = [
          { type: "text", value: seg } as PhrasingContent,
        ];

        // 从内到外应用标记（Tiptap 中最后一个标记是最内层，MDAST 中最外层）
        // 需要按顺序应用：越早的阶段包裹越深
        // MDAST 嵌套顺序：link > strong > emphasis > delete
        // Tiptap 标记顺序不保证嵌套，因此按固定优先级应用：
        const priority = ["code", "strike", "italic", "bold", "link"];
        const sorted = [...marks].sort(
          (a, b) => priority.indexOf(a.type) - priority.indexOf(b.type),
        );
        for (const mark of sorted) {
          current = wrapWithMark(current, mark.type, mark.attrs);
        }

        result.push(...current);

        // 仅当后面还有非空段时才插硬换行（末尾空段已被跳过，见上）
        if (i < lastContentIdx) {
          result.push({ type: "break" } as PhrasingContent);
        }
      }
    } else if (node.type === "image") {
      const attrs = (node.attrs ?? {}) as Record<string, string>;
      result.push({
        type: "image",
        url: attrs.src ?? "",
        alt: attrs.alt ?? "",
        title: attrs.title || null,
      } as PhrasingContent);
    } else if (node.type === "wikiLink") {
      // wiki 双链导出为 [[label]] 纯文本 html 节点：remark-stringify 原样输出，往返内容不丢；
      // 读回时 remarkParse 视其为普通文本。href 不参与序列化（只作编辑器内跳转）。
      const attrs = (node.attrs ?? {}) as Record<string, string>;
      const label = attrs.label ?? "";
      result.push({
        type: "html",
        value: `[[${label}]]`,
      } as unknown as PhrasingContent);
    } else if (node.type === "inlineMath") {
      // 与上面的 mark 路径同一表示：用 html 节点输出 `$latex$`（mdast-util-math 的
      // 序列化在当前依赖树里缺失，产出真实 inlineMath 节点会让导出失败）；
      // 本仓 Tiptap 侧行内公式也确实是 mark，不产生 inlineMath 节点
      const latex =
        (node.attrs as Record<string, string> | undefined)?.latex ?? "";
      result.push({ type: "html", value: `$${latex}$` } as PhrasingContent);
    }
    // 注：inlineComponent 处理已推迟 — 第二阶段通常不使用
  }

  return result;
}
