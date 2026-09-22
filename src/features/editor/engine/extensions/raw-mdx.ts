import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import RawMdxPlaceholder from "../../components/nodes/RawMdxPlaceholder";

/**
 * rawMdx.sourceKind 的取值域：flow = 块级原始 MDX，text = 行内文本型原始节点。
 * 导出给消费方（RawMdxPlaceholder / mdast-to-tiptap）共用，避免各处再写裸字面量。
 */
export type RawMdxSourceKind = "flow" | "text";

export const RawMdx = Node.create({
  name: "rawMdx",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      source: { default: "" },
      sourceKind: { default: "flow" satisfies RawMdxSourceKind },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-raw-mdx]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-raw-mdx": "", ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(RawMdxPlaceholder);
  },
});
