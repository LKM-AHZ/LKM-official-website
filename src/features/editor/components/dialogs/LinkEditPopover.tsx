import { useState, useEffect, useRef } from "react";
import type { ReactElement, SyntheticEvent } from "react";
import type { Editor } from "@tiptap/core";
import { getMarkRange } from "@tiptap/core";
import { t } from "~/lib/i18n";

interface LinkEditPopoverProps {
  editor: Editor;
  onClose: () => void;
}

export default function LinkEditPopover({
  editor,
  onClose,
}: LinkEditPopoverProps): ReactElement {
  const [href, setHref] = useState("");
  const [text, setText] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;
    const syncFromEditor = (): void => {
      const attrs = editor.getAttributes("link");
      setHref(attrs.href ?? "");
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ");
      // 光标折叠在已有链接内时 selectedText 为空：此时必须取链接自身的显示文本。
      // 退回 href 会把地址当显示文本预填，提交时又因「文本已变」走替换分支，
      // 用 URL 覆盖掉链接原本的可读文字。
      // getMarkRange 第二个参数要 MarkType（不是 "link" 字符串）
      const linkType = editor.schema.marks.link;
      const linkRange = linkType
        ? getMarkRange(editor.state.doc.resolve(from), linkType)
        : undefined;
      const linkText = linkRange
        ? editor.state.doc.textBetween(linkRange.from, linkRange.to, " ")
        : "";
      setText(selectedText || linkText || "");
    };
    // 挂载时同步一次，并跟随选区变化重同步：只依赖 [editor] 的话，弹窗常驻期间把光标移到
    // 另一个链接上，输入框仍是旧值，确认时会把较新的链接覆盖掉
    syncFromEditor();
    editor.on("selectionUpdate", syncFromEditor);
    return () => {
      editor.off("selectionUpdate", syncFromEditor);
    };
  }, [editor]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSubmit = (
    e: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ): void => {
    e.preventDefault();
    const trimmedHref = href.trim();
    const finalText = text.trim();
    if (!trimmedHref) return; // 无地址不提交，保留弹窗

    const chain = editor.chain().focus();
    const { from, to } = editor.state.selection;
    const currentText = editor.state.doc.textBetween(from, to, " ");

    if (finalText && finalText !== currentText) {
      // 显示文本有改动（或光标无选区）：用新文本 + 链接替换/插入
      chain.extendMarkRange("link");
      if (from !== to || editor.isActive("link")) {
        chain.deleteSelection();
      }
      chain.insertContent({
        type: "text",
        text: finalText,
        marks: [{ type: "link", attrs: { href: trimmedHref } }],
      });
    } else {
      chain.extendMarkRange("link").setLink({ href: trimmedHref });
    }
    chain.run();
    onClose();
  };

  const handleRemove = (): void => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onClose();
  };

  return (
    <div ref={popoverRef} className="rte-link-popover">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label className="text-xs font-medium text-deep-text/70">
          {t("editor.linkUrl")}
        </label>
        <input
          type="url"
          className="rte-input rte-input--sm"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="https://..."
          autoFocus
        />
        <label className="text-xs font-medium text-deep-text/70">
          {t("editor.linkText")}
        </label>
        <input
          type="text"
          className="rte-input rte-input--sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("editor.linkTextPlaceholder")}
        />
        <div className="flex justify-between mt-1">
          <button
            type="button"
            className="rte-btn rte-btn--ghost rte-btn--sm text-error"
            onClick={handleRemove}
          >
            {t("editor.removeLink")}
          </button>
          <button
            type="submit"
            className="rte-btn rte-btn--primary rte-btn--sm"
            // 地址为空时 handleSubmit 会静默 return，用户看不出为什么没反应；
            // 直接禁用提交，让「必须先填地址」这件事在按钮上就可见
            disabled={!href.trim()}
          >
            {t("editor.confirm")}
          </button>
        </div>
      </form>
    </div>
  );
}
