import type { ValidationIssue } from "./types";
import { t } from "~/lib/i18n";

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:"];
// 可执行/可注入的危险协议。import-mdx 只按 severity === "error" 阻断导入，
// 这些协议若只报 warning 等于没拦；其余未知协议（如 tel:）保持 warning，不误伤。
const DANGEROUS_PROTOCOLS = ["javascript:", "data:", "vbscript:", "file:"];

interface WalkableNode {
  type?: string;
  children?: WalkableNode[];
  url?: string;
  value?: string;
}

function walkTree(node: WalkableNode, issues: ValidationIssue[]): void {
  if (!node || typeof node !== "object") return;

  const nodeType = node.type ?? "unknown";

  // 检查禁止的节点类型（代码执行安全）
  if (nodeType === "mdxjsEsm") {
    issues.push({
      message: t("editor.validation.esmForbidden"),
      nodeType: "mdxjsEsm",
      severity: "error",
    });
  }

  // 检查链接和图片的 URL 协议
  if ((nodeType === "link" || nodeType === "image") && node.url) {
    if (node.url.includes(":")) {
      const proto = node.url.split(":")[0] + ":";
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
      walkTree(child, issues);
    }
  }
}

export function validateMDAST(root: WalkableNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  walkTree(root, issues);
  return issues;
}
