// biome-ignore lint/suspicious/noShadowRestrictedNames: <toString from mdast-util-to-string>
import { toString } from "mdast-util-to-string";

/* 使用文章的第一个段落作为摘要 */
export function remarkExcerpt() {
  return (tree, { data }) => {
    let excerpt = "";
    for (const node of tree.children) {
      if (node.type !== "paragraph") {
        continue;
      }
      excerpt = toString(node).trim();
      break;
    }
    // 只有真抽到内容才写：纯标题/列表文档、或首段是空/纯图片时，
    // 无条件赋值会把作者在 frontmatter 里写的 excerpt 覆盖成空串。
    // data.astro 只在 Astro 的 markdown 管线里存在，非 Astro 场景要能优雅降级
    if (excerpt && data?.astro?.frontmatter) {
      data.astro.frontmatter.excerpt = excerpt;
    }
  };
}
