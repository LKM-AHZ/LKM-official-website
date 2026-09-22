import { useState, useMemo, useRef, useEffect, useCallback, memo } from "react";
import type { ReactNode } from "react";
import { Icon } from "@iconify/react";
import type { Editor } from "@tiptap/core";
import EditorToolbarButton from "./EditorToolbarButton";
import MathEditor from "../nodes/MathEditor";
import ImageUrlPopover from "../dialogs/ImageUrlPopover";
import LinkEditPopover from "../dialogs/LinkEditPopover";
import { t } from "~/lib/i18n";

interface MathDraft {
  isBlock: boolean;
  initialLatex: string;
}

interface ToolbarItemDef {
  key: string;
  icon: ReactNode;
  label: string;
  title: string;
  group:
    | "format"
    | "heading"
    | "block"
    | "list"
    | "insert"
    | "component"
    | "history";
  action: (editor: Editor) => void;
  isActive: (editor: Editor) => boolean;
}

const ICON_WIDTH = 16;
const ICON_HEIGHT = 16;

/** lucide 线性图标统一入口（经 @iconify/react 渲染），替换手写 SVG 样板。 */
const icon16 = (name: string): ReactNode => (
  <Icon icon={name} width={ICON_WIDTH} height={ICON_HEIGHT} />
);

const B = icon16("lucide:bold");
const I = icon16("lucide:italic");
const U = icon16("lucide:underline");
const S = icon16("lucide:strikethrough");
const Code = icon16("lucide:code");
const H1 = icon16("lucide:heading-1");
const H2 = icon16("lucide:heading-2");
const H3 = icon16("lucide:heading-3");
const H4 = icon16("lucide:heading-4");
const H5 = icon16("lucide:heading-5");
const H6 = icon16("lucide:heading-6");
const Blockquote = icon16("lucide:quote");
const Ul = icon16("lucide:list");
const Ol = icon16("lucide:list-ordered");
const TaskList = icon16("lucide:list-checks");
const Hr = icon16("lucide:minus");
const CodeBlock = icon16("lucide:square-code");
const Link = icon16("lucide:link");
const Undo = icon16("lucide:undo-2");
const Redo = icon16("lucide:redo-2");

const H_ICONS = [H1, H2, H3, H4, H5, H6];

