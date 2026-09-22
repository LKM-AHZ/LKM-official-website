import type { NavBarLink } from "~/types/config";

/**
 * 官网默认顶栏一级菜单（原官方 navbar 的 4 项），供无显式 navItems 的布局兜底。
 * 值为菜单 name（即 i18n key），与 allMenuItems 中对应菜单的 name 匹配。
 */
export const officialDefaultNavItems: string[] = [
  "nav.home",
  "nav.community",
  "nav.resources",
];

// nav.community 与 nav.resources 共用的四个子项（名称/地址完全一致）。
// 抽成常量复用：否则新增站点时容易只改一处，两个菜单就悄悄漂移了。
const forumItem: NavBarLink = { name: "nav.forum", url: "/forum" };
const fileLibraryItem: NavBarLink = { name: "nav.fileLibrary", url: "/files" };
const qaItem: NavBarLink = { name: "nav.qa", url: "/qa" };
const competitionItem: NavBarLink = {
  name: "nav.competition",
  url: "/competition",
};

/**
 * 全站统一导航菜单池（原 config.yaml fuwari.navbar 与 fuwari.navbarCommunity 合并）。
 * 页面用 navItems 白名单（name，即 i18n key）从该池中挑选要显示的一级菜单。
 * 渲染层通过 t(name) 显示本地化文本。
 * 已扁平化：去掉 /official 与 /community 前缀；移除已迁到静态站的官方页（team/services/contact/pricing/funding/communities/project-team 等）。
 */
export const allMenuItems: NavBarLink[] = [
  {
    name: "nav.home",
    url: "/",
    children: [
      { name: "nav.intro", url: "/" },
      { name: "nav.teamMembers", url: "/#team" },
      { name: "nav.timeline", url: "/#timeline" },
      { name: "nav.recentUpdates", url: "/#update" },
      { name: "nav.faq", url: "/#faq" },
    ],
  },
  {
    name: "nav.community",
    url: "/forum",
    children: [forumItem, fileLibraryItem, qaItem, competitionItem],
  },
  {
    name: "nav.resources",
    url: "/forum",
    children: [
      forumItem,
      fileLibraryItem,
      qaItem,
      { name: "nav.projects", url: "/projects" },
      competitionItem,
      { name: "nav.moreApps", url: "/apps" },
    ],
  },
  {
    name: "nav.mine",
    url: "/account",
    children: [
      { name: "nav.profile", url: "/account" },
      { name: "nav.contribution", url: "/contribution" },
      { name: "nav.settings", url: "/account" },
    ],
  },
];
