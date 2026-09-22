import type { JSONContent } from "@tiptap/core";
import { safeUrl } from "./url-safety";

interface MarkLike {
  type: string;
  attrs?: Record<string, string>;
}

/** 将 TipTap JSONContent 序列化为 HTML 字符串（供 HTML / Word 导出共用） */
export function serializeHtml(nodes: JSONContent[]): string {
  return nodes.map(renderHtmlNode).join("\n");
}

function renderHtmlNode(node: JSONContent): string {
  const type = node.type ?? "";
  const text = node.text ?? "";
  const content = node.content;
  // TipTap 属性是 Record<string, any>：可能是布尔/数组/嵌套对象，断言成 string|number
  // 会掩盖这一点（后续 String()/模板插值会输出 "[object Object]"）。这里如实标成 unknown，
  // 各使用点再用 Number()/String()/safeUrl() 显式归一化。
  const attrs = (node.attrs ?? {}) as Record<string, unknown>;

  switch (type) {
    case "paragraph":
      return `<p>${renderChildren(content) ?? escapeHtml(text)}</p>`;
    case "heading": {
      const level = Math.min(Math.max(Number(attrs.level) || 1, 1), 6);
      return `<h${level}>${renderChildren(content) ?? escapeHtml(text)}</h${level}>`;
    }
    case "text":
      return renderText(node);
    case "blockquote":
      return `<blockquote>${renderChildren(content) ?? ""}</blockquote>`;
    case "bulletList":
      return `<ul>${renderChildren(content) ?? ""}</ul>`;
    case "orderedList":
      return `<ol>${renderChildren(content) ?? ""}</ol>`;
    case "taskList":
      return `<ul class="task-list">${renderChildren(content) ?? ""}</ul>`;
    case "listItem":
    case "taskItem":
      return `<li>${renderChildren(content) ?? ""}</li>`;
    case "codeBlock":
      // TipTap 把代码正文放在子 text 节点里，node.text 恒为空 —— 只读 node.text 会导出空代码块
      return `<pre><code>${renderChildren(content) ?? escapeHtml(text)}</code></pre>`;
    case "horizontalRule":
      return "<hr />";
    case "image":
      return `<img src="${escapeHtml(safeUrl(attrs.src))}" alt="${escapeHtml(String(attrs.alt ?? ""))}" />`;
    case "table":
      return `<table><tbody>${renderChildren(content) ?? ""}</tbody></table>`;
    case "tableRow":
      return `<tr>${renderChildren(content) ?? ""}</tr>`;
    case "tableCell":
      return `<td>${renderChildren(content) ?? escapeHtml(text)}</td>`;
    case "tableHeader":
      return `<th>${renderChildren(content) ?? escapeHtml(text)}</th>`;
    case "callout": {
      // ctype 直接进 class 属性，必须先转义；正文（renderChildren）不能丢
      const ctype = escapeHtml(String(attrs.type ?? "info"));
      const title = escapeHtml(String(attrs.title ?? attrs.type ?? "info"));
      return `<div class="callout callout-${ctype}">${title}${renderChildren(content) ?? ""}</div>`;
    }
    case "figure": {
      const img = attrs.src
        ? `<img src="${escapeHtml(safeUrl(attrs.src))}" alt="${escapeHtml(String(attrs.alt ?? ""))}" />`
        : "";
      const caption = attrs.caption
        ? `<figcaption>${escapeHtml(String(attrs.caption))}</figcaption>`
        : "";
      return `<figure>${img}${caption}</figure>`;
    }
    case "blockMath":
      return `<div class="math-block">$$${escapeHtml(String(attrs.latex ?? ""))}$$</div>`;
    case "rawMdx":
      return `<pre class="raw-mdx">${escapeHtml(String(attrs.source ?? ""))}</pre>`;
    default:
      return renderChildren(content) ?? escapeHtml(text);
  }
}

function renderText(node: JSONContent): string {
  let out = escapeHtml(node.text ?? "");
  const marks = (node.marks ?? []) as MarkLike[];
  for (const mark of marks) {
    if (mark.type === "bold") out = `<strong>${out}</strong>`;
    else if (mark.type === "italic") out = `<em>${out}</em>`;
    else if (mark.type === "underline") out = `<u>${out}</u>`;
    else if (mark.type === "strike") out = `<del>${out}</del>`;
    else if (mark.type === "code") out = `<code>${out}</code>`;
    else if (mark.type === "link")
      out = `<a href="${escapeHtml(safeUrl(mark.attrs?.href))}">${out}</a>`;
    else if (mark.type === "inlineMath")
      out = `<span class="math-inline">$${escapeHtml(mark.attrs?.latex ?? "")}$</span>`;
  }
  return out;
}

function renderChildren(content: JSONContent[] | undefined): string | null {
  if (!content) return null;
  return content.map(renderHtmlNode).join("");
}

function escapeHtml(s: string): string {
  return (
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      // 单引号也转义：当前属性都用双引号，但这是通用 helper，
      // 将来任何改成单引号的属性都会因此变成注入点
      .replace(/'/g, "&#39;")
  );
}
