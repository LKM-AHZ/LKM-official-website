import { describe, it, expect } from "vitest";
import { safeUrl, escapeMarkdownUrl } from "../url-safety";

describe("safeUrl 放行合法 URL", () => {
  // 回归用例：SAFE_SCHEMES 曾误加结尾 `$`，导致只匹配「裸 scheme 字符串」，
  // 于是所有真实 URL 都被降级成 "#" —— 导出 HTML 里的链接与图片会全部消失。
  it.each([
    "https://example.com/a",
    "http://example.com",
    "https://example.com/a?b=c#d",
    "mailto:a@b.c",
    "tel:+8613800000000",
  ])("原样返回 %s", (url) => {
    expect(safeUrl(url)).toBe(url);
  });

  it("相对路径与锚点照常放行", () => {
    expect(safeUrl("/rel/path")).toBe("/rel/path");
    expect(safeUrl("#anchor")).toBe("#anchor");
  });
});

describe("safeUrl 拦截伪协议", () => {
  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>x</script>",
    "vbscript:msgbox",
    // 形似但非白名单 scheme，不能被前缀匹配误放行
    "httpsx:evil",
    "httpx:evil",
  ])("降级为 # ：%s", (url) => {
    expect(safeUrl(url)).toBe("#");
  });

  it("剔除控制字符后再判定，避免 `java\\tscript:` 绕过", () => {
    expect(safeUrl("java\tscript:alert(1)")).toBe("#");
  });

  it("空值降级为 #", () => {
    expect(safeUrl("")).toBe("#");
    expect(safeUrl(null)).toBe("#");
    expect(safeUrl(undefined)).toBe("#");
  });
});

describe("escapeMarkdownUrl", () => {
  it("括号与空白需转义，避免提前闭合 ](...)", () => {
    expect(escapeMarkdownUrl("https://x.com/a(b)")).toBe(
      "https://x.com/a\\(b\\)",
    );
    expect(escapeMarkdownUrl("https://x.com/a b")).toBe("https://x.com/a%20b");
  });

  it("伪协议降级为 #", () => {
    expect(escapeMarkdownUrl("javascript:alert(1)")).toBe("#");
  });
});
