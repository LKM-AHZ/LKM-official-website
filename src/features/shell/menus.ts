import type { NavBarLink } from "~/types/config";

/**
 * 顶栏默认一级菜单，供无显式 navItems 的布局兜底。
 * 值为菜单 name（即 i18n key），与 allMenuItems 中对应菜单的 name 匹配。
 */
export const officialDefaultNavItems: string[] = [
  "nav.home",
  "nav.community",
  "nav.projects",
  "nav.resources",
  "nav.moreApps",
  "nav.mine",
];

/**
 * 全站统一导航菜单池（原 config.yaml fuwari.navbar 与 fuwari.navbarCommunity 合并）。
 * 页面用 navItems 白名单（name，即 i18n key）从该池中挑选要显示的一级菜单。
 * 渲染层通过 t(name) 显示本地化文本。
 * 已扁平化：去掉 /official 与 /community 前缀。
 */
export const allMenuItems: NavBarLink[] = [
  {
    name: "nav.home",
    url: "/",
  },
  {
    name: "nav.community",
    url: "/forum",
    children: [
      { name: "nav.forum", url: "/forum" },
      { name: "nav.qa", url: "/qa" },
      { name: "nav.feedTimeline", url: "/timeline" },
    ],
  },
  {
    name: "nav.projects",
    url: "/projects",
  },
  {
    name: "nav.resources",
    url: "/files",
    children: [
      { name: "nav.fileLibrary", url: "/files" },
      { name: "nav.columns", url: "/search?type=columns" },
      { name: "nav.competition", url: "/competition" },
      { name: "nav.bank", url: "/competition/bank" },
    ],
  },
  {
    name: "nav.moreApps",
    url: "/apps",
    children: [
      { name: "nav.starHope", url: "/starhope" },
      { name: "nav.treehole", url: "/treehole" },
    ],
  },
  {
    name: "nav.mine",
    url: "/account",
    children: [
      { name: "nav.profile", url: "/account" },
      { name: "nav.follow", url: "/follow" },
      { name: "nav.contribution", url: "/contribution" },
    ],
  },
];
