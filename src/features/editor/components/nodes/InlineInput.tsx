import { useState, useRef, useEffect } from "react";
import type { ReactElement } from "react";
import { t } from "~/lib/i18n";

interface InlineInputProps {
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function InlineInput({
  placeholder,
  defaultValue = "",
  onConfirm,
  onCancel,
}: InlineInputProps): ReactElement {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onCancel();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onCancel]);

  const handleSubmit = (): void => {
    if (value.trim()) {
      onConfirm(value.trim());
    } else {
      onCancel();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-1 bg-page-bg border border-surface-3 rounded-lg shadow-lg p-1"
    >
      <input
        ref={inputRef}
        type="text"
        className="rte-input w-40"
        value={value}
        placeholder={placeholder}
        // placeholder 不足以保证可访问名，补显式 aria-label
        aria-label={placeholder ?? t("editor.confirm")}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // 输入框在 ProseMirror 树内：不拦截的话回车/esc 会继续冒泡到编辑器
          //（插入节点、退出其它 UI），所以消费这两个键时要阻断默认与冒泡
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }
        }}
      />
      <button
        type="button"
        className="rte-btn rte-btn--primary rte-btn--xs"
        onClick={handleSubmit}
      >
        {t("editor.confirm")}
      </button>
      <button
        type="button"
        className="rte-btn rte-btn--ghost rte-btn--xs"
        onClick={onCancel}
      >
        ×
      </button>
    </div>
  );
}
