import { describe, it, expect } from "vitest";
import { allMenuItems } from "../menus";

describe("menus", () => {
  it("统一菜单池含 4 个一级项（news/help/blog 已并入论坛入口 nav.community）", () => {
    expect(allMenuItems.length).toBe(4);
  });

  it("一级 name 全部唯一（主页与社区主页已区分）", () => {
    const names = allMenuItems.map((item) => item.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("每个一级项都有 url 与 children", () => {
    allMenuItems.forEach((item) => {
      expect(item.url).toBeTruthy();
      expect(Array.isArray(item.children)).toBe(true);
    });
  });

  it("nav.community 是唯一内容入口（/forum）", () => {
    const community = allMenuItems.find(
      (item) => item.name === "nav.community",
    );
    expect(community).toBeTruthy();
    expect(community!.url).toBe("/forum");
  });

  it("内容区（news/help/blog）已不在顶级菜单", () => {
    const names = allMenuItems.map((item) => item.name);
    expect(names).not.toContain("nav.news");
    expect(names).not.toContain("nav.help");
    expect(names).not.toContain("nav.blog");
  });
});
