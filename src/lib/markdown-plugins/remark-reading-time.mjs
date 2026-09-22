// biome-ignore lint/suspicious/noShadowRestrictedNames: <toString from mdast-util-to-string>
import { toString } from "mdast-util-to-string";
import getReadingTime from "reading-time";

export function remarkReadingTime() {
  return (tree, { data }) => {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    // data.astro 只在 Astro 的 markdown 管线里存在：非 Astro 场景（单测/别的消费方）
    // 直接取 frontmatter 会抛 TypeError 打断整个 markdown 构建
    const frontmatter = data?.astro?.frontmatter;
    if (!frontmatter) return;
    frontmatter.minutes = Math.max(1, Math.round(readingTime.minutes));
    frontmatter.words = readingTime.words;
  };
}
