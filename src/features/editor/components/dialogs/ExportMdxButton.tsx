import type { Editor } from "@tiptap/core";
import type { JSONContent } from "@tiptap/core";
import { t } from "~/lib/i18n";
import { exportMdx } from "../../engine/mdx/index";
import { serializeMarkdown } from "../../engine/serialize-markdown";

function getContent(editor: Editor): JSONContent[] {
  const json = editor.getJSON();
  return json?.content ?? [];
}

function downloadText(text: string, extension: "md" | "mdx"): void {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `document.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 导出 MDX：保留组件语法（Callout / Figure / rawMdx 原样输出） */
export function handleExportMdx(editor: Editor): void {
  try {
    const { mdx } = exportMdx(getContent(editor));
    downloadText(mdx, "mdx");
  } catch (err) {
    alert(t("editor.exportFailed", { message: (err as Error).message }));
  }
}

/** 导出 MD：JSX 组件降级为纯 markdown 等价物 */
export function handleExportMd(editor: Editor): void {
  try {
    const md = serializeMarkdown(getContent(editor));
    downloadText(md, "md");
  } catch (err) {
    alert(t("editor.exportFailed", { message: (err as Error).message }));
  }
}
