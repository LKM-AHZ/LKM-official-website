/**
 * 后台侧边栏导航定义（与渲染解耦，便于单测）。
 *
 * 背景：菜单原先在 `AdminLayout.astro` 里逐个硬编码 `<a>`，既无分组也无当前项高亮；
 * 「机器人」分组（bot 面板并入社区后台）要求分组标题 + 激活态，故抽成数据 + 纯函数。
 *
 * 约定：`href` 是**去掉 site.base 的逻辑路径**（如 `/admin/users`）；`getPermalink()` 只拼接
 * `SITE.base` 与尾斜杠，**不加 locale 前缀**——本项目 locale 由 Cookie（`lkm-locale`）驱动，
 * URL 里没有 `/en`、`/zh-CN` 段。`isActive` 的前提是两侧同为这种逻辑路径；`textKey` 是 i18n key
 * （`t()` 支持点号嵌套）。`isActive` 只做字符串比较，故可脱离 Astro 单测。
 */

export interface AdminNavItem {
  /** i18n key（`admin.sidebar.*`）。 */
  textKey: string;
  /** 逻辑路径（不含 locale 前缀）。 */
  href: string;
  /** astro-icon 名称（tabler 图标集）。 */
  icon: string;
}

export interface AdminNavGroup {
  /** 分组标题的 i18n key；缺省表示无标题的默认分组。 */
  titleKey?: string;
  items: AdminNavItem[];
}

/** 后台侧边栏（按分组顺序渲染）。 */
export function buildAdminNav(): AdminNavGroup[] {
  return [
    {
      items: [
        {
          textKey: "admin.sidebar.dashboard",
          href: "/admin",
          icon: "tabler:dashboard",
        },
        {
          textKey: "admin.sidebar.users",
          href: "/admin/users",
          icon: "tabler:users",
        },
        {
          textKey: "admin.sidebar.posts",
          href: "/admin/posts",
          icon: "tabler:article",
        },
        {
          textKey: "admin.sidebar.files",
          href: "/admin/files",
          icon: "tabler:folder",
        },
        {
          textKey: "admin.sidebar.categories",
          href: "/admin/categories",
          icon: "tabler:category",
        },
        {
          textKey: "admin.sidebar.reports",
          href: "/admin/reports",
          icon: "tabler:flag",
        },
        {
          textKey: "admin.sidebar.moderation",
          href: "/admin/moderation",
          icon: "tabler:shield-check",
        },
        {
          textKey: "admin.sidebar.dlq",
          href: "/admin/dlq",
          icon: "tabler:tools",
        },
      ],
    },
    {
      // 机器人（LKMBot 面板）：每项对应后台内嵌面板的一个页面（同源 iframe）。
      // 面板自身的侧边栏仍可跳到其余页面（会话、人格、定时任务等），故此处只放常用入口。
      titleKey: "admin.sidebar.botGroup",
      items: [
        {
          textKey: "admin.sidebar.bot.overview",
          href: "/admin/bot",
          icon: "tabler:robot",
        },
        {
          textKey: "admin.sidebar.bot.platforms",
          href: "/admin/bot/platforms",
          icon: "tabler:plug-connected",
        },
        {
          textKey: "admin.sidebar.bot.providers",
          href: "/admin/bot/providers",
          icon: "tabler:brain",
        },
        {
          textKey: "admin.sidebar.bot.config",
          href: "/admin/bot/config",
          icon: "tabler:adjustments",
        },
        {
          textKey: "admin.sidebar.bot.extensions",
          href: "/admin/bot/extensions",
          icon: "tabler:puzzle",
        },
        {
          textKey: "admin.sidebar.bot.knowledge",
          href: "/admin/bot/knowledge",
          icon: "tabler:book",
        },
        {
          textKey: "admin.sidebar.bot.logs",
          href: "/admin/bot/logs",
          icon: "tabler:file-text",
        },
        {
          textKey: "admin.sidebar.bot.settings",
          href: "/admin/bot/settings",
          icon: "tabler:settings",
        },
      ],
    },
  ];
}

/** 去掉 query/hash 与尾斜杠（保留根路径 `/`），用于激活态比较。 */
function normalize(path: string): string {
  // 只去尾斜杠时，一旦调用方传进 `/admin/users?page=2` 这类带查询串的 URL 就永远不匹配，
  // 高亮会静默丢失（当前调用方传的是 pathname，故暂未暴露）
  const pathname = path.split(/[?#]/, 1)[0];
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

/**
 * 当前路径是否就是该菜单项。
 *
 * 用**精确匹配**而非前缀匹配：菜单项都是叶子页面，且 `/admin/bot` 与 `/admin/bot/platforms`
 * 是并列的两项——前缀匹配会让概览在任意子页同时点亮（`/admin` 与 `/admin/users` 同理）。
 */
export function isActive(currentPath: string, itemHref: string): boolean {
  return normalize(currentPath) === normalize(itemHref);
}
