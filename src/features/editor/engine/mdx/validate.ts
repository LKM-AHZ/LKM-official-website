import type { ValidationIssue } from "./types";
import { t } from "~/lib/i18n";

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:"];
/** 代码执行安全：这些节点在 MDX 渲染器（本站用 @astrojs/mdx 构建）里会执行代码，导入即拒。
 *  刻意**不**列入 mdxJsxFlowElement/mdxJsxTextElement —— Callout/Figure 等站点已注册组件
 *  正是靠它们承载（见 mdast-to-tiptap），一律阻断会砍掉既定功能；
 *  mdxFlowExpression/mdxTextExpression 目前按 rawMdx 保底保留，若也要升级为 error，
 *  需要一条与表达式匹配的本地化文案（现有文案只覆盖 ESM），故暂不纳入。 */
const FORBIDDEN_NODE_TYPES = new Set(["mdxjsEsm"]);
// 可执行/可注入的危险协议。import-mdx 只按 severity === "error" 阻断导入，
// 这些协议若只报 warning 等于没拦；其余未知协议（如 tel:）保持 warning，不误伤。
const DANGEROUS_PROTOCOLS = ["javascript:", "data:", "vbscript:", "file:"];

interface WalkableNode {
  type?: string;
  children?: WalkableNode[];
  url?: string;
  value?: string;
}

/** 递归深度上限：MDX 允许任意深嵌套，病态/循环 AST 会 stack overflow 直接崩掉编辑器 */
const MAX_DEPTH = 1000;

function walkTree(
  node: WalkableNode,
  issues: ValidationIssue[],
  depth = 0,
): void {
  if (!node || typeof node !== "object") return;
  if (depth > MAX_DEPTH) return;

  const nodeType = node.type ?? "unknown";

  // 检查禁止的节点类型（代码执行安全）：清单集中在一处，新增类型不必再改判断
  if (FORBIDDEN_NODE_TYPES.has(nodeType)) {
    issues.push({
      message: t("editor.validation.esmForbidden"),
      nodeType,
      severity: "error",
    });
  }

  // 检查链接和图片的 URL 协议
  if ((nodeType === "link" || nodeType === "image") && node.url) {
    const colon = node.url.indexOf(":");
    if (colon > 0) {
      // 浏览器解析 scheme 时忽略其中的空白/控制字符，且大小写不敏感：先去杂再转小写，
      // 否则 HTTPS:// 会被误报，而 java\nscript: 这种混淆写法只会被降成 warning 漏掉
      const proto = `${node.url
        .slice(0, colon)
        // eslint-disable-next-line no-control-regex -- 正是要匹配 URL scheme 里的控制字符
        .replace(/[\s\u0000-\u001f]/g, "")
        .toLowerCase()}:`;
      if (
        !ALLOWED_PROTOCOLS.includes(proto) &&
        !node.url.startsWith("/") &&
        !node.url.startsWith(".") &&
        !node.url.startsWith("#")
      ) {
        // url 是未校验的用户输入：进 message/details 前截断，
        // 避免超长（或夹带 HTML）的载荷一路传到消费方的展示层
        const safeUrl = String(node.url).slice(0, 512);
        issues.push({
          message: t("editor.validation.disallowedProtocol", {
            nodeType,
            url: safeUrl,
          }),
          nodeType,
          severity: DANGEROUS_PROTOCOLS.includes(proto) ? "error" : "warning",
          details: safeUrl,
        });
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walkTree(child, issues, depth + 1);
    }
  }
}

export function validateMDAST(root: WalkableNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  walkTree(root, issues);
  return issues;
}
