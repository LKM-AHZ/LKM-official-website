import type { Editor, JSONContent } from "@tiptap/core";
import type { ReactElement } from "react";
import { t } from "~/lib/i18n";

// 并发闸门：每次导出都要动态 import 约 1MB 的 docx 库并做重序列化，连点会叠出多个
// 并发导出与多次下载
let exporting = false;

export async function handleExportDocx(editor: Editor): Promise<void> {
  if (exporting) return;
  exporting = true;
  try {
    // docx 库约 1MB，动态 import 仅在点击导出时加载，避免打膨胀编辑器主包
    const { buildDocxBlob } = await import("../../engine/serialize-docx");
    const json = editor.getJSON();
    const content = json?.content ?? [];
    // 用文档首标题作为默认文件名与文档标题
    const headingTitle = firstHeadingText(content);
    const titleText = headingTitle || t("editor.untitled");
    // 文档自带标题时不再把同一段文字作为 TITLE 标题传入：buildDocxBlob 会在正文前插一段
    // TITLE，而原标题节点仍在 content 里，导出物会出现两遍同样的标题
    const blob = await buildDocxBlob(content, headingTitle || undefined);

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameSafe(titleText)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.warn("[DocumentEditor] 导出 docx 失败:", err);
    alert(t("editor.exportFailed", { message: (err as Error).message }));
  } finally {
    exporting = false;
  }
}

/** 从顶层节点取首个标题文本，用作文件名 */
function firstHeadingText(content: JSONContent[]): string {
  for (const node of content) {
    if (node?.type === "heading" && Array.isArray(node.content)) {
      const text = node.content
        .map((c) => (typeof c.text === "string" ? c.text : ""))
        .join("");
      if (text.trim()) return text.trim();
    }
  }
  return "";
}

/** Windows 保留设备名（不区分大小写）不能作为文件名 */
const RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/** 移除不适合做文件名的字符 */
function filenameSafe(name: string): string {
  const base =
    name
      .trim()
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, "_")
      // Windows 会静默丢掉结尾的点/空格，留着会得到一个与预期不同的文件名
      .replace(/[._]+$/, "")
      // 文件系统文件名上限 255 **字节**：中文标题按 3 字节/字算，60 字符 = 180 字节
      .slice(0, 60) || "document";
  // 保留名（CON/PRN/…）加后缀绕开，否则 Windows 上无法保存
  return RESERVED_NAMES.test(base) ? `${base}_` : base;
}

interface ExportDocxButtonProps {
  editor: Editor;
}

export default function ExportDocxButton({
  editor,
}: ExportDocxButtonProps): ReactElement {
  return (
    <button
      type="button"
      className="rte-btn rte-btn--ghost rte-btn--xs"
      title={t("editor.exportDocxTitle")}
      onClick={() => {
        void handleExportDocx(editor);
      }}
    >
      DOCX
    </button>
  );
}
