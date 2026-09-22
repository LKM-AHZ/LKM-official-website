import type { Editor } from "@tiptap/core";
import { getLocale, t } from "~/lib/i18n";
import { serializeHtml } from "../../engine/serialize-html";

export function handleExportHtml(editor: Editor): void {
  try {
    const json = editor.getJSON();
    const content = (json?.content ?? []) as Parameters<
      typeof serializeHtml
    >[0];
    const body = serializeHtml(content);
    const html = `<!doctype html>
<html lang="${getLocale()}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${t("editor.exportDocument")}</title>
<style>
  body { font-family: 'Noto Sans SC', system-ui, sans-serif; font-size: 12pt; line-height: 1.8; color: #333; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 24pt; margin: 0.8em 0 0.4em; }
  h2 { font-size: 18pt; margin: 0.7em 0 0.3em; }
  h3 { font-size: 14pt; margin: 0.6em 0 0.3em; }
  p { margin: 0.3em 0; }
  blockquote { border-left: 3px solid #ccc; padding-left: 1em; color: #666; font-style: italic; }
  pre { background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto; }
  code { background: #f0f0f0; padding: 0.1em 0.3em; border-radius: 2px; font-size: 0.9em; }
  table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
  td, th { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
  ul, ol { padding-left: 2em; }
  img { max-width: 100%; height: auto; }
  figure { margin: 1em 0; text-align: center; }
  figcaption { font-size: 10pt; color: #888; margin-top: 0.3em; }
  .callout { padding: 0.8em 1em; border-radius: 6px; margin: 0.8em 0; border: 1px solid; }
  .callout-info { background: #e8f4fd; border-color: #b6d4fe; }
  .callout-warning { background: #fff3cd; border-color: #ffeeba; }
  .callout-error { background: #f8d7da; border-color: #f5c6cb; }
  .callout-success { background: #d4edda; border-color: #c3e6cb; }
  .math-block, .math-inline { font-family: 'JetBrains Mono', monospace; }
</style>
</head>
<body>${body}</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // 不再固定写 document.html：用本地化名称，多份导出至少能区分语言与用途
    a.download = `${t("editor.exportDocument")}.html`;
    // 需挂到文档里再点击，Firefox 等对游离节点不会触发下载
    document.body.appendChild(a);
    try {
      a.click();
    } finally {
      a.remove();
      // 延迟释放：Safari/Firefox 在 click 之后仍需该 URL 才能启动下载，立即 revoke 会中断；
      // 放在 finally 里保证即使 click 抛错也不泄漏 blob URL。
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  } catch (err) {
    // 非 Error 的 rejection（字符串/undefined/裸对象）会让文案变成 "导出失败: undefined"
    const message =
      err instanceof Error && err.message
        ? err.message
        : t("messages.unknownError");
    alert(t("editor.exportFailed", { message }));
  }
}
