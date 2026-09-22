import { h } from "hastscript";
import { visit } from "unist-util-visit";

/**
 * 允许直接映射成 HTML 标签的指令名，必须与 astro.config.ts 中 rehypeComponents
 * 注册的组件一致（github + 五种 admonition）。
 * node.name 来自内容作者：不加白名单就能用它渲染任意元素（iframe/script/style 等），
 * 绕过组件白名单。
 */
const ALLOWED_DIRECTIVES = new Set([
  "github",
  "note",
  "tip",
  "important",
  "caution",
  "warning",
]);

export function parseDirectiveNode() {
  return (tree) => {
    visit(tree, (node) => {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective" ||
        node.type === "textDirective"
      ) {
        // biome-ignore lint/suspicious/noAssignInExpressions: <check later>
        const data = node.data || (node.data = {});
        node.attributes = node.attributes || {};
        if (
          node.children.length > 0 &&
          node.children[0].data &&
          node.children[0].data.directiveLabel
        ) {
          // 给节点添加标记，表明它有指令标签
          node.attributes["has-directive-label"] = true;
        }
        // 白名单外的指令降级为普通容器元素：内容仍渲染，但标签名不再由作者决定
        const tagName = ALLOWED_DIRECTIVES.has(node.name)
          ? node.name
          : node.type === "textDirective"
            ? "span"
            : "div";
        const hast = h(tagName, node.attributes);

        data.hName = hast.tagName;
        data.hProperties = hast.properties;
      }
    });
  };
}
