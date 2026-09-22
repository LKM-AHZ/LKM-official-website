import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CalloutNodeView from "../../components/nodes/CalloutNodeView";
import { calloutPropsSchema } from "../registry/schemas";

export const Callout = Node.create({
  name: "callout",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      type: { default: "info" },
      title: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-callout": "", ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      CalloutNodeView as Parameters<typeof ReactNodeViewRenderer>[0],
    );
  },
});

export function parseCalloutProps(node: unknown): Record<string, unknown> {
  // node 来自 MDX 解析结果（unknown）：null/非对象直接视为「无属性」，否则取 attributes 就抛
  // TypeError；attributes 非数组时 for...of 也会抛，故一并按「无属性」兜底
  const raw = (node && typeof node === "object" ? node : {}) as Record<
    string,
    unknown
  >;
  const attrs: Record<string, unknown> = {};
  const attributes = Array.isArray(raw.attributes)
    ? (raw.attributes as Array<{
        type: string;
        name: string;
        value: string | number | boolean;
      }>)
    : [];

  for (const attr of attributes) {
    if (attr.type === "mdxJsxAttribute") {
      attrs[attr.name] = attr.value;
    }
  }

  // safeParse：title 是布尔、type 不在枚举里等非法属性不该抛 ZodError 中断整篇文档转换，
  // 回落到 schema 默认值（type=info / title=""）
  const parsed = calloutPropsSchema.safeParse(attrs);
  return (
    parsed.success ? parsed.data : calloutPropsSchema.parse({})
  ) as Record<string, unknown>;
}

/** JSX 属性值里的引号/反斜杠/换行会破坏输出甚至注入额外属性，必须转义 */
function escapeJsxAttr(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n");
}

export function serializeCalloutProps(props: Record<string, unknown>): string {
  const parsed = calloutPropsSchema.safeParse(props);
  const valid = parsed.success ? parsed.data : calloutPropsSchema.parse({});
  return Object.entries(valid)
    .filter(([, v]) => v !== "" && v !== undefined && v !== null)
    .map(([k, v]) => {
      if (typeof v === "string") return `${k}="${escapeJsxAttr(v)}"`;
      // 布尔/数字要以表达式输出：`k="true"` 在 JSX 里是字符串 "true"
      if (typeof v === "number" || typeof v === "boolean") return `${k}={${v}}`;
      return `${k}="${escapeJsxAttr(String(v))}"`;
    })
    .join(" ");
}
