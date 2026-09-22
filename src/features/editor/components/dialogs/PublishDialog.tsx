import { useState } from "react";
import type { ReactElement } from "react";
import { t } from "~/lib/i18n";

/** 文档永久链接前缀。同步点：markdown-shortcuts.ts:90 的 `/docs/${slug}` 与
 *  engine/types.ts 的 slug 注释——三者要改一起改（彻底单源化需动那两个文件） */
const DOCS_URL_PREFIX = "/docs/";

/** slug 字符集：字母/数字/中文/连字符，统一 80 字符上限（与手工输入的规则同源） */
function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** 手工输入：只剔除非法字符，不折叠/不重排用户已经打好的连字符 */
function sanitizeSlugInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "")
    .slice(0, 80);
}

interface PublishDialogProps {
  currentTitle: string;
  onConfirm: (title: string, slug: string) => void;
  onCancel: () => void;
}

export default function PublishDialog({
  currentTitle,
  onConfirm,
  onCancel,
}: PublishDialogProps): ReactElement {
  const [title, setTitle] = useState(currentTitle || "");
  const [slug, setSlug] = useState(sanitizeSlug(currentTitle || "untitled"));
  // 用户是否手动编辑过 slug：原先靠 `!slug || slug === "untitled"` 判断，既会把用户
  // 手填的 "untitled" 当成占位符覆盖，清空输入框后也会被标题静默改写
  const [slugTouched, setSlugTouched] = useState(false);

  const handleTitleChange = (value: string): void => {
    setTitle(value);
    if (!slugTouched) setSlug(sanitizeSlug(value));
  };

  return (
    <div className="rte-dialog-backdrop" onClick={onCancel}>
      <div className="rte-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">
          {t("editor.publishDialogTitle")}
        </h3>

        <label className="text-sm font-medium block mb-1">
          {t("editor.title")}
        </label>
        <input
          type="text"
          className="rte-input w-full mb-3"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={t("editor.documentTitlePlaceholder")}
          autoFocus
        />

        <label className="text-sm font-medium block mb-1">
          {t("editor.permalink")}
        </label>
        <div className="flex items-center gap-0 mb-3">
          <span className="text-sm text-deep-text/50 bg-page-bg px-2 py-1 rounded-l border border-surface-3 border-r-0">
            {DOCS_URL_PREFIX}
          </span>
          <input
            type="text"
            className="rte-input w-full rounded-l-none"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(sanitizeSlugInput(e.target.value));
            }}
            placeholder="my-document"
          />
        </div>

        <p className="text-xs text-deep-text/50 mb-4">
          {t("editor.publishNotice")}
        </p>

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
            className="rte-btn rte-btn--primary rte-btn--sm"
            disabled={!title.trim() || !slug.trim()}
            onClick={() => onConfirm(title.trim(), slug.trim())}
          >
            {t("editor.confirmPublish")}
          </button>
        </div>
      </div>
    </div>
  );
}
