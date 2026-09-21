import { useState, useRef, useEffect, useCallback } from "react";
import type { ReactElement } from "react";
import type { PersistenceAdapter, BackupEntry } from "../../engine/types";
import { t } from "~/lib/i18n";

interface BackupMenuProps {
  adapter: PersistenceAdapter;
}

export default function BackupMenu({ adapter }: BackupMenuProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [showBackups, setShowBackups] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowBackups(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleExport = useCallback(async () => {
    const docs = await Promise.resolve(adapter.listDocuments());
    if (docs.length === 0) {
      alert(t("editor.backup.noDocsToExport"));
      return;
    }
    const fullDocs = [];
    for (const meta of docs) {
      const doc = await Promise.resolve(adapter.loadDocument(meta.id));
      fullDocs.push(
        doc || {
          id: meta.id,
          title: meta.title,
          contentMdx: "",
          editorJson: null,
          status: meta.status,
          version: meta.version,
          lastModified: meta.lastModified,
          createdAt: "",
          updatedAt: "",
        },
      );
    }
    // 导出必须写出 docId：导入侧读的就是 doc.docId，剥掉 id 又不起别名会让
    // 再导入时 id 变成 undefined，静默生成一批不可见的重复文档
    const json = JSON.stringify(
      fullDocs.map(({ id, ...rest }) => ({ docId: id, ...rest })),
      null,
      2,
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lkm-docs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }, [adapter]);

  const handleImport = useCallback(() => {
    setOpen(false);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        let data: Array<{
          docId: string;
          /** 兼容只带 id 的旧版导出 */
          id?: string;
          title: string;
          contentMdx: string;
          editorJson: unknown;
          status: string;
          version: number;
          timestamp: string;
        }>;
        try {
          const parsed = JSON.parse(reader.result as string);
          if (!Array.isArray(parsed)) {
            alert(t("editor.backup.invalidJsonFormat"));
            return;
          }
          data = parsed;
        } catch (err) {
          alert(
            t("editor.backup.jsonParseFailed", {
              message:
                err instanceof Error
                  ? err.message
                  : t("editor.backup.formatError"),
            }),
          );
          return;
        }
        if (data.length === 0) {
          alert(t("editor.backup.invalidJsonNoDocs"));
          return;
        }
        const existing = await Promise.resolve(adapter.listDocuments());
        if (existing.length > 0) {
          if (
            !confirm(
              t("editor.backup.importOverwrite", {
                importCount: data.length,
                existingCount: existing.length,
              }),
            )
          ) {
            return;
          }
        }
        let imported = 0;
        for (const doc of data) {
          const docId = doc.docId || doc.id;
          if (!docId) continue;
          await adapter.saveDocument({
            id: docId,
            title: doc.title,
            contentMdx: doc.contentMdx,
            editorJson: doc.editorJson as Record<string, unknown>,
            status:
              (doc.status as "draft" | "published" | "archived") || "draft",
            version: doc.version || 1,
            lastModified: doc.timestamp || new Date().toISOString(),
            createdAt: doc.timestamp || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          await Promise.resolve(
            adapter.createBackup(docId, {
              docId,
              title: doc.title,
              contentMdx: doc.contentMdx,
              editorJson: doc.editorJson,
              status: doc.status,
              version: doc.version,
            }),
          );
          imported += 1;
        }
        alert(t("editor.backup.importSuccess", { count: imported }));
        window.location.reload();
      };
      reader.readAsText(file);
    },
    [adapter],
  );

  const handleShowBackups = useCallback(async () => {
    const result = await Promise.resolve(adapter.getBackups());
    setBackups(result);
    setShowBackups(true);
  }, [adapter]);

  const handleRestore = useCallback(async (docId: string, title: string) => {
    if (!confirm(t("editor.backup.restoreConfirm", { title }))) return;
    // Navigate to editor with this doc ID to load the backup content
    setShowBackups(false);
    setOpen(false);
    const base =
      (window as unknown as Record<string, string>).__BASE_URL__ || "";
    // 同 DocumentEditor：base 为 '/' 时拼出 '//editor' 协议相对 URL，去尾部斜杠。
    window.location.href = `${base.replace(/\/+$/, "")}/editor?id=${docId}`;
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={`rte-btn rte-btn--ghost rte-btn--xs gap-1 ${open ? "is-active" : ""}`}
        onClick={() => {
          setOpen(!open);
          setShowBackups(false);
        }}
        title={t("editor.backup.title")}
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
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        <span className="hidden lg:inline text-xs">
          {t("editor.backup.backup")}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !showBackups && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-page-bg border border-surface-3 rounded-lg shadow-lg p-1 min-w-[160px] rte-dropdown">
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-surface-3/50 transition-colors"
            onClick={handleExport}
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            {t("editor.backup.exportAll")}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-surface-3/50 transition-colors"
            onClick={handleImport}
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            {t("editor.backup.importDocs")}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-surface-3/50 transition-colors"
            onClick={handleShowBackups}
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
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
            {t("editor.backup.restoreFromBackup")}
          </button>
        </div>
      )}

      {open && showBackups && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-page-bg border border-surface-3 rounded-lg shadow-lg p-2 min-w-[260px] max-h-[300px] overflow-y-auto rte-dropdown">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-deep-text/70">
              {t("editor.backup.availableBackups", { count: backups.length })}
            </span>
            <button
              type="button"
              className="rte-btn rte-btn--ghost rte-btn--xs"
              onClick={() => setShowBackups(false)}
            >
              {t("editor.backup.back")}
            </button>
          </div>
          {backups.length === 0 ? (
            <p className="text-xs text-deep-text/50 px-1 py-4 text-center">
              {t("editor.backup.noBackups")}
            </p>
          ) : (
            backups.map((b) => (
              <button
                key={b.id}
                type="button"
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs rounded hover:bg-surface-3/50 transition-colors"
                onClick={() => handleRestore(b.docId, b.title)}
              >
                <span className="truncate">{b.title}</span>
                <span className="text-deep-text/50 shrink-0 ml-2">
                  {new Date(b.timestamp).toLocaleString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
