import { describe, it, expect } from "vitest";
import { allMenuItems } from "../menus";
import { OFFICIAL_SITE_URL } from "~/lib/constants/site-urls";

describe("menus", () => {
  it("统一菜单池含 4 个一级项（news/help/blog 已并入论坛入口 nav.community）", () => {
    expect(allMenuItems.length).toBe(4);
  });

  it("一级 name 全部唯一（主页与社区主页已区分）", () => {
    const names = allMenuItems.map((item) => item.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("站内一级项有子菜单，官网入口直达独立站点", () => {
    allMenuItems.forEach((item) => {
      expect(item.url).toBeTruthy();
      if (item.name !== "nav.home") {
        expect(Array.isArray(item.children)).toBe(true);
      }
    });
    const home = allMenuItems.find((item) => item.name === "nav.home");
    expect(home).toMatchObject({ url: OFFICIAL_SITE_URL, external: true });
    expect(home?.children).toBeUndefined();
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
