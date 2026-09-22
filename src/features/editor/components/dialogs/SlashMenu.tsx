import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import type { Editor } from "@tiptap/core";
import TableInsertMenu from "./TableInsertMenu";
import MathEditor from "../nodes/MathEditor";
import ImageUrlPopover from "./ImageUrlPopover";
import { t } from "~/lib/i18n";

interface MathDraft {
  isBlock: boolean;
  initialLatex: string;
}

interface SlashItem {
  label: string;
  description: string;
  icon: string;
  /** 立即执行的条目才有；带 submenu / aiAction 的条目走各自分支 */
  action?: (editor: Editor) => void;
  /** 特殊交互：选中后进入二级面板（例如表格尺寸选择）而非立即执行 */
  submenu?: "table" | "inlineMath" | "blockMath" | "image";
  /** AI 动作：菜单自身没有 AI 状态，交给宿主（DocumentEditor）执行 */
  aiAction?: "continue" | "summarize";
}

/** 菜单最多渲染的条目数（超出部分靠输入 query 过滤，不滚动） */
const MAX_VISIBLE_ITEMS = 8;

/** 公式二级面板的默认初始 LaTeX：与插入结果共用同一字面量，避免两处分叉 */
const DEFAULT_INLINE_MATH_LATEX = "x^2";
const DEFAULT_BLOCK_MATH_LATEX = "\\sum_{i=1}^{n} x_i";

const ITEMS: SlashItem[] = [
  {
    label: "H1",
    description: t("editor.slash.heading1Desc"),
    icon: "H1",
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: "H2",
    description: t("editor.slash.heading2Desc"),
    icon: "H2",
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "H3",
    description: t("editor.slash.heading3Desc"),
    icon: "H3",
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: t("editor.slash.bulletList"),
    description: t("editor.slash.bulletListDesc"),
    icon: "•",
    action: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: t("editor.slash.orderedList"),
    description: t("editor.slash.orderedListDesc"),
    icon: "1.",
    action: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: t("editor.slash.taskList"),
    description: t("editor.slash.taskListDesc"),
    icon: "☐",
    action: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    label: t("editor.slash.blockquote"),
    description: t("editor.slash.blockquoteDesc"),
    icon: '"',
    action: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    label: t("editor.slash.codeBlock"),
    description: t("editor.slash.codeBlockDesc"),
    icon: "</>",
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: t("editor.slash.horizontalRule"),
    description: t("editor.slash.horizontalRuleDesc"),
    icon: "—",
    action: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    label: t("editor.slash.image"),
    description: t("editor.slash.imageDesc"),
    icon: "🖼",
    submenu: "image",
  },
  {
    label: t("editor.slash.table"),
    description: t("editor.slash.tableDesc"),
    icon: "⊞",
    submenu: "table",
  },
  {
    label: t("editor.slash.inlineMath"),
    description: t("editor.slash.inlineMathDesc"),
    icon: "𝑓",
    submenu: "inlineMath",
  },
  {
    label: t("editor.slash.blockMath"),
    description: t("editor.slash.blockMathDesc"),
    icon: "∑",
    submenu: "blockMath",
  },
  {
    label: "Callout",
    description: t("editor.slash.calloutDesc"),
    icon: "▸",
    action: (e) => {
      e.chain()
        .focus()
        .insertContent({ type: "callout", attrs: { type: "info" } })
        .run();
    },
  },
  {
    label: "Figure",
    description: t("editor.slash.figureDesc"),
    icon: "🖼",
    action: (e) => {
      e.chain().focus().insertContent({ type: "figure", attrs: {} }).run();
    },
  },
  {
    label: t("editor.slash.aiContinue"),
    description: t("editor.slash.aiContinueDesc"),
    icon: "🤖",
    aiAction: "continue",
  },
  {
    label: t("editor.slash.aiSummarize"),
    description: t("editor.slash.aiSummarizeDesc"),
    icon: "📝",
    aiAction: "summarize",
  },
];

interface SlashMenuProps {
  editor: Editor;
  query: string;
  position: { top: number; left: number } | null;
  onClose: () => void;
  onSelect: () => void;
  /** AI 条目由宿主执行（菜单自身无 AI 状态），缺省时条目选中后仅关闭菜单 */
  onAiRequest?: (intent: "continue" | "summarize") => void;
}

