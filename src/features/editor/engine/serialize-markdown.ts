import type { JSONContent } from "@tiptap/core";
import { escapeMarkdownUrl } from "./url-safety";

interface MarkLike {
  type: string;
  attrs?: Record<string, string>;
}

const CALLOUT_ALERTS: Record<string, string> = {
  info: "NOTE",
  warning: "WARNING",
  error: "CAUTION",
  success: "TIP",
};

/**
 * 将 TipTap JSONContent 序列化为纯 Markdown。
 * 与 exportMdx 不同：JSX 组件节点（callout / figure / rawMdx）降级为 markdown 等价物。
 */
export function serializeMarkdown(nodes: JSONContent[]): string {
  const blocks = nodes.map(renderBlock).filter((s) => s.length > 0);
  return blocks.length > 0 ? blocks.join("\n\n") + "\n" : "";
}

function renderBlock(node: JSONContent): string {
  const type = node.type ?? "";
  const text = node.text ?? "";
  const content = node.content;
  const attrs = (node.attrs ?? {}) as Record<string, string | number | boolean>;

  switch (type) {
    case "paragraph":
      return renderInline(content ?? []);
    case "heading": {
      const level = Math.min(Math.max(Number(attrs.level) || 1, 1), 6);
      return `${"#".repeat(level)} ${renderInline(content ?? [])}`;
    }
    case "blockquote":
      return `> ${(content ?? []).map(renderBlock).join("\n> ")}`;
    case "bulletList":
      return renderList(content ?? [], false);
    case "orderedList":
      // start 是 Tiptap orderedList 的起始序号，原来被忽略（总是从 1 重排）
      return renderList(content ?? [], true, Number(attrs.start) || 1);
    case "taskList":
      return renderList(content ?? [], false);
    case "codeBlock": {
      const lang = String(attrs.language ?? "");
      // TipTap 把代码正文放在子 text 节点里，node.text 恒为空 —— 只读 node.text 会导出空代码块
      const code = (content ?? []).map((child) => child.text ?? "").join("");
      return `\`\`\`${lang}\n${code || text}\n\`\`\``;
    }
    case "horizontalRule":
      return "---";
    case "image": {
      const alt = String(attrs.alt ?? "");
      const src = String(attrs.src ?? "");
      return renderImage(alt, src);
    }
    case "table":
      return renderTable(content ?? []);
    case "callout": {
      const ctype = String(attrs.type ?? "info");
      const title = String(attrs.title ?? "");
      const alert = CALLOUT_ALERTS[ctype] ?? "NOTE";
      return `> [!${alert}]${title ? `\n> ${escapeText(title)}` : ""}`;
    }
    case "figure": {
      const src = String(attrs.src ?? "");
      const alt = String(attrs.alt ?? "");
      const caption = String(attrs.caption ?? "");
      if (!src) return "";
      const img = renderImage(alt, src);
      return caption ? `${img}\n\n*${escapeText(caption)}*` : img;
    }
    case "blockMath":
      return `$$\n${String(attrs.latex ?? "")}\n$$`;
    case "rawMdx":
    case "component":
    case "inlineComponent": {
      const source = String(attrs.source ?? "");
      if (!source) return "";
      // 源码里若自带 ``` 会提前闭合围栏，把余下的 JSX/MDX 泄漏成正文（remark 会当 HTML/JSX
      // 解析，等于让导出物带可执行内容）；围栏取「比源码中最长反引号串更长」
      const fence = "`".repeat(Math.max(3, longestBacktickRun(source) + 1));
      return `${fence}mdx\n${source}\n${fence}`;
    }
    default:
      return renderInline(content ?? []) || escapeText(text);
  }
}

function renderInline(nodes: JSONContent[]): string {
  return nodes
    .map((node) => {
      const type = node.type ?? "";
      if (type === "text") return renderInlineText(node);
      if (type === "image") {
        const attrs = (node.attrs ?? {}) as Record<string, string>;
        return renderImage(attrs.alt ?? "", attrs.src ?? "");
      }
      // 无 content 也无 text 的行内原子节点原来会被静默丢掉：
      // hardBreak 是段内换行（mdx 侧映射为 break），wikiLink 则整条链接消失
      if (type === "hardBreak") return "\\\n";
      if (type === "wikiLink") {
        const attrs = (node.attrs ?? {}) as Record<string, string>;
        // 与 mdx 侧同一表示：只序列化 label（href 仅供编辑器内跳转）
        return `[[${attrs.label || attrs.href || ""}]]`;
      }
      return renderInline(node.content ?? []);
    })
    .join("");
}

