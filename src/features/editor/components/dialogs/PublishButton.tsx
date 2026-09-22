import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import type { DocumentData, PersistenceAdapter } from "../../engine/types";
import ConfirmDialog from "./ConfirmDialog";
import { t } from "~/lib/i18n";

interface PublishButtonProps {
  documentId: string;
  adapter: PersistenceAdapter;
  onStatusChange: () => void;
  onOpenPublishDialog: () => void;
}

export default function PublishButton({
  documentId,
  adapter,
  onStatusChange,
  onOpenPublishDialog,
}: PublishButtonProps): ReactElement | null {
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  useEffect(() => {
    const result = adapter.loadDocument(documentId);
    if (result instanceof Promise) {
      result.then((d) => setDoc(d ?? null));
    } else {
      setDoc(result ?? null);
    }
  }, [adapter, documentId]);

  if (!doc) return null;

  const handlePublish = (): void => {
    onOpenPublishDialog();
  };

  /** 保存状态并同步本地 doc：否则组件仍按旧 status 渲染（如取消发布后还显示已发布控件）。 */
  const persistStatus = (status: DocumentData["status"]): void => {
    const result = adapter.saveDocument({ ...doc, status });
    const onSaved = (): void => {
      setDoc((prev) => (prev ? { ...prev, status } : prev));
      onStatusChange();
    };
    if (result instanceof Promise) {
      result
        .then((ok) => {
          if (ok !== false) onSaved();
        })
        .catch((err: unknown) => {
          // 没有 catch 时保存失败的 rejection 会被静默吞掉，用户看不到任何反馈
          console.error("[editor] 保存文档状态失败", err);
          alert(t("messages.operationFailed"));
        });
    } else if (result !== false) {
      onSaved();
    }
  };

  const handleUnpublish = (): void => {
    persistStatus("draft");
  };

  const handleArchive = (): void => {
    setArchiveConfirmOpen(true);
  };

  const handleArchiveConfirmed = (): void => {
    setArchiveConfirmOpen(false);
    persistStatus("archived");
  };

  const status = doc.status as DocumentData["status"];

  return (
    <>
      {status === "published" ? (
        <div className="flex gap-1">
          <button
            type="button"
            className="rte-btn rte-btn--sm text-success"
            onClick={handleUnpublish}
            title={t("editor.published")}
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
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </button>
          <button
            type="button"
            className="rte-btn rte-btn--ghost rte-btn--xs text-error"
            onClick={handleArchive}
            title={t("editor.archive")}
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
              <rect width="20" height="5" x="2" y="3" rx="1" />
              <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
              <path d="M10 12h4" />
            </svg>
          </button>
        </div>
      ) : status === "archived" ? (
        <button
          type="button"
          className="rte-btn rte-btn--ghost rte-btn--xs"
          onClick={handleUnpublish}
          title={t("editor.archivedClickToRestore")}
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
            <rect width="20" height="5" x="2" y="3" rx="1" />
            <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
            <path d="m9 15 3-3 3 3" />
            <path d="M12 12v9" />
          </svg>
        </button>
      ) : (
        <div className="flex gap-1">
          <button
            type="button"
            className="rte-btn rte-btn--primary rte-btn--xs"
            onClick={handlePublish}
            title={t("editor.publish")}
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
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
          <button
            type="button"
            className="rte-btn rte-btn--ghost rte-btn--xs text-error"
            onClick={handleArchive}
            title={t("editor.archive")}
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
              <rect width="20" height="5" x="2" y="3" rx="1" />
              <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
              <path d="M10 12h4" />
            </svg>
          </button>
        </div>
      )}
      {archiveConfirmOpen && (
        <ConfirmDialog
          message={t("editor.confirmArchiveMessage")}
          danger
          onConfirm={handleArchiveConfirmed}
          onCancel={() => setArchiveConfirmOpen(false)}
        />
      )}
    </>
  );
}