function buildToolbarItems(): ToolbarItemDef[] {
  return [
    // H1–H6 结构同构，用 level 数据驱动生成，避免 6 段近乎相同的配置
    ...Array.from({ length: 6 }, (_, i): ToolbarItemDef => {
      const level = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6;
      return {
        key: `h${level}`,
        icon: H_ICONS[i],
        label: `H${level}`,
        title: t(`editor.heading${level}`),
        group: "heading",
        action: (e) => e.chain().focus().toggleHeading({ level }).run(),
        isActive: (e) => e.isActive("heading", { level }),
      };
    }),
    {
      key: "bold",
      icon: B,
      label: t("editor.bold"),
      title: t("editor.boldShortcut"),
      group: "format",
      action: (e) => e.chain().focus().toggleBold().run(),
      isActive: (e) => e.isActive("bold"),
    },
    {
      key: "italic",
      icon: I,
      label: t("editor.italic"),
      title: t("editor.italicShortcut"),
      group: "format",
      action: (e) => e.chain().focus().toggleItalic().run(),
      isActive: (e) => e.isActive("italic"),
    },
    {
      key: "underline",
      icon: U,
      label: t("editor.underline"),
      title: t("editor.underlineShortcut"),
      group: "format",
      action: (e) => e.chain().focus().toggleUnderline().run(),
      isActive: (e) => e.isActive("underline"),
    },
    {
      key: "strike",
      icon: S,
      label: t("editor.strike"),
      title: t("editor.strike"),
      group: "format",
      action: (e) => e.chain().focus().toggleStrike().run(),
      isActive: (e) => e.isActive("strike"),
    },
    {
      key: "code",
      icon: Code,
      label: t("editor.inlineCode"),
      title: t("editor.inlineCode"),
      group: "format",
      action: (e) => e.chain().focus().toggleCode().run(),
      isActive: (e) => e.isActive("code"),
    },
    {
      key: "link",
      icon: Link,
      label: t("editor.link"),
      title: t("editor.insertLink"),
      group: "insert",
      action: () => {
        // 链接由 dispatchAction 拦截：有链接则移除，无链接则打开 LinkEditPopover
      },
      isActive: (e) => e.isActive("link"),
    },
    {
      key: "blockquote",
      icon: Blockquote,
      label: t("editor.blockquote"),
      title: t("editor.blockquoteTitle"),
      group: "block",
      action: (e) => e.chain().focus().toggleBlockquote().run(),
      isActive: (e) => e.isActive("blockquote"),
    },
    {
      key: "bulletList",
      icon: Ul,
      label: t("editor.bulletList"),
      title: t("editor.bulletList"),
      group: "list",
      action: (e) => e.chain().focus().toggleBulletList().run(),
      isActive: (e) => e.isActive("bulletList"),
    },
    {
      key: "orderedList",
      icon: Ol,
      label: t("editor.orderedList"),
      title: t("editor.orderedList"),
      group: "list",
      action: (e) => e.chain().focus().toggleOrderedList().run(),
      isActive: (e) => e.isActive("orderedList"),
    },
    {
      key: "taskList",
      icon: TaskList,
      label: t("editor.taskList"),
      title: t("editor.taskList"),
      group: "list",
      action: (e) => e.chain().focus().toggleTaskList().run(),
      isActive: (e) => e.isActive("taskList"),
    },
    {
      key: "codeBlock",
      icon: CodeBlock,
      label: t("editor.codeBlock"),
      title: t("editor.codeBlock"),
      group: "block",
      action: (e) => e.chain().focus().toggleCodeBlock().run(),
      isActive: (e) => e.isActive("codeBlock"),
    },
    {
      key: "horizontalRule",
      icon: Hr,
      label: t("editor.horizontalRule"),
      title: t("editor.horizontalRule"),
      group: "insert",
      action: (e) => e.chain().focus().setHorizontalRule().run(),
      isActive: () => false,
    },
    {
      key: "undo",
      icon: Undo,
      label: t("editor.undo"),
      title: t("editor.undoShortcut"),
      group: "history",
      action: (e) => e.chain().focus().undo().run(),
      isActive: () => false,
    },
    {
      key: "redo",
      icon: Redo,
      label: t("editor.redo"),
      title: t("editor.redoShortcut"),
      group: "history",
      action: (e) => e.chain().focus().redo().run(),
      isActive: () => false,
    },
    {
      key: "image",
      icon: icon16("lucide:image"),
      label: t("editor.image"),
      title: t("editor.insertImage"),
      group: "insert",
      action: () => {
        // 图片由 dispatchAction 拦截：打开 ImageUrlPopover
      },
      isActive: () => false,
    },
    {
      key: "inlineMath",
      icon: icon16("lucide:pi"),
      label: t("editor.inlineMath"),
      title: t("editor.insertInlineMath"),
      group: "insert",
      action: () => {
        // 行内公式由 dispatchAction 拦截：打开 MathEditor
      },
      isActive: () => false,
    },
    {
      key: "blockMath",
      icon: icon16("lucide:sigma"),
      label: t("editor.blockMath"),
      title: t("editor.insertBlockMath"),
      group: "insert",
      action: () => {
        // 块级公式由 dispatchAction 拦截：打开 MathEditor
      },
      isActive: () => false,
    },
    {
      key: "table",
      icon: icon16("lucide:table"),
      label: t("editor.table"),
      title: t("editor.insertTable3x3"),
      group: "insert",
      action: (e) => {
        e.chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
      isActive: () => false,
    },
    {
      key: "callout",
      icon: icon16("lucide:triangle-alert"),
      label: "Callout",
      title: t("editor.insertCallout"),
      group: "component",
      action: (e) => {
        e.chain()
          .focus()
          .insertContent({ type: "callout", attrs: { type: "info" } })
          .run();
      },
      isActive: () => false,
    },
    {
      key: "figure",
      icon: icon16("lucide:image-plus"),
      label: "Figure",
      title: t("editor.insertFigure"),
      group: "component",
      action: (e) => {
        e.chain().focus().insertContent({ type: "figure", attrs: {} }).run();
      },
      isActive: () => false,
    },
  ];
}

const ITEMS = buildToolbarItems();
const GROUPS = [
  "heading",
  "format",
  "insert",
  "block",
  "list",
  "component",
  "history",
] as const;
// Groups that go into "more" menu on small screens
const MORE_GROUPS = new Set(["component", "history"]);

interface EditorToolbarProps {
  editor: Editor;
}

export default memo(function EditorToolbar({ editor }: EditorToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [mathDraft, setMathDraft] = useState<MathDraft | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const mobileBarRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // 本组件被 memo 包裹且 editor 引用稳定，选区/内容变化不会触发重渲染，
  // isActive 会停留在挂载或上次点击时的状态。订阅 editor 事务并用 tick 参与 memo 依赖，
  // 按钮高亮与移动端自动滚动才能跟随光标。
  const [renderTick, setRenderTick] = useState(0);
  useEffect(() => {
    const rerender = (): void => setRenderTick((n) => n + 1);
    editor.on("transaction", rerender);
    return () => {
      editor.off("transaction", rerender);
    };
  }, [editor]);

  const dispatchAction = useCallback(
    (item: ToolbarItemDef) => {
      if (item.key === "inlineMath") {
        setMathDraft({ isBlock: false, initialLatex: "x^2" });
      } else if (item.key === "blockMath") {
        setMathDraft({ isBlock: true, initialLatex: "\\sum_{i=1}^{n} x_i" });
      } else if (item.key === "link") {
        if (editor.isActive("link")) {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
          setLinkOpen(true);
        }
      } else if (item.key === "image") {
        setImageOpen(true);
      } else {
        item.action(editor);
      }
      // 移动端「更多」菜单：执行完动作要收起，否则弹层一直盖住正文
      setMoreOpen(false);
    },
    [editor],
  );

  // 「更多」菜单的收起：点击触发器/菜单以外的区域或按 Escape 都要关
  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (e: MouseEvent): void => {
      const target = e.target as Node;
      // 触发器与菜单是两个容器（见下方布局注释），都算「内部」
      if (
        moreBtnRef.current?.contains(target) ||
        moreMenuRef.current?.contains(target)
      ) {
        return;
      }
      setMoreOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  // 移动端：当前激活按钮变化时自动滚动到可视区域（rAF + 卸载时取消上一次）
  useEffect(() => {
    const bar = mobileBarRef.current;
    if (!bar || window.innerWidth >= 768) return;
    const scrollActive = (): void => {
      const activeBtn = bar.querySelector(".is-active") as HTMLElement | null;
      if (activeBtn) {
        activeBtn.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "smooth",
        });
      }
    };
    const raf = requestAnimationFrame(scrollActive);
    return () => cancelAnimationFrame(raf);
  }, [editor.state.selection]);

  const desktopContent = useMemo(
    () =>
      GROUPS.map((group) => {
        const items = ITEMS.filter((i) => i.group === group);
        if (items.length === 0) return null;
        return (
          <div
            key={group}
            className="flex items-center gap-0.5 border-r border-surface-3 pr-1 mr-1 last:border-r-0 last:pr-0 last:mr-0"
          >
            {items.map((item) => (
              <EditorToolbarButton
                key={item.key}
                icon={item.icon}
                label={item.label}
                title={item.title}
                isActive={item.isActive(editor)}
                onClick={() => dispatchAction(item)}
              />
            ))}
          </div>
        );
      }),
    [editor, dispatchAction, renderTick],
  );

  const mobileContent = useMemo(
    () =>
      GROUPS.filter((g) => !MORE_GROUPS.has(g)).map((group) => {
        const items = ITEMS.filter((i) => i.group === group);
        if (items.length === 0) return null;
        return (
          <div
            key={group}
            className="flex items-center gap-0.5 shrink-0 border-r border-surface-3 pr-0.5 mr-0.5 last:border-r-0 last:pr-0 last:mr-0"
          >
            {items.map((item) => (
              <EditorToolbarButton
                key={item.key}
                icon={item.icon}
                label={item.label}
                title={item.title}
                isActive={item.isActive(editor)}
                onClick={() => dispatchAction(item)}
              />
            ))}
          </div>
        );
      }),
    [editor, dispatchAction, renderTick],
  );

  const moreItems = useMemo(
    () =>
      GROUPS.filter((g) => MORE_GROUPS.has(g)).map((group) => (
        <div key={group} className="mb-1 last:mb-0">
          <div className="text-xs text-deep-text/50 px-1 mb-0.5">
            {group === "component" ? t("editor.component") : t("editor.action")}
          </div>
          <div className="flex flex-wrap gap-0.5">
            {ITEMS.filter((i) => i.group === group).map((item) => (
              <EditorToolbarButton
                key={item.key}
                icon={item.icon}
                label={item.label}
                title={item.title}
                isActive={item.isActive(editor)}
                onClick={() => dispatchAction(item)}
              />
            ))}
          </div>
        </div>
      )),
    [editor, dispatchAction, renderTick],
  );

  return (
    <div className="rte-toolbar relative">
      <div className="hidden md:flex flex-wrap items-center gap-x-1 gap-y-0.5 p-2">
        {desktopContent}
      </div>

      <div
        ref={mobileBarRef}
        className="flex md:hidden items-center gap-x-0.5 p-1.5 overflow-x-auto scrollbar-none"
      >
        {mobileContent}
        <div ref={moreBtnRef} className="relative shrink-0">
          <button
            type="button"
            className={`rte-btn rte-btn--ghost rte-btn--sm gap-1 ${moreOpen ? "is-active" : ""}`}
            aria-label={t("common.more")}
            aria-haspopup="true"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(!moreOpen)}
          >
            {icon16("lucide:ellipsis")}
          </button>
        </div>
      </div>
      {/* 「更多」菜单必须是滚动容器的兄弟节点：父级 overflow-x-auto 会把 overflow-y 也算成
          auto，菜单留在里面会被裁剪/跟着横滚，浮不到工具栏下方 */}
      {moreOpen && (
        <div
          ref={moreMenuRef}
          className="absolute top-full right-2 mt-1 z-40 bg-page-bg border border-surface-3 rounded-lg shadow-lg p-2 min-w-[200px] rte-dropdown md:hidden"
        >
          {moreItems}
        </div>
      )}
      {mathDraft && (
        <MathEditor
          initialLatex={mathDraft.initialLatex}
          isBlock={mathDraft.isBlock}
          onConfirm={(latex) => {
            if (mathDraft.isBlock) {
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
            setMathDraft(null);
          }}
          onCancel={() => setMathDraft(null)}
        />
      )}
      {imageOpen && (
        <ImageUrlPopover
          onInsert={(src, alt) => {
            editor.chain().focus().setImage({ src, alt }).run();
            setImageOpen(false);
          }}
          onClose={() => setImageOpen(false)}
        />
      )}
      {linkOpen && (
        <div className="absolute top-full right-2 mt-1 z-50">
          <LinkEditPopover editor={editor} onClose={() => setLinkOpen(false)} />
        </div>
      )}
    </div>
  );
});