// 字符串里最长连续反引号串的长度：用来挑一个不会与内容冲突的围栏长度
function longestBacktickRun(s: string): number {
  let max = 0;
  for (const m of s.matchAll(/`+/g)) {
    max = Math.max(max, m[0].length);
  }
  return max;
}

function renderInlineText(node: JSONContent): string {
  const marks = (node.marks ?? []) as MarkLike[];
  const inlineMath = marks.find((m) => m.type === "inlineMath");
  if (inlineMath) {
    return `$${inlineMath.attrs?.latex ?? node.text ?? ""}$`;
  }
  const raw = node.text ?? "";
  // code 标记内的文本不能走 escapeText：Markdown 代码跨度里 `\`` 不会还原成反引号、
  // `\\` 不会还原成反斜杠，转义只会污染代码本身
  const isCode = marks.some((m) => m.type === "code");
  let out = isCode ? raw : escapeText(raw);
  for (const mark of marks) {
    if (mark.type === "bold") out = `**${out}**`;
    else if (mark.type === "italic") out = `*${out}*`;
    else if (mark.type === "strike") out = `~~${out}~~`;
    else if (mark.type === "code") {
      const fence = "`".repeat(longestBacktickRun(raw) + 1);
      // 内容自身以反引号开头/结尾时，围栏与内容间要留空格，否则会并进代码内容
      const pad = raw.startsWith("`") || raw.endsWith("`") ? " " : "";
      out = `${fence}${pad}${raw}${pad}${fence}`;
    } else if (mark.type === "link")
      out = `[${out}](${escapeMarkdownUrl(mark.attrs?.href)})`;
  }
  return out;
}

function renderList(items: JSONContent[], ordered: boolean, start = 1): string {
  return items
    .map((item, index) => {
      const itemType = item.type ?? "";
      const marker = ordered ? `${start + index}.` : "-";
      const parts = (item.content ?? []).map((c) =>
        c.type === "paragraph" ? renderInline(c.content ?? []) : renderBlock(c),
      );
      // 首个块接在标记之后；其余块（嵌套列表/代码块/引用）各自换行并缩进到条目内容的列上
      // ——原来用一个空格 join 会把它们挤成一行、markdown 结构随之损坏
      const indent = " ".repeat(marker.length + 1);
      const first = parts[0] ?? "";
      const rest = parts
        .slice(1)
        .filter((p) => p !== "")
        .map((p) =>
          p
            .split("\n")
            .map((line) => `${indent}${line}`)
            .join("\n"),
        );
      const inner = [first, ...rest].filter((p) => p !== "").join("\n");
      if (itemType === "taskItem") {
        const checked =
          (item.attrs as Record<string, boolean> | undefined)?.checked ?? false;
        return `${marker} [${checked ? "x" : " "}] ${inner}`;
      }
      return `${marker} ${inner}`;
    })
    .join("\n");
}

function renderTable(rows: JSONContent[]): string {
  if (rows.length === 0) return "";
  const first = rows[0];
  if (!first) return "";
  const colCount = (first.content ?? []).length;
  // 单元格里的 `|` 会截断行、换行会破坏表格结构，故先转义再拼；
  // 列数一律按表头对齐（多则截断、少则补空），否则整行错位
  const renderCell = (cell: JSONContent): string =>
    // 兜底必须是 [] 而不是 ""：renderInline 要的是节点数组，空串没有 .map，
    // 空单元格（无 content）会让导表整个抛 TypeError
    renderInline(cell.content ?? [])
      .replace(/\|/g, "\\|")
      .replace(/\r?\n/g, " ")
      .trim();
  const renderRow = (row: JSONContent): string => {
    const cells = (row.content ?? []).map(renderCell);
    const normalised = Array.from(
      { length: colCount },
      (_, i) => cells[i] ?? "",
    );
    return `| ${normalised.join(" | ")} |`;
  };
  const header = renderRow(first);
  // 分隔行按表头各列的对齐属性输出（默认 ---），不再一律 ---
  const sep = `| ${Array.from({ length: colCount }, (_, i) => {
    const align = (
      (first.content ?? [])[i]?.attrs as Record<string, string> | undefined
    )?.align;
    if (align === "center") return ":--:";
    if (align === "right") return "--:";
    if (align === "left") return ":--";
    return "---";
  }).join(" | ")} |`;
  return [header, sep, ...rows.slice(1).map(renderRow)].join("\n");
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

/**
 * 图片 Markdown 统一出口：alt 里的 `]`、`[`、反斜杠与换行会截断图片语法，
 * 之后的文本会被当成 Markdown 解析（等于注入）；src 走 URL 转义。
 */
function renderImage(alt: string, src: string): string {
  const safeAlt = alt
    .replace(/\\/g, "\\\\")
    .replace(/[[\]]/g, "\\$&")
    .replace(/\r?\n/g, " ");
  return `![${safeAlt}](${escapeMarkdownUrl(src)})`;
}
