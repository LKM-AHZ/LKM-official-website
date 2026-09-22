import { memo, useState, useEffect, useRef } from "react";
import type { Node } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import InlineInput from "./InlineInput";
import { resolveImageSrc } from "../../persistence/image-store";
import { t } from "~/lib/i18n";

interface ImageNodeViewProps {
  node: Node;
  editor: Editor;
  getPos: () => number | undefined;
  updateAttributes: (attrs: Record<string, unknown>) => void;
}

const ImageNodeView = memo(function ImageNodeView({
  node,
  editor,
  getPos,
  updateAttributes,
}: ImageNodeViewProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [inlineMode, setInlineMode] = useState<"url" | "alt" | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  // 内联输入框渲染在 toolbar 之外的兄弟节点里，需一并计入「内部点击」
  const inlineRef = useRef<HTMLDivElement>(null);
  const src = (node.attrs.src as string) ?? "";
  // 实际可展示的 src：blob 引用需从 IndexedDB 解析为 ObjectURL
  const [displaySrc, setDisplaySrc] = useState<string>("");

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextClick = useRef(false);

  const clearLongPress = (): void => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  useEffect(() => clearLongPress, []);

  // 触屏用真正的长按（500ms）开关工具条：原实现是「每次 touchend 都切一次」，而移动端
  // touchend 之后浏览器还会补发 click，两次切换互相抵消、工具条实际打不开
  const handleTouchStart = (): void => {
    if (window.innerWidth >= 768) return;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      suppressNextClick.current = true;
      setShowToolbar((v) => !v);
    }, 500);
  };

  const handleImageClick = (): void => {
    // 长按已开/关过工具条，随后的合成 click 要吞掉，否则又被切回去
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    setShowToolbar((v) => !v);
  };

  useEffect(() => {
    let cancelled = false;
    resolveImageSrc(src).then((resolved) => {
      if (!cancelled) setDisplaySrc(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (!showToolbar) return;
    const handler = (e: MouseEvent): void => {
      const target = e.target as HTMLElement;
      // 内联输入框（URL/Alt）不在 toolbar 容器内，必须单独放行：
      // 否则第一次点进输入框就被判成外部点击而立刻卸载，输入框根本用不了。
      if (toolbarRef.current?.contains(target)) return;
      if (inlineRef.current?.contains(target)) return;
      setShowToolbar(false);
      setInlineMode(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showToolbar]);
  const alt = (node.attrs.alt as string) ?? "";
  const title = (node.attrs.title as string) ?? "";
  const width = (node.attrs.width as number) ?? undefined;
  const height = (node.attrs.height as number) ?? undefined;
  const align = (node.attrs.align as string) ?? "center";

  const alignClasses: Record<string, string> = {
    left: "mr-auto",
    center: "mx-auto",
    right: "ml-auto",
  };

  return (
    <NodeViewWrapper
      className={`relative inline-block group ${alignClasses[align] ?? ""}`}
      contentEditable={false}
      data-image-node
    >
      <img
        src={displaySrc}
        alt={alt}
        title={title || undefined}
        style={{
          width: width ? `${width}px` : "auto",
          height: height ? `${height}px` : "auto",
          maxWidth: "100%",
        }}
        className="rounded-md cursor-pointer border-2 border-transparent hover:border-primary/50 transition-colors"
        onClick={handleImageClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={clearLongPress}
        onTouchMove={clearLongPress}
        draggable={false}
      />

      {showToolbar && (
        <div
          ref={toolbarRef}
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-1 bg-page-bg border border-surface-3 rounded-lg shadow-lg p-1 max-w-[calc(100vw-2rem)]"
        >
          {/* Resize inputs */}
          <input
            type="number"
            className="rte-input w-16"
            value={width ?? ""}
            placeholder={t("editor.imageNode.width")}
            onChange={(e) =>
              updateAttributes({ width: Number(e.target.value) || undefined })
            }
          />
          <input
            type="number"
            className="rte-input w-16"
            value={height ?? ""}
            placeholder={t("editor.imageNode.height")}
            onChange={(e) =>
              updateAttributes({ height: Number(e.target.value) || undefined })
            }
          />
          {/* Align buttons */}
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              className={`rte-toolbar-btn ${align === a ? "is-active" : ""}`}
              onClick={() => updateAttributes({ align: a })}
              title={
                a === "left"
                  ? t("editor.imageNode.alignLeft")
                  : a === "center"
                    ? t("editor.imageNode.alignCenter")
                    : t("editor.imageNode.alignRight")
              }
            >
              {a === "left" ? "←" : a === "center" ? "↔" : "→"}
            </button>
          ))}
          {/* Alt text */}
          <button
            type="button"
            className={`rte-toolbar-btn ${inlineMode === "alt" ? "is-active" : ""}`}
            title={t("editor.imageNode.altText")}
            onClick={() => setInlineMode(inlineMode === "alt" ? null : "alt")}
          >
            Alt
          </button>
          {/* URL insert */}
          <button
            type="button"
            className={`rte-toolbar-btn ${inlineMode === "url" ? "is-active" : ""}`}
            title={t("editor.imageNode.replaceImage")}
            onClick={() => setInlineMode(inlineMode === "url" ? null : "url")}
          >
            {t("editor.imageNode.replace")}
          </button>
          {/* Delete */}
          <button
            type="button"
            className="rte-toolbar-btn text-error"
            title={t("editor.imageNode.deleteImage")}
            onClick={() => {
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
            ×
          </button>
        </div>
      )}

      {/* Inline input for URL or Alt */}
      {inlineMode === "url" && (
        <div
          ref={inlineRef}
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-40"
        >
          <InlineInput
            placeholder={t("editor.imageNode.urlPlaceholder")}
            defaultValue={src}
            onConfirm={(val) => {
              updateAttributes({ src: val });
              setInlineMode(null);
            }}
            onCancel={() => setInlineMode(null)}
          />
        </div>
      )}
      {inlineMode === "alt" && (
        <div
          ref={inlineRef}
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-40"
        >
          <InlineInput
            placeholder={t("editor.imageNode.altPlaceholder")}
            defaultValue={alt}
            onConfirm={(val) => {
              updateAttributes({ alt: val });
              setInlineMode(null);
            }}
            onCancel={() => setInlineMode(null)}
          />
        </div>
      )}

      {/* Caption */}
      {title && (
        <p className="text-xs text-center text-deep-text/60 mt-1">{title}</p>
      )}
    </NodeViewWrapper>
  );
});

export default ImageNodeView;
