import { memo, useState, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import type { Node } from "@tiptap/pm/model";
import { NodeViewWrapper } from "@tiptap/react";
import katex from "katex";
import MathEditor from "./MathEditor";
import { t } from "~/lib/i18n";

interface BlockMathNodeViewProps {
  node: Node;
  updateAttributes: (attrs: Record<string, unknown>) => void;
}

const BlockMathNodeView = memo(function BlockMathNodeView({
  node,
  updateAttributes,
}: BlockMathNodeViewProps): ReactElement {
  const [editing, setEditing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const latex = (node.attrs.latex as string) || "";

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    el.replaceChildren();
    if (latex) {
      try {
        // 用 katex.render 直接生成 DOM，而不是 innerHTML + renderToString：
        // 不再把任何字符串当 HTML 解析；trust: false 显式声明不解析 \href 等可执行扩展
        katex.render(latex, el, {
          displayMode: true,
          throwOnError: true,
          trust: false,
        });
      } catch (err) {
        // throwOnError 必须是 true，这个本地化兜底才可达；原来是 false，KaTeX 自己吞错后
        // 这里成了死代码、用户只看得到 KaTeX 自带的英文错误
        console.warn("[BlockMathNodeView] KaTeX 渲染失败:", err);
        const fallback = document.createElement("span");
        fallback.className = "text-[var(--error)] text-sm";
        fallback.textContent = t("editor.math.latexSyntaxError");
        el.replaceChildren(fallback);
      }
    } else {
      const hint = document.createElement("span");
      hint.className = "text-[var(--deep-text)]/30 text-sm italic";
      hint.textContent = t("editor.clickToEditFormula");
      el.replaceChildren(hint);
    }
  }, [latex]);

  return (
    <NodeViewWrapper contentEditable={false} data-block-math>
      <div
        ref={previewRef}
        className="my-4 text-center select-none cursor-pointer"
        onClick={() => setEditing(true)}
      />
      {editing && (
        <MathEditor
          initialLatex={latex}
          isBlock
          onConfirm={(newLatex) => {
            updateAttributes({ latex: newLatex });
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </NodeViewWrapper>
  );
});

export default BlockMathNodeView;
