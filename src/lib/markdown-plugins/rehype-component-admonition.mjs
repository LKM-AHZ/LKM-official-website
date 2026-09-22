/// <reference types="mdast" />
import { h } from "hastscript";

/** 允许的 admonition 类型：与 astro.config.ts 注册的 rehypeComponents 一致 */
const ALLOWED_TYPES = ["tip", "note", "important", "caution", "warning"];

/**
 * Creates an admonition component.
 *
 * 参数顺序即签名顺序（properties, children, type）；astro.config.ts 用
 * `Parameters<typeof AdmonitionComponent>` 反推调用方类型，故 JSDoc 必须与实现一致。
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} [properties.title] - An optional title.
 * @param {import('hast').RootContent[]} children - The children elements of the component.
 * @param {('tip'|'note'|'important'|'caution'|'warning')} type - The admonition type.
 * @returns {import('hast').Element} The created admonition element.
 */
export function AdmonitionComponent(properties, children, type) {
  if (!Array.isArray(children) || children.length === 0)
    return h(
      "div",
      { class: "hidden" },
      'Invalid admonition directive. (Admonition directives must be of block type ":::note{name="name"} <content> :::")',
    );

  // type 会进 class 名与标题文案：白名单收敛，避免漏传时产出 `bdm-undefined` +
  // `type.toUpperCase()` 抛错，也避免任意字符串变成额外的 class token
  const safeType = ALLOWED_TYPES.includes(type) ? type : "note";

  // 有 directive label 时首个子节点是标题：浅拷贝后再改 tagName，
  // 直接改 children[0].tagName 会污染调用方传入的（可能与别处共享的）节点
  const hasLabel = Boolean(properties?.["has-directive-label"]);
  const label = hasLabel ? { ...children[0], tagName: "div" } : null;
  const body = hasLabel ? children.slice(1) : children;

  return h("blockquote", { class: `admonition bdm-${safeType}` }, [
    h("span", { class: "bdm-title" }, label ? label : safeType.toUpperCase()),
    ...body,
  ]);
}
