import { useState } from "react";
import type { ReactElement } from "react";
import { t } from "~/lib/i18n";

interface ImageUrlPopoverProps {
  onInsert: (src: string, alt: string) => void;
  onClose: () => void;
}

export default function ImageUrlPopover({
  onInsert,
  onClose,
}: ImageUrlPopoverProps): ReactElement {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (
    e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ): void => {
    e.preventDefault();
    const trimmed = src.trim();
    if (!trimmed) return;
    // 地址来自用户输入/文档内容，且提交后直接写进文档：放行 javascript:/data:text/html
    // 之类协议会被渲染成可执行 URL，故按白名单校验（http(s)、站内 / 绝对路径、data:image/）
    if (!/^(https?:|\/|data:image\/)/i.test(trimmed)) {
      setError(
        t("editor.validation.disallowedProtocol", {
          nodeType: "image",
          url: trimmed,
        }),
      );
      return;
    }
    setError("");
    onInsert(trimmed, alt.trim());
  };

  return (
    <div className="rte-dialog-backdrop" onClick={onClose}>
      <div className="rte-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">
          {t("editor.insertImage")}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label
            htmlFor="image-url-input"
            className="text-sm font-medium text-deep-text/70 block mb-1"
          >
            {t("editor.imageUrl")}
          </label>
          <input
            id="image-url-input"
            type="url"
            className="rte-input"
            value={src}
            onChange={(e) => {
              setSrc(e.target.value);
              setError("");
            }}
            placeholder="https://..."
            autoFocus
          />
          {error && <p className="text-xs text-error">{error}</p>}
          <label
            htmlFor="image-alt-input"
            className="text-sm font-medium text-deep-text/70 block mb-1"
          >
            {t("editor.altText")}
          </label>
          <input
            id="image-alt-input"
            type="text"
            className="rte-input"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder={t("editor.imageDescription")}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="rte-btn rte-btn--ghost rte-btn--sm"
              onClick={onClose}
            >
              {t("editor.cancel")}
            </button>
            <button
              type="submit"
              className="rte-btn rte-btn--primary rte-btn--sm"
              disabled={!src.trim()}
            >
              {t("editor.confirm")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
