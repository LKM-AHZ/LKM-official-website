import { nodeInputRule } from "@tiptap/core";
import ImageExtension from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ImageNodeView from "../../components/nodes/ImageNodeView";

/** 只接受纯像素整数（width="320"）；"50%"、"auto" 之类的值一律视为未设置 */
function parseDimension(
  element: HTMLElement,
  name: "width" | "height",
): number | null {
  const raw = element.getAttribute(name);
  if (!raw || !/^\d+$/.test(raw.trim())) return null;
  return Number.parseInt(raw, 10);
}

export const CustomImage = ImageExtension.extend({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      // 覆写 width/height 会丢掉父扩展的解析归一化：DOM 上的 width="50%"/"auto"
      // 会被原样带进来，而 node view 用 `${width}px` 渲染，非数字会产出非法 CSS。
      // 这里在解析阶段就只接受像素整数，其余一律 null。
      width: {
        default: null,
        parseHTML: (element) => parseDimension(element, "width"),
      },
      height: {
        default: null,
        parseHTML: (element) => parseDimension(element, "height"),
      },
      align: { default: "center" },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { align, width, height, ...rest } = HTMLAttributes;
    return ["img", { ...rest, "data-align": align, width, height }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /!(?:\[([^\]]*)\]\((\S+?)\))/,
        type: this.type,
        getAttributes: (match) => ({
          src: match[2] ?? "",
          alt: match[1] ?? "",
        }),
      }),
    ];
  },
});
