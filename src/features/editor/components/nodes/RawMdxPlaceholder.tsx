import { memo, useState } from "react";
import type { Node } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { t } from "~/lib/i18n";

interface RawMdxPlaceholderProps {
  node: Node;
  editor: Editor;
  getPos: () => number | undefined;
}

// 预览只截前 N 个字符（复制按钮给的是完整源码），抽成常量避免两处 200 各自漂移
const MAX_PREVIEW_LENGTH = 200;

const RawMdxPlaceholder = memo(function RawMdxPlaceholder({
  node,
  editor,
  getPos,
}: RawMdxPlaceholderProps) {
  const [showSource, setShowSource] = useState(false);
  const source = (node.attrs.source as string) ?? "";
  const sourceKind = (node.attrs.sourceKind as string) ?? "flow";
  const truncatedSource =
    source.length > MAX_PREVIEW_LENGTH
      ? source.slice(0, MAX_PREVIEW_LENGTH) + "…"
      : source;

  const handleDelete = (): void => {
    const pos = getPos();
    if (pos !== undefined) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .run();
    }
  };

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(source);
    } catch (err) {
      console.warn("[RawMdxPlaceholder] 剪贴板操作失败:", err);
    }
  };

  return (
    <NodeViewWrapper
      className="my-2 border border-warning/40 rounded-lg bg-warning/10 p-4 select-none"
      contentEditable={false}
      data-raw-mdx
    >
      <div className="flex items-center gap-2 mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-warning"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="text-sm font-medium text-warning">
          {sourceKind === "text"
            ? t("editor.rawMdx.unsupportedInline")
            : t("editor.rawMdx.unsupportedBlock")}
        </span>
      </div>

      {showSource && (
        <pre className="text-xs bg-surface-3/50 rounded p-2 mb-2 overflow-x-auto font-mono whitespace-pre-wrap">
          {truncatedSource}
        </pre>
      )}

      <div className="flex gap-1">
        <button
          type="button"
          className="rte-btn rte-btn--ghost rte-btn--xs"
          onClick={() => setShowSource(!showSource)}
        >
          {showSource
            ? t("editor.rawMdx.hideSource")
            : t("editor.rawMdx.showSource")}
        </button>
        <button
          type="button"
          className="rte-btn rte-btn--ghost rte-btn--xs"
          onClick={handleCopy}
        >
          {t("editor.rawMdx.copy")}
        </button>
        <button
          type="button"
          className="rte-btn rte-btn--ghost rte-btn--xs text-error"
          onClick={handleDelete}
        >
          {t("editor.delete")}
        </button>
      </div>
    </NodeViewWrapper>
  );
});

export default RawMdxPlaceholder;
