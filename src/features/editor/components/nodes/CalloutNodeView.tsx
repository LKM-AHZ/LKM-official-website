import { memo, useState, useEffect, useRef } from "react";
import type { Node } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { t, type TranslationKey } from "~/lib/i18n";
import CalloutView from "../shared/CalloutView";

interface CalloutNodeViewProps {
  node: Node;
  editor: Editor;
  getPos: () => number | undefined;
  updateAttributes: (attrs: Record<string, unknown>) => void;
}

const CALLOUT_TYPES = ["info", "warning", "error", "success"] as const;
type CalloutType = (typeof CALLOUT_TYPES)[number];

/** option 标签 key（值走 i18n 展示）；按 CalloutType 收窄，键写错在编译期就被拦下 */
const TYPE_LABEL_KEYS: Record<CalloutType, TranslationKey> = {
  info: "editor.callout.info",
  warning: "editor.callout.warning",
  error: "editor.callout.error",
  success: "editor.callout.success",
};

function typeLabel(type: CalloutType): string {
  return t(TYPE_LABEL_KEYS[type]);
}

const CalloutNodeView = memo(function CalloutNodeView({
  node,
  editor,
  getPos,
  updateAttributes,
}: CalloutNodeViewProps) {
  const [editing, setEditing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // 导入的 MDX/HTML/JSON 里 attrs.type 可以是任意值，直接使用会拼出 lkm-callout-<垃圾>
  // 这类 class、并让 select 显示空值，故先按允许集合归一，越界回退 info
  const rawType = node.attrs.type as string;
  const ctype: CalloutType = (CALLOUT_TYPES as readonly string[]).includes(
    rawType,
  )
    ? (rawType as CalloutType)
    : "info";
  const title = (node.attrs.title as string) || "";

  // 标题用本地草稿，失焦/确认/收起面板时一次性写回节点属性：
  // 原来每敲一个字就 dispatch 事务，会逐字符进入 undo 历史（Ctrl+Z 要按很多次）、
  // 打断中文输入法合成，并让整个 node view 逐键重渲染。
  const [draftTitle, setDraftTitle] = useState(title);
  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  // 用 ref 持有最新提交函数，供事件监听器/收起路径调用而不必把它们加进依赖
  const commitRef = useRef<() => void>(() => {});
  commitRef.current = (): void => {
    if (draftTitle !== title) updateAttributes({ title: draftTitle });
  };

  const toggleEditing = (): void => {
    if (editing) commitRef.current();
    setEditing(!editing);
  };

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent): void => {
      const target = e.target as HTMLElement | null;
      // 点在触发器上时交给 onClick 自己反转：这里若先 setEditing(false)，
      // 紧接着的 click 会把面板重新打开，表现为「点触发器关不掉」
      if (wrapperRef.current?.contains(target)) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        commitRef.current();
        setEditing(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        commitRef.current();
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [editing]);

  return (
    <NodeViewWrapper
      className="relative my-2"
      contentEditable={false}
      data-callout
    >
      <div
        ref={wrapperRef}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        aria-expanded={editing}
        onClick={toggleEditing}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleEditing();
          }
        }}
      >
        <CalloutView type={ctype} title={title || undefined} />
      </div>

      {editing && (
        <div
          ref={panelRef}
          className="absolute top-full left-0 mt-1 z-30 bg-page-bg border border-surface-3 rounded-lg shadow-lg p-3 w-64 max-w-[calc(100vw-2rem)]"
        >
          <label className="text-xs font-medium block mb-1">
            {t("editor.callout.type")}
          </label>
          <select
            className="rte-select rte-select--sm w-full mb-2"
            value={ctype}
            onChange={(e) => updateAttributes({ type: e.target.value })}
          >
            {CALLOUT_TYPES.map((k) => (
              <option key={k} value={k}>
                {typeLabel(k)}
              </option>
            ))}
          </select>
          <label className="text-xs font-medium block mb-1">
            {t("editor.callout.titleOptional")}
          </label>
          <input
            type="text"
            className="rte-input rte-input--sm w-full mb-2"
            value={draftTitle}
            placeholder={t("editor.callout.titlePlaceholder")}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={() => commitRef.current()}
          />
          <div className="flex gap-1 justify-end">
            <button
              type="button"
              className="rte-btn rte-btn--ghost rte-btn--xs text-error"
              onMouseDown={(e) => {
                e.preventDefault();
                const pos = getPos();
                if (pos !== undefined) {
                  editor
                    .chain()
                    .focus()
                    .deleteRange({ from: pos, to: pos + node.nodeSize })
                    .run();
                }
              }}
            >
              {t("editor.delete")}
            </button>
            <button
              type="button"
              className="rte-btn rte-btn--primary rte-btn--xs"
              onMouseDown={(e) => {
                e.preventDefault();
                commitRef.current();
                setEditing(false);
              }}
            >
              {t("editor.confirm")}
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
});

export default CalloutNodeView;
