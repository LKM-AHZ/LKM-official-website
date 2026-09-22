import type { Root } from "mdast";

type Node = {
  type?: string;
  children?: Node[];
  value?: string;
  depth?: number;
};

/**
 * 合并段落和标题中相邻的文本节点。
 * remark-parse 可能为同一内联内容生成多个相邻文本节点。
 */
function mergeTextChildren(children: Node[]): Node[] {
  const result: Node[] = [];

  for (const child of children) {
    const prev = result[result.length - 1];
    if (prev && prev.type === "text" && child.type === "text") {
      // 构造新节点而不是原地改 prev：原实现依赖「调用方已经深克隆」这一隐式前提
      // （position 取首个节点，仅用于报错定位）
      result[result.length - 1] = {
        ...prev,
        value: (prev.value ?? "") + (child.value ?? ""),
      };
    } else {
      result.push(child);
    }
  }

  return result;
}

/** 递归深度上限：MDX 允许任意深嵌套，病态文档会 stack overflow 把整次导入/导出打断 */
const MAX_DEPTH = 1000;

function walkNode(node: Node, depth = 0): void {
  if (depth > MAX_DEPTH) return;
  // 合并相邻文本节点与收敛标题深度在同一趟里完成：原先是两趟独立遍历
  // （walkNode + walkAndClamp），同一棵树走两遍，且两边的深度上限/递归形态必须手动保持同步
  if (node.type === "heading" && typeof node.depth === "number") {
    node.depth = clampHeadingDepth(node.depth);
  }
  if (Array.isArray(node.children)) {
    node.children = mergeTextChildren(node.children);
    for (const child of node.children) {
      walkNode(child, depth + 1);
    }
  }
}

/** 限制标题深度为 1-6 */
function clampHeadingDepth(depth: number): number {
  if (depth < 1 || depth > 6) {
    // 回退可以、静默不行（与 stores/constants.ts 的 getCategory 同口径）：
    // 越界深度只可能来自上游解析器，留一条信号免得元数据错了却无从排查
    console.warn(`[normalize] 标题深度 ${depth} 超出 1-6，已收敛`);
  }
  return Math.max(1, Math.min(6, depth));
}

export function normalizeMDAST(root: Root): Root {
  // structuredClone 而不是 JSON 往返：JSON 会丢掉值为 undefined 的字段、遇循环结构抛错，
  // 且在大文档上更慢更费内存（本函数每次导入/导出都会跑）
  const cloned: Root = structuredClone(root);
  walkNode(cloned as unknown as Node);
  return cloned;
}
