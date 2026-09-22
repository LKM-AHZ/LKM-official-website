import { Mark } from "@tiptap/core";

export const InlineMath = Mark.create({
  name: "inlineMath",
  priority: 200,

  addAttributes() {
    return {
      latex: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-inline-math]" }];
  },

  renderHTML({ HTMLAttributes }) {
    // 属性是松散类型（可能是数字等），用运行时收窄而不是断言
    const latex =
      typeof HTMLAttributes.latex === "string" ? HTMLAttributes.latex : "";
    return [
      "span",
      {
        "data-inline-math": "",
        "data-latex": latex,
        class: "katex-inline cursor-pointer",
        ...HTMLAttributes,
      },
    ];
  },
});
