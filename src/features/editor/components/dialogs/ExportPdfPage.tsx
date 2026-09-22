import type { ReactElement } from "react";
import { renderNode } from "../panels/PreviewPanel";
import type { JSONContent } from "@tiptap/core";
import { t } from "~/lib/i18n";

interface ExportPdfPageProps {
  content: JSONContent[];
}

export default function ExportPdfPage({
  content,
}: ExportPdfPageProps): ReactElement {
  // 本组件每次导出只渲染一次，memo 无收益；且若调用方原地改动 content 数组/节点，
  // memo 的引用比较会命中旧缓存、导出漏掉最新改动。直接算。
  const nodes = content.map((n, i) => renderNode(n, i));

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>{t("editor.exportDocument")}</title>
        <style>{`
          @page {
            size: A4;
            margin: 20mm 25mm;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            /* 打印分页保真：宽代码块/表格不再被裁切，长块尽量不跨页断开 */
            pre { white-space: pre-wrap; word-break: break-word; overflow: visible; }
            pre, table, figure, blockquote { break-inside: avoid; }
            img { max-height: 90vh; }
          }
          body {
            font-family: 'Noto Sans SC', system-ui, -apple-system, sans-serif;
            font-size: 12pt;
            line-height: 1.8;
            color: #333;
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
          h1 { font-size: 24pt; margin: 0.8em 0 0.4em; }
          h2 { font-size: 18pt; margin: 0.7em 0 0.3em; }
          h3 { font-size: 14pt; margin: 0.6em 0 0.3em; }
          p { margin: 0.3em 0; }
          blockquote {
            border-left: 3px solid #ccc;
            padding-left: 1em;
            color: #666;
            font-style: italic;
          }
          pre {
            background: #f5f5f5;
            padding: 1em;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10pt;
            overflow-x: auto;
          }
          code { background: #f0f0f0; padding: 0.1em 0.3em; border-radius: 2px; font-size: 0.9em; }
          table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
          td, th { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
          ul, ol { padding-left: 2em; }
          img { max-width: 100%; height: auto; }
          figure { margin: 1em 0; text-align: center; }
          figcaption { font-size: 10pt; color: #888; margin-top: 0.3em; }
          .alert { padding: 0.8em 1em; border-radius: 6px; margin: 0.8em 0; border: 1px solid; }
          .alert-info { background: #e8f4fd; border-color: #b6d4fe; color: #0c5460; }
          .alert-warning { background: #fff3cd; border-color: #ffeeba; color: #856404; }
          .alert-error { background: #f8d7da; border-color: #f5c6cb; color: #721c24; }
          .alert-success { background: #d4edda; border-color: #c3e6cb; color: #155724; }
        `}</style>
      </head>
      <body>{nodes}</body>
    </html>
  );
}
