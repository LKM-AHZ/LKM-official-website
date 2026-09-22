import { memo } from "react";
import type { SaveStatus } from "../../engine/types";
import { t } from "~/lib/i18n";

const STATUS_CONFIG: Record<
  SaveStatus,
  { label: string; className: string; dot: string }
> = {
  saved: {
    label: t("editor.saveStatus.saved"),
    className: "rte-save-status--saved",
    dot: "",
  },
  unsaved: {
    label: t("editor.saveStatus.unsaved"),
    className: "rte-save-status--unsaved",
    dot: "animate-pulse",
  },
  saving: {
    label: t("editor.saveStatus.saving"),
    className: "rte-save-status--saving",
    dot: "",
  },
  error: {
    label: t("editor.saveStatus.error"),
    className: "rte-save-status--error",
    dot: "",
  },
  conflict: {
    label: t("editor.saveStatus.conflict"),
    className: "rte-save-status--error",
    dot: "",
  },
};

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  charCount?: number;
  wordCount?: number;
}

const SaveStatusIndicator = memo(function SaveStatusIndicator({
  status,
  charCount,
  wordCount,
}: SaveStatusIndicatorProps) {
  // status 若是契约外的值（后端/引擎数据），STATUS_CONFIG[status] 会是 undefined，
  // 读 config.className 会当场抛错把整个工具栏带崩，这里回退到 unsaved
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.unsaved;

  return (
    <div className="flex items-center gap-2 text-xs px-1">
      {wordCount !== undefined && (
        <span>{t("editor.saveStatus.words", { count: wordCount })}</span>
      )}
      {charCount !== undefined && (
        <span>{t("editor.saveStatus.chars", { count: charCount })}</span>
      )}
      <span className={`rte-save-status ${config.className} gap-1`}>
        {config.dot && (
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full bg-current ${config.dot}`}
          />
        )}
        {config.label}
      </span>
    </div>
  );
});
export default SaveStatusIndicator;
