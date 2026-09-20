import { describe, it, expect } from "vitest";
import { buildAdminNav, isActive } from "../nav";

describe("admin nav", () => {
  it("含通用组与「机器人」组，后者带分组标题", () => {
    const groups = buildAdminNav();
    expect(groups.length).toBe(2);
    expect(groups[0].titleKey).toBeUndefined();
    expect(groups[1].titleKey).toBe("admin.sidebar.botGroup");
  });

  it("机器人组覆盖后台 8 个内嵌面板入口，且 href 全部唯一", () => {
    const botGroup = buildAdminNav()[1];
    expect(botGroup.items.length).toBe(8);
    const hrefs = botGroup.items.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    // 概览直接落在 /admin/bot（不是 /admin/bot/overview，面板 hash 才是 /welcome）
    expect(hrefs).toContain("/admin/bot");
  });

  it("全部菜单项都有 i18n key、逻辑路径与图标", () => {
    buildAdminNav()
      .flatMap((group) => group.items)
      .forEach((item) => {
        expect(item.textKey).toMatch(/^admin\.sidebar\./);
        expect(item.href).toMatch(/^\/admin/);
        expect(item.icon).toMatch(/^tabler:/);
      });
  });

  it("isActive：仪表盘精确匹配，其余按自身或子路径匹配", () => {
    // /admin 若不精确匹配，/admin/users 会把仪表盘一起点亮
    expect(isActive("/admin", "/admin")).toBe(true);
    expect(isActive("/admin/users", "/admin")).toBe(false);
    expect(isActive("/admin/users/", "/admin/users")).toBe(true);
    expect(isActive("/admin/bot", "/admin/bot")).toBe(true);
    // 面板子页仍属「机器人概览」之外：/admin/bot 只精确匹配
    expect(isActive("/admin/bot/platforms", "/admin/bot")).toBe(false);
    expect(isActive("/admin/bot/platforms", "/admin/bot/platforms")).toBe(true);
    // 带 locale 前缀的路径由调用方先 getPermalink 再比较，此处只做字符串语义
    expect(isActive("/admin/posts", "/admin/users")).toBe(false);
  });

  it("机器人组各项在对应路径上互斥点亮", () => {
    const items = buildAdminNav()[1].items;
    const lit = items.filter((item) =>
      isActive("/admin/bot/config", item.href),
    );
    expect(lit.map((item) => item.href)).toEqual(["/admin/bot/config"]);
  });
});
