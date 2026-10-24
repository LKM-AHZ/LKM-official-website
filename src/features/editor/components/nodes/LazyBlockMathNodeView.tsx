import { Suspense, lazy } from "react";
import type { ReactElement } from "react";
import type { NodeViewProps } from "@tiptap/react";

const BlockMathNodeView = lazy(() => import("./BlockMathNodeView"));

/**
 * 块级公式节点视图的懒加载壳。
 *
 * KaTeX 只被 BlockMathNodeView / MathEditor 使用，gzip 后约 75KiB；而
 * engine/extensions/index.ts 在编辑器启动时就被静态载入。若这里直接 import，
 * 不含任何公式的文档也要为 KaTeX 付首屏字节。用 React.lazy 把 KaTeX 推迟到
 * 文档里真正出现 blockMath 节点时再拉取。
 */
export default function LazyBlockMathNodeView(
  props: NodeViewProps,
): ReactElement {
  return (
    <Suspense
      fallback={
        <div className="my-4 text-center text-sm opacity-40" aria-hidden="true">
          …
        </div>
      }
    >
      <BlockMathNodeView
        node={props.node}
        updateAttributes={
          props.updateAttributes as (attrs: Record<string, unknown>) => void
        }
      />
    </Suspense>
  );
}
