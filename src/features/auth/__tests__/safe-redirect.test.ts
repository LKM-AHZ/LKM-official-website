import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveSafeRedirect } from "../utils/safe-redirect";

beforeEach(() => {
  delete (globalThis as { window?: unknown }).window;
});
afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("resolveSafeRedirect", () => {
  it("接受 base 下站内相对路径", () => {
    expect(resolveSafeRedirect("/LKM-official-website/account")).toBe(
      "/LKM-official-website/account",
    );
  });
  it("拒绝外部协议", () => {
    expect(resolveSafeRedirect("https://evil.com")).toBe("/");
  });
  it("拒绝协议相对与反斜杠", () => {
    expect(resolveSafeRedirect("//evil.com")).toBe("/");
    expect(resolveSafeRedirect("\\evil")).toBe("/");
  });
  it("拒绝经归一化才暴露的站外跳转（反斜杠 / 制表符）", () => {
    // 浏览器把 `\` 与制表符折叠后就是 `//evil.com`
    expect(resolveSafeRedirect("/\\evil.com")).toBe("/");
    expect(resolveSafeRedirect("/\t/evil.com")).toBe("/");
    expect(resolveSafeRedirect("/\n/evil.com")).toBe("/");
  });
  it("保留路径中间的空格", () => {
    expect(resolveSafeRedirect("/a b/c")).toBe("/a b/c");
  });
  it("null/空串回退首页", () => {
    expect(resolveSafeRedirect(null)).toBe("/");
    expect(resolveSafeRedirect("")).toBe("/");
  });
  it("未定义 base 时回退根路径", () => {
    expect(resolveSafeRedirect("/foo")).toBe("/foo");
  });
});
