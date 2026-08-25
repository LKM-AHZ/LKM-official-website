import { describe, it, expect } from "vitest";
import { filterNavbarByNames } from "../navigation";
import type { NavBarLink } from "~/types/config";

const links: NavBarLink[] = [
  { name: "主页", url: "/" },
  {
    name: "七月团队",
    url: "/team",
    children: [{ name: "管理团队", url: "/team" }],
  },
  { name: "资源", url: "/forum" },
];

describe("filterNavbarByNames", () => {
  it("names 为 undefined 时原样返回", () => {
    expect(filterNavbarByNames(links, undefined)).toEqual(links);
  });

  it("按名称白名单过滤并保持顺序", () => {
    expect(filterNavbarByNames(links, ["资源", "主页"])).toEqual([
      { name: "主页", url: "/" },
      { name: "资源", url: "/forum" },
    ]);
  });

  it("空数组返回空列表", () => {
    expect(filterNavbarByNames(links, [])).toEqual([]);
  });

  it("未匹配的名称被忽略", () => {
    expect(filterNavbarByNames(links, ["主页", "不存在"])).toEqual([
      { name: "主页", url: "/" },
    ]);
  });
});
