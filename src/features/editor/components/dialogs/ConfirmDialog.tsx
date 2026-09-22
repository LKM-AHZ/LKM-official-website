import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { t } from "~/lib/i18n";

interface ConfirmDialogProps {
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  message,
  confirmLabel = t("editor.confirm"),
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement {
  // 只有「按下与松开都落在遮罩本身」才算点击遮罩：否则在面板内拖选文本、
  // 移到遮罩上松手会被当成点击遮罩，静默丢掉用户正在填的内容
  const pressedOnBackdrop = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // 弹窗语义与键盘可达性：Escape 关闭、初始焦点落在确认按钮、Tab 在面板内循环。
  // 同级弹窗（AuthModal.vue / settings/ConfirmDialog.vue）都带 role="dialog"，这里补齐以免
  // 键盘/读屏用户既发现不了这个对话框、也退不出去
  useEffect(() => {
    confirmRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables =
        panelRef.current.querySelectorAll<HTMLElement>("button");
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="rte-dialog-backdrop"
      onMouseDown={(e) => {
        pressedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedOnBackdrop.current && e.target === e.currentTarget)
          onCancel();
      }}
    >
      <div
        className="rte-dialog"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rte-confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="rte-confirm-dialog-title"
          className="text-lg font-semibold mb-4"
        >
          {t("editor.confirmTitle")}
        </h3>
        <p className="text-sm text-deep-text/80 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rte-btn rte-btn--ghost rte-btn--sm"
            onClick={onCancel}
          >
            {t("editor.cancel")}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className={`rte-btn rte-btn--sm ${danger ? "rte-btn--ghost text-error" : "rte-btn--primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
