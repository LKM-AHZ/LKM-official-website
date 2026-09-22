import { createRoot } from "react-dom/client";
import { createElement } from "react";
import type { ReactElement } from "react";
import ExportPdfPage from "./ExportPdfPage";
import type { Editor } from "@tiptap/core";
import { t } from "~/lib/i18n";

export function handleExportPdf(editor: Editor): void {
  const json = editor.getJSON();
  const content = (json?.content ?? []) as Array<Record<string, unknown>>;

  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) {
    alert(t("editor.exportPdfAllowPopup"));
    return;
  }

  // 不用 documentElement.innerHTML 覆盖：window.open 的空白页本身已有合法的 head/body，
  // 整体覆盖既丢结构又引入未转义的模板拼接。标题/meta/容器一律用 DOM API 建。
  const popupDoc = printWindow.document;
  popupDoc.title = t("editor.exportPdfTitle");
  const meta = popupDoc.createElement("meta");
  meta.setAttribute("charset", "utf-8");
  popupDoc.head.appendChild(meta);
  const rootEl = popupDoc.createElement("div");
  rootEl.id = "pdf-root";
  popupDoc.body.appendChild(rootEl);

  const root = createRoot(rootEl);
  root.render(createElement(ExportPdfPage, { content }));
  // 打印窗口与 React root 用后即弃：不清理时每次导出都会留下一个 root 与一份弹窗 DOM
  printWindow.onafterprint = () => {
    root.unmount();
    printWindow.close();
  };
  // 用「等容器真正被填充 + 等字体/图片就绪」替代原先固定的 300/500ms 等待
  // （React 19 的 root.render 已不再支持完成回调），否则慢设备或大文档会在
  // React 提交之前、图片未加载时打印出空白/半截 PDF。
  void (async () => {
    try {
      await waitForContent(rootEl);
      await waitForAssets(popupDoc);
      printWindow.focus();
      printWindow.print();
    } catch (err) {
      // 用户提前关掉弹窗、跨源等情况下 focus/print 会抛错；这段链原先被 void 掉，
      // 异常整段静默，用户只看到「点了导出没反应」
      console.warn("[DocumentEditor] 导出 PDF 失败:", err);
      alert(t("editor.exportFailed", { message: (err as Error).message }));
    }
  })();
}

/** 等 React 把内容挂进容器；5s 上限，超时也继续打印，避免彻底出不了 PDF。 */
async function waitForContent(rootEl: HTMLElement): Promise<void> {
  const deadline = Date.now() + 5000;
  while (rootEl.childElementCount === 0 && Date.now() < deadline) {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  }
}

/** 等弹窗文档的字体与图片就绪（失败/缺资源都立刻 resolve，不阻塞打印）。 */
async function waitForAssets(doc: Document): Promise<void> {
  const images = Array.from(doc.images).map(
    (img) =>
      new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
          return;
        }
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      }),
  );
  await Promise.all([doc.fonts?.ready ?? Promise.resolve(), ...images]);
}

interface ExportPdfButtonProps {
  editor: Editor;
}

export default function ExportPdfButton({
  editor,
}: ExportPdfButtonProps): ReactElement {
  return (
    <button
      type="button"
      className="rte-btn rte-btn--ghost rte-btn--xs"
      title={t("editor.exportPdf")}
      onClick={() => handleExportPdf(editor)}
    >
      PDF
    </button>
  );
}
