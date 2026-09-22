/**
 * 编辑器的 MDX 导出转 HTML 预处理器（官方文章页专用）。
 *
 * 背景：编辑器把 Callout/Figure 导出为**自闭合 JSX 空元素**：
 *   `<Callout type="warning" />`、`<Figure src alt caption width align />`
 * 但官方文章页用 `createMarkdownProcessor()`（markdown 处理），不解析 MDX JSX，
 * 会把 `<Callout/>`/`<Figure/>` 当成**未闭合的 HTML 容器标签**，嵌套吞掉后续正文，
 * 导致结构损坏。因此需在喂给 processor 之前，把这两类自闭合标签转成闭合良好的
 * `.lkm-*` HTML（类名与全站共享 Callout/Figure 样式一致，见 main.css）。
 *
 * 只处理编辑器导出的自闭合空元素形态。
 */

const CALLOUT_ICONS = {
  info: "ℹ",
  warning: "⚠",
  error: "✕",
  success: "✓",
};
const CALLOUT_LABELS = {
  info: "信息",
  warning: "警告",
  error: "错误",
  success: "成功",
};
/** Figure 对齐白名单（同时用作 CSS 类后缀，不能直接采信编辑器传来的值） */
const FIGURE_ALIGNS = ["left", "center", "right"];

/**
 * HTML 转义。编辑器导出的属性值属不可信输入，直接插值可突破标签/属性边界注入标记。
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 属性串片段：引号内的 `>` 属于属性值（编辑器直接插值用户输入的 title/caption，
 * 如 `title="5 > 3"`），不能当成标签结束；引号外的 `>` 仍终止匹配，避免吞掉后续正文。
 */
const ATTR_CHUNK = String.raw`(?:[^>"']|"[^"]*"|'[^']*')*?`;
/** 自闭合 Callout：`<Callout attrs />`（无属性写成 `<Callout />` 同样命中） */
const CALLOUT_SELF = new RegExp(
  String.raw`<Callout(?:\s+(${ATTR_CHUNK}))?\s*\/>`,
  "g",
);
/** 自闭合 Figure：`<Figure attrs />` */
const FIGURE_SELF = new RegExp(
  String.raw`<Figure(?:\s+(${ATTR_CHUNK}))?\s*\/>`,
  "g",
);

/**
 * 代码区域（围栏代码块 / 行内代码）：里面的 `<Callout/>` 是示例文本，改写后会被
 * markdown 当作真 HTML 解析，导致示例内容变形或消失，故跳过。
 */
const CODE_REGION = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g;

/**
 * 把 content 中 `<Callout ... />` / `<Figure ... />` 转为 .lkm-* HTML。
 * @param {string} md - 编辑器导出的 MDX 原文
 * @returns {string} 转换后可被 markdown processor 正确解析的内容
 */
export function preprocessEditorMdx(md) {
  return md
    .split(CODE_REGION)
    .map((segment, index) =>
      // 捕获组 split 后，代码区域落在奇数下标
      index % 2 === 1 ? segment : transformTags(segment),
    )
    .join("");
}

/** 只改写正文片段（代码区域之外的 `<Callout ... />` / `<Figure ... />`） */
function transformTags(md) {
  return md
    .replace(CALLOUT_SELF, (_match, attrsStr = "") => {
      // type 同时用作 CSS 类后缀与文案查表键：收敛到白名单，未知值一律按 info 处理
      const rawType = parseAttr(attrsStr, "type");
      const type = Object.prototype.hasOwnProperty.call(CALLOUT_LABELS, rawType)
        ? rawType
        : "info";
      const title = parseAttr(attrsStr, "title");
      const body = title
        ? `<h4>${escapeHtml(title)}</h4>`
        : `<p>${escapeHtml(CALLOUT_LABELS[type])}</p>`;
      return (
        `<div class="lkm-callout lkm-callout-${type}">` +
        `<span class="lkm-callout-icon">${CALLOUT_ICONS[type]}</span>` +
        `<div class="lkm-callout-body">${body}</div>` +
        `</div>`
      );
    })
    .replace(FIGURE_SELF, (_match, attrsStr = "") => {
      const rawAlign = parseAttr(attrsStr, "align");
      const align = FIGURE_ALIGNS.includes(rawAlign) ? rawAlign : "center";
      const src = parseAttr(attrsStr, "src");
      const caption = parseAttr(attrsStr, "caption");
      const rawWidth = parseAttr(attrsStr, "width");
      // width 进入 style 属性，只接受纯数值，避免注入额外声明
      const width = /^\d+(\.\d+)?$/.test(rawWidth) ? rawWidth : "";
      const widthAttr = width ? ` style="width:${width}px"` : "";
      const img = src
        ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(parseAttr(attrsStr, "alt"))}"${widthAttr} />`
        : `<span class="lkm-figure-placeholder">暂无图片</span>`;
      const captionHtml = caption
        ? `<figcaption class="lkm-figure-caption">${escapeHtml(caption)}</figcaption>`
        : "";
      return `<figure class="lkm-figure lkm-figure-${align}">${img}${captionHtml}</figure>`;
    });
}

/**
 * 从 JSX 属性串中取单个属性值，如取 type：`type="warning" title="x"` -> 'warning'。
 * @param {string} attrsStr
 * @param {string} name
 * @returns {string} 属性值（不存在返回 ''）
 */
function parseAttr(attrsStr, name) {
  // 属性名要求前面是串首或空白：`\b` 会把 `data-type="x"` 里的 type 也匹配上。
  // 值支持 "x" / 'x' / {400}（JSX 表达式，编辑器对数字属性会这么写）/ 裸值（width=400）
  const re = new RegExp(
    `(?:^|\\s)${name}=(?:"([^"]*)"|'([^']*)'|\\{(\\d+(?:\\.\\d+)?)\\}|([^\\s"'>]+))`,
  );
  const m = re.exec(attrsStr);
  if (!m) return "";
  // 引号三种取值方式 + {数值} + 裸值，按组序取第一个命中的
  return m[1] ?? m[2] ?? m[3] ?? m[4] ?? "";
}

export default preprocessEditorMdx;