const SlashMenu = memo(function SlashMenu({
  editor,
  query,
  position,
  onClose,
  onSelect,
  onAiRequest,
}: SlashMenuProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [tableMode, setTableMode] = useState(false);
  const [mathMode, setMathMode] = useState<MathDraft | null>(null);
  const [imageMode, setImageMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const q = query.toLowerCase();
  const filtered = useMemo(
    () =>
      ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q),
      ),
    [q],
  );

  const filteredRef = useRef(filtered);
  filteredRef.current = filtered;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const currentFiltered = filteredRef.current;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        // 上界取「实际渲染出来的行数」：列表只渲染前 MAX_VISIBLE_ITEMS 条，
        // 按 currentFiltered.length 会让选中项跑到看不见的位置上
        setSelectedIdx((i) =>
          Math.min(
            i + 1,
            Math.min(currentFiltered.length, MAX_VISIBLE_ITEMS) - 1,
          ),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (currentFiltered[selectedIdx]) {
          const sub = currentFiltered[selectedIdx].submenu;
          if (sub === "table") {
            setTableMode(true);
          } else if (sub === "inlineMath") {
            setMathMode({ isBlock: false, initialLatex: DEFAULT_INLINE_MATH_LATEX });
          } else if (sub === "blockMath") {
            setMathMode({ isBlock: true, initialLatex: DEFAULT_BLOCK_MATH_LATEX });
          } else if (sub === "image") {
            setImageMode(true);
          } else {
            const item = currentFiltered[selectedIdx];
            if (item.aiAction) {
              onAiRequest?.(item.aiAction);
            } else {
              item.action?.(editor);
            }
            onSelect();
          }
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [editor, selectedIdx, onSelect, onClose],
  );

  useEffect(() => {
    if (!position) return;
    // 二级面板（表格/公式/图片）打开时不要挂全局键盘监听：面板输入框里的
    // Enter/方向键会被这里一并处理，可能在模态层下面执行菜单动作或提前 onClose
    if (tableMode || mathMode || imageMode) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, position, tableMode, mathMode, imageMode]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  if (!position || filtered.length === 0) return null;

  // 公式二级面板：MathEditor 模态框（插入行内/块级公式）
  if (mathMode) {
    return (
      <MathEditor
        initialLatex={mathMode.initialLatex}
        isBlock={mathMode.isBlock}
        onConfirm={(latex) => {
          if (mathMode.isBlock) {
            editor
              .chain()
              .focus()
              .insertContent({ type: "blockMath", attrs: { latex } })
              .run();
          } else {
            editor
              .chain()
              .focus()
              .insertContent({
                type: "text",
                text: latex,
                marks: [{ type: "inlineMath", attrs: { latex } }],
              })
              .run();
          }
          setMathMode(null);
          onSelect();
          onClose();
        }}
        onCancel={() => setMathMode(null)}
      />
    );
  }

  // 图片二级面板：URL + alt 弹窗
  if (imageMode) {
    return (
      <ImageUrlPopover
        onInsert={(src, alt) => {
          editor.chain().focus().setImage({ src, alt }).run();
          onSelect();
          onClose();
        }}
        onClose={() => setImageMode(false)}
      />
    );
  }

  // 表格二级面板：选择行列数
  if (tableMode) {
    return (
      <div
        ref={menuRef}
        className="rte-slash-menu"
        style={{ top: position.top, left: position.left }}
      >
        <TableInsertMenu
          onInsert={(rows, cols) => {
            editor
              .chain()
              .focus()
              .insertTable({ rows, cols, withHeaderRow: true })
              .run();
            onSelect();
            onClose();
          }}
          onClose={() => {
            setTableMode(false);
            onClose();
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="rte-slash-menu"
      style={{ top: position.top, left: position.left }}
    >
      <div role="listbox" className="p-1">
        {filtered.slice(0, MAX_VISIBLE_ITEMS).map((item, idx) => (
          <button
            key={item.label}
            type="button"
            role="option"
            aria-selected={idx === selectedIdx}
            className={`rte-slash-item ${idx === selectedIdx ? "is-selected" : ""}`}
            onMouseEnter={() => setSelectedIdx(idx)}
            onClick={() => {
              const sub = item.submenu;
              if (sub === "table") {
                setTableMode(true);
              } else if (sub === "inlineMath") {
                setMathMode({
                  isBlock: false,
                  initialLatex: DEFAULT_INLINE_MATH_LATEX,
                });
              } else if (sub === "blockMath") {
                setMathMode({
                  isBlock: true,
                  initialLatex: DEFAULT_BLOCK_MATH_LATEX,
                });
              } else if (sub === "image") {
                setImageMode(true);
              } else if (item.aiAction) {
                onAiRequest?.(item.aiAction);
                onSelect();
              } else {
                item.action?.(editor);
                onSelect();
              }
            }}
          >
            <span className="w-6 text-center font-mono text-deep-text/60">
              {item.icon}
            </span>
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-xs text-deep-text/50">
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

export default SlashMenu;

export { ITEMS as SLASH_ITEMS };
