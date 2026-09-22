import { useEffect, useState, useCallback, useRef, memo } from "react";
import type { Editor } from "@tiptap/core";
import LinkEditPopover from "../dialogs/LinkEditPopover";
import CommentBubbleButton from "../nodes/CommentBubbleButton";
import { t } from "~/lib/i18n";

interface BubbleMenuWrapperProps {
  editor: Editor;
  onComment?: (from: number, to: number, text: string) => void;
}

const BubbleMenuWrapper = memo(function BubbleMenuWrapper({
  editor,
  onComment,
}: BubbleMenuWrapperProps) {
  const [show, setShow] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastSelectionRef = useRef<{
    from: number;
    to: number;
    empty: boolean;
  } | null>(null);

  const update = useCallback(
    (force = false) => {
      // 出现新选区时撤销待执行的 blur 隐藏：否则 200ms 后会把刚显示出来的气泡又藏掉
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
      // requestAnimationFrame 防抖：连续 selectionUpdate 合并为一次更新
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const { from, to, empty } = editor.state.selection;
        // 去重：选区坐标未变化时跳过 layout 计算。滚动驱动的调用必须带 force：
        // 滚动时选区没变，靠去重会把 setPos 一并跳过，气泡不会跟随正文移动。
        const prev = lastSelectionRef.current;
        if (
          !force &&
          prev &&
          prev.from === from &&
          prev.to === to &&
          prev.empty === empty
        ) {
          return;
        }
        lastSelectionRef.current = { from, to, empty };

        if (empty || from === to) {
          setShow(false);
          return;
        }
        // rAF 里拿到的位置可能已经过期（期间 undo/redo、协同编辑、异步内容加载都会改动文档）：
        // 越界坐标会让 coordsAtPos 抛错并打断 selection 监听，先校验再量
        const docSize = editor.state.doc.content.size;
        if (from < 0 || to > docSize || from > to) {
          setShow(false);
          return;
        }
        let start: { top: number; left: number; right: number };
        let end: { top: number; left: number; right: number };
        try {
          start = editor.view.coordsAtPos(from);
          end = editor.view.coordsAtPos(to);
        } catch {
          setShow(false);
          return;
        }
        setPos({
          top: Math.max(8, start.top - 44),
          left: Math.min(
            window.innerWidth - 80,
            Math.max(80, (start.left + end.right) / 2),
          ),
        });
        setShow(true);
      });
    },
    [editor],
  );

  // 事件回调不能直接把 tiptap 注入的事件对象当 force 参数（恒为真会关掉去重）
  const handleSelectionUpdate = useCallback(() => update(false), [update]);

  useEffect(() => {
    editor.on("selectionUpdate", handleSelectionUpdate);
    // Listen to scroll within the editor's parent for position updates
    const scrollHandler = (): void => update(true);
    const editorDom = editor.view.dom;
    // 用编辑器自己的滚动容器类名（editor.css 里 .rte-editor-main 才是 overflow-y:auto 的那个），
    // 不再靠 `[class*="overflow"]` 子串匹配——它会把 overflow-hidden 之类的祖先也算进来
    const scrollParent = editorDom.closest(".rte-editor-main") || window;
    scrollParent.addEventListener("scroll", scrollHandler, { passive: true });

    const handleBlur = (): void => {
      lastSelectionRef.current = null;
      // 连续 blur 时先清掉上一个定时器，避免互相覆盖后泄漏
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      blurTimerRef.current = setTimeout(() => setShow(false), 200);
    };
    editor.on("blur", handleBlur);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("blur", handleBlur);
      scrollParent.removeEventListener("scroll", scrollHandler);
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [editor, handleSelectionUpdate]);

  // 链接浮层打开时需保留组件挂载（浮层依赖浏览器事件、点击外部关闭），此时不显示气泡按钮本体
  if (!show && !linkOpen) return null;

  return (
    <div
      className="rte-bubble-menu"
      style={{ top: pos.top, left: pos.left, transform: "translateX(-50%)" }}
    >
      <button
        type="button"
        aria-label={t("editor.bold")}
        title={t("editor.bold")}
        className={`rte-toolbar-btn ${editor.isActive("bold") ? "is-active" : ""}`}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
        }}
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        aria-label={t("editor.italic")}
        title={t("editor.italic")}
        className={`rte-toolbar-btn ${editor.isActive("italic") ? "is-active" : ""}`}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleItalic().run();
        }}
      >
        <em>I</em>
      </button>
      <button
        type="button"
        aria-label={t("editor.underline")}
        title={t("editor.underline")}
        className={`rte-toolbar-btn ${editor.isActive("underline") ? "is-active" : ""}`}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleUnderline().run();
        }}
      >
        <span className="underline">U</span>
      </button>
      <button
        type="button"
        aria-label={t("editor.strike")}
        title={t("editor.strike")}
        className={`rte-toolbar-btn ${editor.isActive("strike") ? "is-active" : ""}`}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleStrike().run();
        }}
      >
        <span className="line-through">S</span>
      </button>
      <button
        type="button"
        aria-label={t("editor.inlineCode")}
        title={t("editor.inlineCode")}
        className={`rte-toolbar-btn ${editor.isActive("code") ? "is-active" : ""}`}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleCode().run();
        }}
      >
        {"</>"}
      </button>
      <div className="relative">
        <button
          type="button"
          aria-label={t("editor.link")}
          title={t("editor.link")}
          className={`rte-toolbar-btn ${editor.isActive("link") ? "is-active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            setLinkOpen(true);
          }}
        >
          🔗
        </button>
        {linkOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-1">
            <LinkEditPopover
              editor={editor}
              onClose={() => setLinkOpen(false)}
            />
          </div>
        )}
      </div>
      {/* 复用 CommentBubbleButton（它把动作挂在 click 上，键盘 Enter/Space 也能加批注；
          原来内联的这份只写 onMouseDown，键盘用户点不到），避免两份实现各自漂移 */}
      {onComment && (
        <CommentBubbleButton editor={editor} onClick={onComment} />
      )}
    </div>
  );
});

export default BubbleMenuWrapper;
