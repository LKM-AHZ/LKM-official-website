import type { NavBarLink } from "~/types/config";
import { getPermalink } from "./utils/permalinks";

/** 按一级菜单名（name）白名单过滤顶栏链接；names 未传(undefined)时不过滤，原样返回；空数组会返回空列表。 */
export function filterNavbarByNames(
  links: NavBarLink[],
  names?: string[],
): NavBarLink[] {
  if (!names) return links;
  return links.filter((item) => names.includes(item.name));
}

/** 页脚数据结构（与 features/shell/components/Footer.astro 的 Props 对齐；显式标注才挡得住拼写错误） */
interface FooterLink {
  /** i18n key；社交图标那类只有 ariaLabel 的条目不带它 */
  text?: string;
  href: string;
  ariaLabel?: string;
  icon?: string;
}

interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

interface FooterData {
  links: FooterLinkGroup[];
  secondaryLinks: FooterLink[];
  socialLinks: FooterLink[];
  footNote: string;
}

export const footerData: FooterData = {
  links: [
    {
      title: "footer.community",
      links: [
        { text: "nav.forum", href: getPermalink("/forum") },
        { text: "nav.fileLibrary", href: getPermalink("/files") },
        { text: "nav.competition", href: getPermalink("/competition") },
      ],
    },
    {
      title: "footer.pages",
      links: [
        { text: "nav.projects", href: getPermalink("/projects") },
        { text: "nav.qa", href: getPermalink("/qa") },
      ],
    },
    {
      title: "footer.legal",
      links: [
        {
          text: "footer.privacyPolicy",
          href: getPermalink("/privacy"),
        },
        { text: "footer.terms", href: getPermalink("/terms") },
      ],
    },
  ],
  secondaryLinks: [
    { text: "footer.terms", href: getPermalink("/terms") },
    { text: "footer.privacyPolicy", href: getPermalink("/privacy") },
  ],
  socialLinks: [
    {
      ariaLabel: "Github",
      icon: "tabler:brand-github",
      href: "https://github.com/LKM-AHZ",
    },
    // 原 RSS 链接指向 /rss.xml，但本仓库既没有 public/rss.xml 也没有 pages/rss.xml.* 端点
    //（@astrojs/rss 只是依赖、从未 import），点了必然 404。等博客 API 提供 feed 后再恢复
  ],
  footNote: "footer.copyright",
};
