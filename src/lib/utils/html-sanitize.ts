import sanitizeHtml from "sanitize-html";

/**
 * 统一的内容 HTML 消毒配置：允许常用富文本标签，外加 img 及必要属性。
 * 所有渲染后端返回 HTML 内容的入口都必须经过本函数，防止 XSS。
 */
export function sanitizeHtmlContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      // rel 必须放行：库默认只给 a 放 href/name/target，配上 target="_blank" 会丢掉
      // noopener，形成反向 tabnabbing。用扩展而不是原地改默认数组，避免污染库的 defaults
      a: [...(sanitizeHtml.defaults.allowedAttributes.a ?? []), "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
    },
    // 用户/GPT 生成的内容里只允许 https 图片、禁止协议相对 URL：
    // 否则 `//tracker.example/p.gif` 这类可以当追踪像素、泄露读者 IP
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
  });
}
