import { useState, useCallback, useRef, useEffect } from "react";
import type { ReactElement } from "react";
import katex from "katex";
import { t } from "~/lib/i18n";

interface MathEditorProps {
  initialLatex: string;
  isBlock: boolean;
  onConfirm: (latex: string) => void;
  onCancel: () => void;
}

export default function MathEditor({
  initialLatex,
  isBlock,
  onConfirm,
  onCancel,
}: MathEditorProps): ReactElement {
  const [latex, setLatex] = useState(initialLatex);
  const previewRef = useRef<HTMLSpanElement>(null);

  const handleConfirm = useCallback(() => {
    // 预览用的是 trim 后的文本，落库保持一致；只有输入被清空时才回退成原始公式
    // （空公式会在文档里留下空节点，不如保留原值）
    onConfirm(latex.trim() || initialLatex);
  }, [latex, initialLatex, onConfirm]);

  // 实时渲染 KaTeX 预览
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const tex = latex.trim();
    if (!tex) {
      el.innerHTML = `<span class="text-deep-text/30 text-sm italic">${t("editor.math.enterFormulaPreview")}</span>`;
      return;
    }
    try {
      el.innerHTML = katex.renderToString(tex, {
        displayMode: isBlock,
        throwOnError: false,
      });
    } catch (err) {
      console.warn("[MathEditor] KaTeX 渲染失败:", err);
      el.innerHTML = `<span class="text-error text-sm">${t("editor.math.latexSyntaxError")}</span>`;
    }
  }, [latex, isBlock]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey) {
        handleConfirm();
      }
    },
    [handleConfirm],
  );

  return (
    <div className="rte-dialog-backdrop" onClick={onCancel}>
      <div className="rte-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">
          {isBlock
            ? t("editor.math.blockFormula")
            : t("editor.math.inlineFormula")}
        </h3>

        <div className="mb-4">
          <label className="text-sm font-medium text-deep-text/70 block mb-1">
            {t("editor.math.latexFormula")}
          </label>
          <textarea
            className="rte-textarea w-full font-mono text-sm"
            rows={3}
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("editor.math.latexExample")}
            autoFocus
          />
          <p className="text-xs text-deep-text/50 mt-1">
            {t("editor.math.confirmShortcut")}
          </p>
        </div>

        <div className="mb-4 p-4 bg-page-bg rounded-lg flex items-center justify-center min-h-[60px]">
          <span ref={previewRef} className="text-lg" />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rte-btn rte-btn--ghost rte-btn--sm"
            onClick={onCancel}
          >
            {t("editor.cancel")}
          </button>
          <button
            type="button"
            className="rte-btn rte-btn--primary rte-btn--sm"
            onClick={handleConfirm}
          >
            {t("editor.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
