import { memo, useState } from "react";
import type { ReactElement } from "react";
import { t } from "~/lib/i18n";

export interface FigureViewProps {
  src?: string;
  alt?: string;
  caption?: string;
  width?: number;
  align?: "left" | "center" | "right";
}

/**
 * Figure 共享展示组件（纯展示、无 Tiptap 副作用），输出 .lkm-* 统一类名。
 * 被编辑器 node view、预览面板复用；样式见 main.css 的 .lkm-figure*。
 */
const FigureView = memo(function FigureView({
  src,
  alt,
  caption,
  width,
  align = "center",
}: FigureViewProps): ReactElement {
  // src 非空但加载失败（资源被删/外链 404）时也要给占位，否则只剩浏览器的破图图标
  const [failed, setFailed] = useState(false);

  return (
    <figure className={`lkm-figure lkm-figure-${align}`}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt ?? ""}
          style={width ? { width: `${width}px` } : undefined}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="lkm-figure-placeholder">
          {t("editor.preview.noImage")}
        </span>
      )}
      {caption && (
        <figcaption className="lkm-figure-caption">{caption}</figcaption>
      )}
    </figure>
  );
});

export default FigureView;
