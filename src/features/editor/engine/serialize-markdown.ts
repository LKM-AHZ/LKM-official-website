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
      return renderList(content ?? [], true);
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
      return `![${alt}](${escapeMarkdownUrl(src)})`;
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
      const img = `![${alt}](${escapeMarkdownUrl(src)})`;
      return caption ? `${img}\n\n*${escapeText(caption)}*` : img;
    }
    case "blockMath":
      return `$$\n${String(attrs.latex ?? "")}\n$$`;
    case "rawMdx":
    case "component":
    case "inlineComponent": {
      const source = String(attrs.source ?? "");
      return source ? `\`\`\`mdx\n${source}\n\`\`\`` : "";
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
        return `![${attrs.alt ?? ""}](${escapeMarkdownUrl(attrs.src)})`;
      }
      return renderInline(node.content ?? []);
    })
    .join("");
}

function renderInlineText(node: JSONContent): string {
  const marks = (node.marks ?? []) as MarkLike[];
  const inlineMath = marks.find((m) => m.type === "inlineMath");
  if (inlineMath) {
    return `$${inlineMath.attrs?.latex ?? node.text ?? ""}$`;
  }
  let out = escapeText(node.text ?? "");
  for (const mark of marks) {
    if (mark.type === "bold") out = `**${out}**`;
    else if (mark.type === "italic") out = `*${out}*`;
    else if (mark.type === "strike") out = `~~${out}~~`;
    else if (mark.type === "code") out = `\`${out}\``;
    else if (mark.type === "link")
      out = `[${out}](${escapeMarkdownUrl(mark.attrs?.href)})`;
  }
  return out;
}

function renderList(items: JSONContent[], ordered: boolean): string {
  return items
    .map((item, index) => {
      const itemType = item.type ?? "";
      const marker = ordered ? `${index + 1}.` : "-";
      const inner = (item.content ?? [])
        .map((c) =>
          c.type === "paragraph"
            ? renderInline(c.content ?? [])
            : renderBlock(c),
        )
        .join(" ");
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
  const renderRow = (row: JSONContent): string => {
    const cells = (row.content ?? []).map((cell) =>
      renderInline(cell.content ?? []).trim(),
    );
    return `| ${cells.join(" | ")} |`;
  };
  const header = renderRow(first);
  const colCount = (first.content ?? []).length;
  const sep = `| ${Array.from({ length: colCount }, () => "---").join(" | ")} |`;
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
