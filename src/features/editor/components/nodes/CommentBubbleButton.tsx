import type { Editor } from "@tiptap/core";
import type { ReactElement } from "react";
import { t } from "~/lib/i18n";

interface CommentBubbleButtonProps {
  editor: Editor;
  onClick: (from: number, to: number, text: string) => void;
}

export default function CommentBubbleButton({
  editor,
  onClick,
}: CommentBubbleButtonProps): ReactElement {
  const handleComment = (): void => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");
    // 传去空白后的文本：原来守卫用 trim 判断、却把原文（含 textBetween 塞的分隔空格）存进批注
    const trimmed = text.trim();
    if (trimmed) {
      onClick(from, to, trimmed);
    }
  };

  return (
    <button
      type="button"
      className="rte-toolbar-btn"
      title={t("editor.addComment")}
      // 动作挂在 click 上：Enter/Space 只会派发 click，只写 onMouseDown 键盘用户无法加批注。
      // onMouseDown 仍保留 preventDefault，用于阻止编辑器失焦/选区丢失（它不会拦截 click）。
      onClick={handleComment}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
