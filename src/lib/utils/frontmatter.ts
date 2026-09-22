import getReadingTime from "reading-time";
import { toString } from "mdast-util-to-string";
import type { RehypePlugin, RemarkPlugin } from "@astrojs/markdown-remark";

export const readingTimeRemarkPlugin: RemarkPlugin = () => {
  return function (tree, file) {
    const textOnPage = toString(tree);
    const readingTime = Math.ceil(getReadingTime(textOnPage).minutes);

    if (typeof file?.data?.astro?.frontmatter !== "undefined") {
      file.data.astro.frontmatter.readingTime = readingTime;
    }
  };
};

export const responsiveTablesRehypePlugin: RehypePlugin = () => {
  return function (tree) {
    if (!tree.children) return;

    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i];

      if (child.type === "element" && child.tagName === "table") {
        tree.children[i] = {
          // 保留原节点的 position/data 等元数据：源码映射、错误定位与
          // Astro 的图片/标题后处理都依赖它们，手搓新节点会把这些信息丢掉
          ...child,
          type: "element",
          tagName: "div",
          properties: {
            style: "overflow:auto",
          },
          children: [child],
        };
        // 不要额外 i++：包装后的 div 已就位，跳过一位会漏处理紧跟表格的那个兄弟
        // （相邻两个表格时第二个不会被包装）
      }
    }
  };
};
