import { describe, expect, it } from "vitest";
import { firstHeadingTitle } from "../../engine/mdx/heading-title";

describe("Markdown title extraction", () => {
  it("reads the first level-one heading after frontmatter", () => {
    expect(
      firstHeadingTitle("---\ntags: [test]\n---\n\n# 正确标题\n正文"),
    ).toBe("正确标题");
    expect(firstHeadingTitle("普通正文\n## 子标题")).toBe("");
  });
});
