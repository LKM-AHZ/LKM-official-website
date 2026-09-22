import { Mark } from "@tiptap/core";

export const CommentMark = Mark.create({
  name: "commentMark",

  addAttributes() {
    return {
      threadId: {
        default: "",
        // 必须显式解析：renderHTML 把 threadId 落到 data-thread-id 上，
        // 而 Tiptap 默认按属性同名（threadId）查找，HTML 往返（粘贴/getHTML/重载/导入）
        // 会读不到值而被重置为空，批注与评论线程的关联就断了。
        parseHTML: (el) => el.getAttribute("data-thread-id") ?? "",
      },
      resolved: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-resolved") === "true",
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-comment-mark]" }];
  },

  renderHTML({ HTMLAttributes }) {
    // 如实标注：resolved 是布尔属性（默认 false、解析时用 === "true"），
    // 断言成 Record<string, string> 会掩盖这点，一旦收到字符串 "false" 真值判断就会出错
    const { threadId, resolved, ...rest } = HTMLAttributes as {
      threadId?: string;
      resolved?: boolean;
      [key: string]: unknown;
    };
    return [
      "span",
      {
        // rest 必须放前面：这些 data-* 标记与 class 是解析/渲染契约的一部分，
        // 不能让传入的同名属性把它们覆盖掉
        ...rest,
        "data-comment-mark": "",
        "data-thread-id": threadId,
        "data-resolved": resolved ? "true" : "false",
        class: resolved ? "comment-highlight-resolved" : "comment-highlight",
      },
      0,
    ];
  },
});
