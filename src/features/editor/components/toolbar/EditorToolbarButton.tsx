import { memo } from "react";
import type { ReactNode } from "react";

interface EditorToolbarButtonProps {
  icon: ReactNode;
  label: string;
  title: string;
  /** 可选：纯动作按钮（插表格/图片等）不传，避免被读屏当成「未按下的切换键」 */
  isActive?: boolean;
  onClick: () => void;
}

const EditorToolbarButton = memo(function EditorToolbarButton({
  icon,
  label,
  title,
  isActive,
  onClick,
}: EditorToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`rte-toolbar-btn ${isActive ? "is-active" : ""}`}
      title={title}
      // 与 BubbleMenu/CommentBubbleButton 一致：mousedown 阻止默认，避免按钮抢走
      // 编辑器焦点（选区丢失会让依赖选区的动作与气泡菜单失效）
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
    >
      {icon}
    </button>
  );
});

export default EditorToolbarButton;
