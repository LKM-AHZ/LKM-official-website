import { useState, useEffect, memo } from "react";
import type { PersistenceAdapter, VersionEntry } from "../../engine/types";
import ConfirmDialog from "../dialogs/ConfirmDialog";
import { t } from "~/lib/i18n";

interface VersionHistoryPanelProps {
  documentId: string;
  adapter: PersistenceAdapter;
  onRestore: (version: VersionEntry) => void;
  onClose: () => void;
}

const VersionHistoryPanel = memo(function VersionHistoryPanel({
  documentId,
  adapter,
  onRestore,
  onClose,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<VersionEntry | null>(
    null,
  );
  const [confirmRestore, setConfirmRestore] = useState(false);

  // 切换文档或版本列表刷新后，选中的 VersionEntry 可能已过期/属于别的文档，
  // 而预览与 onRestore 都会用到它，故清掉选择
  useEffect(() => {
    setSelectedVersion(null);
    setConfirmRestore(false);
  }, [documentId, versions]);

  useEffect(() => {
    // 卸载防抖：卸载后不再 setState（避免 setState-on-unmounted 与迟到响应）。
    let cancelled = false;
    const apply = (list: VersionEntry[]): void => {
      if (!cancelled) setVersions(list);
    };
    const result = adapter.getVersions(documentId);
    // Handle both Promise and sync return
    if (result instanceof Promise) {
      result.then(apply).catch(() => apply([]));
    } else {
      apply(result);
    }
    return () => {
      cancelled = true;
    };
  }, [documentId, adapter]);

  const handleSelect = (version: number): void => {
    const v = versions.find((ver) => ver.version === version);
    setSelectedVersion(v ?? null);
  };

  const handleRestore = (): void => {
    if (!selectedVersion) return;
    setConfirmRestore(true);
  };

  const handleRestoreConfirmed = (): void => {
    setConfirmRestore(false);
    if (selectedVersion) {
      onRestore(selectedVersion);
    }
  };

  return (
    <div className="rte-panel flex flex-col">
      <div className="flex items-center justify-between px-3 py-3 border-b border-surface-3">
        <h3 className="text-sm font-semibold">{t("editor.versionHistory")}</h3>
        <button
          type="button"
          className="rte-btn rte-btn--ghost rte-btn--xs"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {versions.length === 0 ? (
          <p className="text-xs text-deep-text/50 px-3 py-4">
            {t("editor.noVersions")}
          </p>
        ) : (
          versions.map((v) => (
            <button
              key={v.version}
              type="button"
              className={`w-full text-left px-3 py-2 border-b border-surface-3/50 text-xs transition-colors ${
                selectedVersion?.version === v.version
                  ? "bg-primary/10 border-l-2 border-l-[var(--primary)]"
                  : "hover:bg-page-bg border-l-2 border-l-transparent"
              }`}
              onClick={() => handleSelect(v.version)}
            >
              <div className="font-medium">v{v.version}</div>
              <div className="text-deep-text/50">{v.message}</div>
              <div className="text-deep-text/40">
                {new Date(v.createdAt).toLocaleString("zh-CN")}
              </div>
            </button>
          ))
        )}
      </div>

      {selectedVersion && (
        <div className="border-t border-surface-3 p-3">
          <pre className="text-xs bg-surface-3/50 rounded p-2 mb-2 overflow-x-auto max-h-32 whitespace-pre-wrap font-mono">
            {selectedVersion.contentMdx.slice(0, 300)}
            {selectedVersion.contentMdx.length > 300 ? "…" : ""}
          </pre>
          <button
            type="button"
            className="rte-btn rte-btn--primary rte-btn--xs w-full"
            onClick={handleRestore}
          >
            {t("editor.restoreThisVersion")}
          </button>
        </div>
      )}

      {confirmRestore && selectedVersion && (
        <ConfirmDialog
          message={t("editor.confirmRestoreVersion", {
            version: selectedVersion.version,
          })}
          danger
          onConfirm={handleRestoreConfirmed}
          onCancel={() => setConfirmRestore(false)}
        />
      )}
    </div>
  );
});

export default VersionHistoryPanel;
