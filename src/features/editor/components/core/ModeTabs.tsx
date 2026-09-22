import { memo } from "react";
import type { ReactElement, ReactNode } from "react";
import type { EditorMode } from "../../engine/types";
import { t, type TranslationKey } from "~/lib/i18n";

interface ModeTabsProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

// 只存 key，渲染时再 t()：模块级调用会把文案冻结在首次 import 时的语言上，
// 运行期切换语言后标签不会跟着变（甚至可能残留原始 key）。
const TABS: { mode: EditorMode; labelKey: TranslationKey }[] = [
  { mode: "richtext", labelKey: "editor.modeRichtext" },
  { mode: "source", labelKey: "editor.modeSource" },
  { mode: "preview", labelKey: "editor.modePreview" },
];

/** 三个模式图标共用的 SVG 外框：9 个相同属性抽一处，改一个图标时不会只改到一半 */
function ModeIconFrame({ children }: { children: ReactNode }): ReactElement {
  return (
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
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// 用 Record<EditorMode, …> 而不是 if/else 兜底：EditorMode 新增成员时这里会直接编译报错，
// 不会像原来那样静默套用 richtext 图标
const MODE_ICONS: Record<EditorMode, ReactElement> = {
  richtext: (
    <ModeIconFrame>
      <line x1="21" x2="3" y1="6" y2="6" />
      <line x1="15" x2="3" y1="12" y2="12" />
      <line x1="17" x2="3" y1="18" y2="18" />
    </ModeIconFrame>
  ),
  source: (
    <ModeIconFrame>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </ModeIconFrame>
  ),
  preview: (
    <ModeIconFrame>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </ModeIconFrame>
  ),
};

function ModeIcon({ mode }: { mode: EditorMode }): ReactElement {
  return MODE_ICONS[mode];
}

const ModeTabs = memo(function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  return (
    <div className="flex items-center gap-0 border-l border-surface-3 pl-3 ml-2">
      <div className="rte-mode-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            className={`rte-mode-tab ${mode === tab.mode ? "is-active" : ""}`}
            onClick={() => onModeChange(tab.mode)}
            title={t(tab.labelKey)}
            // 纯图标按钮：title 不足以保证可访问名，补 aria-label；并用 aria-pressed 表达选中态
            aria-label={t(tab.labelKey)}
            aria-pressed={mode === tab.mode}
          >
            <ModeIcon mode={tab.mode} />
          </button>
        ))}
      </div>
    </div>
  );
});

export default ModeTabs;
