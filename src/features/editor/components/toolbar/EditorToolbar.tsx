import { useState, useRef, useEffect, useCallback, memo, useId } from "react";
import type { ReactElement, ReactNode } from "react";
import { Icon } from "@iconify/react";
import type { Editor } from "@tiptap/core";
import EditorToolbarButton from "./EditorToolbarButton";
import MathEditor from "../nodes/MathEditor";
import ImageUrlPopover from "../dialogs/ImageUrlPopover";
import LinkEditPopover from "../dialogs/LinkEditPopover";
import TableInsertMenu from "../dialogs/TableInsertMenu";
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
const HEADING_ITEMS = ITEMS.filter((item) => item.group === "heading");
const INSERT_ITEMS = ITEMS.filter(
  (item) => item.group === "insert" || item.group === "component",
);
const MOBILE_KEYS = new Set(["bold", "italic", "link", "bulletList", "undo"]);
const TOGGLE_KEYS = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
  "blockquote",
  "bulletList",
  "orderedList",
  "taskList",
  "codeBlock",
]);
const MOBILE_MORE_GROUPS = [
  "format",
  "list",
  "block",
  "insert",
  "component",
  "history",
] as const;

interface EditorToolbarProps {
  editor: Editor;
}

export default memo(function EditorToolbar({ editor }: EditorToolbarProps) {
  const [openMenu, setOpenMenu] = useState<
    "heading" | "insert" | "more" | null
  >(null);
  const [mathDraft, setMathDraft] = useState<MathDraft | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // 本组件被 memo 包裹且 editor 引用稳定，选区/内容变化不会触发重渲染，
  // isActive 会停留在挂载或上次点击时的状态，订阅事务后才能跟随光标。
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
      } else if (item.key === "table") {
        setTableOpen(true);
      } else {
        item.action(editor);
      }
      setOpenMenu(null);
    },
    [editor],
  );

  const toggleMenu = (menu: "heading" | "insert" | "more"): void => {
    setTableOpen(false);
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // 点击工具栏以外或按 Escape 收起菜单，避免菜单挡住正文。
  useEffect(() => {
    if (!openMenu && !tableOpen) return;
    const onPointerDown = (e: MouseEvent): void => {
      if (!toolbarRef.current?.contains(e.target as Node)) {
        setOpenMenu(null);
        setTableOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setTableOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu, tableOpen]);

  const currentHeading = HEADING_ITEMS.find((item) => item.isActive(editor));
  // renderTick 由 editor 事务更新，确保选区变化后菜单和按钮状态同步。
  void renderTick;

  const renderButton = (item: ToolbarItemDef): ReactElement => (
    <EditorToolbarButton
      key={item.key}
      icon={item.icon}
      label={item.label}
      title={item.title}
      isActive={TOGGLE_KEYS.has(item.key) ? item.isActive(editor) : undefined}
      disabled={
        item.key === "undo"
          ? !editor.can().undo()
          : item.key === "redo"
            ? !editor.can().redo()
            : false
      }
      onClick={() => dispatchAction(item)}
    />
  );

  const renderMenuItem = (item: ToolbarItemDef): ReactElement => (
    <button
      key={item.key}
      type="button"
      className={`rte-toolbar-menu-item ${item.isActive(editor) ? "is-active" : ""}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => dispatchAction(item)}
      aria-pressed={
        item.group === "heading" || TOGGLE_KEYS.has(item.key)
          ? item.isActive(editor)
          : undefined
      }
      disabled={
        item.key === "redo"
          ? !editor.can().redo()
          : item.key === "undo"
            ? !editor.can().undo()
            : false
      }
    >
      {item.icon}
      <span>{item.label}</span>
    </button>
  );

  return (
    <div ref={toolbarRef} className="rte-toolbar">
      <div className="rte-toolbar-primary">
        <button
          type="button"
          className={`rte-toolbar-select ${currentHeading ? "is-active" : ""}`}
          aria-label={t("editor.textStyle")}
          aria-haspopup="true"
          aria-expanded={openMenu === "heading"}
          aria-controls={`${menuId}-heading`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => toggleMenu("heading")}
        >
          <span>{currentHeading?.label ?? t("editor.paragraph")}</span>
          {icon16("lucide:chevron-down")}
        </button>
        <div className="rte-toolbar-group rte-toolbar-desktop">
          {ITEMS.filter((item) => item.group === "format").map(renderButton)}
        </div>
        <div className="rte-toolbar-group rte-toolbar-mobile">
          {ITEMS.filter(
            (item) => MOBILE_KEYS.has(item.key) && item.group === "format",
          ).map(renderButton)}
        </div>
        <div className="rte-toolbar-group rte-toolbar-desktop">
          {ITEMS.filter((item) => item.group === "list").map(renderButton)}
          {ITEMS.filter((item) => item.group === "block").map(renderButton)}
        </div>
        <div className="rte-toolbar-group rte-toolbar-mobile">
          {ITEMS.filter(
            (item) => MOBILE_KEYS.has(item.key) && item.group === "list",
          ).map(renderButton)}
        </div>
        <div className="rte-toolbar-group rte-toolbar-desktop">
          {renderButton(ITEMS.find((item) => item.key === "link")!)}
          <button
            type="button"
            className="rte-toolbar-select rte-toolbar-insert"
            aria-haspopup="true"
            aria-expanded={openMenu === "insert"}
            aria-controls={`${menuId}-insert`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => toggleMenu("insert")}
          >
            {icon16("lucide:plus")}
            <span>{t("editor.insert")}</span>
            {icon16("lucide:chevron-down")}
          </button>
        </div>
        <div className="rte-toolbar-group rte-toolbar-desktop">
          {ITEMS.filter((item) => item.group === "history").map(renderButton)}
        </div>
        <div className="rte-toolbar-group rte-toolbar-mobile">
          {ITEMS.filter(
            (item) =>
              MOBILE_KEYS.has(item.key) &&
              (item.group === "insert" || item.group === "history"),
          ).map(renderButton)}
          <button
            type="button"
            className="rte-toolbar-btn"
            aria-label={t("common.more")}
            aria-haspopup="true"
            aria-expanded={openMenu === "more"}
            aria-controls={`${menuId}-more`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => toggleMenu("more")}
          >
            {icon16("lucide:ellipsis")}
          </button>
        </div>
      </div>
      {openMenu === "heading" && (
        <div
          id={`${menuId}-heading`}
          className="rte-toolbar-popover rte-toolbar-popover--heading rte-dropdown"
        >
          <button
            type="button"
            className={`rte-toolbar-menu-item ${!currentHeading ? "is-active" : ""}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              editor.chain().focus().setParagraph().run();
              setOpenMenu(null);
            }}
            aria-pressed={!currentHeading}
          >
            {icon16("lucide:type")}
            <span>{t("editor.paragraph")}</span>
          </button>
          {HEADING_ITEMS.map(renderMenuItem)}
        </div>
      )}
      {openMenu === "insert" && (
        <div
          id={`${menuId}-insert`}
          className="rte-toolbar-popover rte-toolbar-popover--insert rte-dropdown"
        >
          {INSERT_ITEMS.filter((item) => item.key !== "link").map(
            renderMenuItem,
          )}
        </div>
      )}
      {openMenu === "more" && (
        <div
          id={`${menuId}-more`}
          className="rte-toolbar-popover rte-toolbar-popover--more rte-dropdown"
        >
          {MOBILE_MORE_GROUPS.map((group) => {
            const items = ITEMS.filter(
              (item) => item.group === group && !MOBILE_KEYS.has(item.key),
            );
            if (!items.length) return null;
            return (
              <div key={group} className="rte-toolbar-menu-section">
                <span className="rte-toolbar-menu-heading">
                  {t(`editor.toolbarGroup.${group}`)}
                </span>
                {items.map(renderMenuItem)}
              </div>
            );
          })}
        </div>
      )}
      {tableOpen && (
        <div className="rte-toolbar-popover rte-toolbar-popover--table rte-dropdown">
          <TableInsertMenu
            onInsert={(rows, cols) =>
              editor
                .chain()
                .focus()
                .insertTable({ rows, cols, withHeaderRow: true })
                .run()
            }
            onClose={() => setTableOpen(false)}
          />
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
