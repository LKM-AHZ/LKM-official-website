import { useState, useRef, useEffect } from "react";
import type { ReactElement } from "react";
import type { Editor } from "@tiptap/core";
import { handleExportPdf } from "./ExportPdfButton";
import { handleExportDocx } from "./ExportDocxButton";
import { t } from "~/lib/i18n";
import { handleExportMdx, handleExportMd } from "./ExportMdxButton";
import { handleExportHtml } from "./ExportHtmlButton";

interface ExportMenuProps {
  editor: Editor;
}

export default function ExportMenu({ editor }: ExportMenuProps): ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={`rte-btn rte-btn--ghost rte-btn--xs gap-1 ${open ? "is-active" : ""}`}
        onClick={() => setOpen(!open)}
        title={t("editor.export")}
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
        <span className="hidden lg:inline text-xs">{t("editor.export")}</span>
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
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-page-bg border border-surface-3 rounded-lg shadow-lg p-1 min-w-[140px] rte-dropdown">
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-surface-3/50 transition-colors"
            onClick={() => {
              handleExportPdf(editor);
              setOpen(false);
            }}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" x2="8" y1="13" y2="13" />
              <line x1="16" x2="8" y1="17" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            {t("editor.exportPdf")}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-surface-3/50 transition-colors"
            onClick={() => {
              handleExportDocx(editor);
              setOpen(false);
            }}
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
              <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="M3 15h6" />
              <path d="M6 12v6" />
            </svg>
            {t("editor.exportWord")}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-surface-3/50 transition-colors"
            onClick={() => {
              handleExportMd(editor);
              setOpen(false);
            }}
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
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>
            {t("editor.exportMd")}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-surface-3/50 transition-colors"
            onClick={() => {
              handleExportMdx(editor);
              setOpen(false);
            }}
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
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="M10 9H8" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
            </svg>
            {t("editor.exportMdx")}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-surface-3/50 transition-colors"
            onClick={() => {
              handleExportHtml(editor);
              setOpen(false);
            }}
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
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            {t("editor.exportHtml")}
          </button>
        </div>
      )}
    </div>
  );
}
