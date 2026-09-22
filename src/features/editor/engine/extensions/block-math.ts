import { Node, InputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import BlockMathNodeView from "../../components/nodes/BlockMathNodeView";

export const BlockMath = Node.create({
  name: "blockMath",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      latex: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-block-math]" }];
  },

  renderHTML({ HTMLAttributes }) {
    // atom 节点无内容槽，不返回 0（否则 getHTML/复制粘贴会产生无意义空标签层）。
    // 把外部 merge 进来的通用 attrs（如 class）与节点私有 attrs 合并，避免覆盖默认 class。
    const { class: extraClass, ...rest } = HTMLAttributes as {
      class?: string;
      [key: string]: unknown;
    };
    return [
      "div",
      {
        "data-block-math": "",
        class: extraClass
          ? `my-4 text-center select-none cursor-pointer ${extraClass}`
          : "my-4 text-center select-none cursor-pointer",
        ...rest,
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      BlockMathNodeView as Parameters<typeof ReactNodeViewRenderer>[0],
    );
  },

  // Obsidian 式 $$...$$ 输入即渲染（整段独占，输入成对闭包后转换）。
  //
  // 不再使用 @tiptap/core 的 nodeInputRule：其「无捕获组」分支走
  //   insertionStart = type.isInline ? start : start - 1
  // 这个 -1 是库为「匹配前有前置内容、可分裂段落」设计的启发式，对「段落起点 /
  // 文档首元素」不成立：空文档首段输入会得到 start - 1 = 0（文档根），导致 blockMath
  // 被插到文档根外、原段落未转换（实测 <div data-block-math></div><p></p>），甚至
  // 在更深嵌套处使 start - 1 为负而抛 RangeError。handleTextInput→run 没有 try/catch。
  //
  // 因此这里自写 InputRule handler，不依赖库的 -1，不触碰任何负位置：
  //   - find 的 ^ 锚定 textBefore（段落起点→光标全文），保证只在 $$ 位于段落起点时匹配，
  //     实现「$$ 独占一行/一段」的 Obsidian 语义，也规避前文文本式 ...$$...$$ 误触发
  //   - handler 取 state.selection.$from（键入后光标必落在该段内），整段替换：
  //     * 校验 $$ 确在该段内容起点（range.from === 段内容起点），否则返回 null 不触发（保持纯文本）
  //     * 用 $from.before/$after($depth) 取该段[node, 独占]区间，tr.replaceWith 整段换成 blockMath
  //   - 产出单一 blockMath 节点、无 $$ 残留、无负位置。
  //     注：当 blockMath 成为文档末尾最后一块时，@tiptap/extension-document 会照常补一个
  //     空段作为后继（实测 setContent(仅 blockMath) 也如此），这是 tiptap 文档模型的固有行为，
  //     非本 handler 所致、也不产生负位置/RangeError。
  //
  // 注意 BlockMath 是 group:'block'、atom:true 的原子节点，不是 textblock，不能
  // setBlockType；用 tr.replaceWith + 段边界(before/after) 整体换掉所在段。
  addInputRules() {
    return [
      new InputRule({
        find: /^\$\$([\s\S]*?)\$\$$/,
        handler: ({ state, range, match }) => {
          const latex = (match[1] ?? "").trim();
          // 空公式（$$$$ / $$   $$）无意义：不转换，保持纯文本，
          // 否则会生成空 latex 的 blockMath 节点，在文档模型里也留下空公式
          if (!latex) {
            return null;
          }
          // 键入后光标必落在该段内，用它取段边界最可靠。
          const $cursor = state.selection.$from;
          // depth 为 0（顶层 NodeSelection/AllSelection）或所处节点不是文本块时，
          // before/after 会抛 RangeError，也可能解析出 [0, docSize] 把整篇替换掉，
          // 必须在取位置之前就放行
          if ($cursor.depth === 0 || !$cursor.parent.isTextblock) {
            return null;
          }
          const paragraphStart = $cursor.before($cursor.depth);
          // 触发约束：$$ 必须处于该段内容起点（Obsidian 独占语义）。
          // 返回 null =「未命中」→ run 不 dispatch，落到 PM 默认文本插入。
          if (range.from !== paragraphStart + 1) {
            return null;
          }
          const node = this.type.create({ latex });
          const from = paragraphStart;
          const to = $cursor.after($cursor.depth);
          state.tr.replaceWith(from, to, node);
          // 需返回 undefined（非 null）→ run 见 handler!==null 且 tr 有 step 才 dispatch
          return undefined;
        },
      }),
    ];
  },
});
