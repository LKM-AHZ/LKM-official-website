import { memo, useState, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import type { Node } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { t } from "~/lib/i18n";
import FigureView from "../shared/FigureView";

/** 图片宽度上限（px）：超过版心的值没有意义，夹住以免写出异常属性 */
const MAX_FIGURE_WIDTH = 2000;

/**
 * 输入侧只接受有限正数并夹到上限。原写法 `Number(x) || undefined` 会把合法的 0 当成空、
 * 又放行负数/Infinity，最终渲染出 `width: NaNpx`/负数这类非法 CSS（浏览器静默丢弃）。
 */
function toFigureSize(raw: string): number | undefined {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(Math.round(n), MAX_FIGURE_WIDTH);
}

/** 三个文本字段的 label + input 结构完全一致：抽成一处渲染，样式/属性不会各自漂移 */
function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}): ReactElement {
  return (
    <>
      <label className="text-xs font-medium block mb-1">{label}</label>
      <input
        type="text"
        className="rte-input rte-input--sm w-full mb-2"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  );
}

interface FigureNodeViewProps {
  node: Node;
  editor: Editor;
  getPos: () => number | undefined;
  updateAttributes: (attrs: Record<string, unknown>) => void;
}

const FigureNodeView = memo(function FigureNodeView({
  node,
  editor,
  getPos,
  updateAttributes,
}: FigureNodeViewProps) {
  const [editing, setEditing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const src = (node.attrs.src as string) ?? "";

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent): void => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as HTMLElement)
      ) {
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing]);
  const alt = (node.attrs.alt as string) ?? "";
  const caption = (node.attrs.caption as string) ?? "";
  const width = (node.attrs.width as number) ?? undefined;
  const align = (node.attrs.align as "left" | "center" | "right") ?? "center";

  return (
    <NodeViewWrapper
      as="figure"
      className="relative my-4"
      contentEditable={false}
      data-figure
    >
      <div className="cursor-pointer" onClick={() => setEditing(!editing)}>
        <FigureView
          src={src}
          alt={alt}
          caption={caption}
          width={width}
          align={align}
        />
      </div>

      {editing && (
        <div
          ref={panelRef}
          className="absolute top-full left-0 mt-1 z-30 bg-page-bg border border-surface-3 rounded-lg shadow-lg p-3 w-72 max-w-[calc(100vw-2rem)]"
        >
          <TextField
            label={t("editor.figure.imageUrl")}
            value={src}
            placeholder="https://..."
            onChange={(v) => updateAttributes({ src: v })}
          />
          <TextField
            label={t("editor.figure.altText")}
            value={alt}
            placeholder={t("editor.figure.imageDescription")}
            onChange={(v) => updateAttributes({ alt: v })}
          />
          <TextField
            label={t("editor.figure.caption")}
            value={caption}
            placeholder={t("editor.figure.captionPlaceholder")}
            onChange={(v) => updateAttributes({ caption: v })}
          />
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1">
                {t("editor.figure.width")}
              </label>
              <input
                type="number"
                className="rte-input rte-input--sm w-full"
                value={width ?? ""}
                placeholder={t("editor.figure.auto")}
                onChange={(e) =>
                  updateAttributes({ width: toFigureSize(e.target.value) })
                }
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1">
                {t("editor.figure.align")}
              </label>
              <select
                className="rte-select rte-select--sm w-full"
                value={align}
                onChange={(e) => updateAttributes({ align: e.target.value })}
              >
                <option value="left">{t("editor.figure.alignLeft")}</option>
                <option value="center">{t("editor.figure.alignCenter")}</option>
                <option value="right">{t("editor.figure.alignRight")}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-1 justify-end">
            <button
              type="button"
              className="rte-btn rte-btn--ghost rte-btn--xs text-error"
              onMouseDown={(e) => {
                e.preventDefault();
                const pos = getPos();
                if (pos !== undefined) {
                  editor
                    .chain()
                    .focus()
                    .deleteRange({ from: pos, to: pos + node.nodeSize })
                    .run();
                }
              }}
            >
              {t("editor.delete")}
            </button>
            <button
              type="button"
              className="rte-btn rte-btn--primary rte-btn--xs"
              onMouseDown={(e) => {
                e.preventDefault();
                setEditing(false);
              }}
            >
              {t("editor.confirm")}
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
});

export default FigureNodeView;
