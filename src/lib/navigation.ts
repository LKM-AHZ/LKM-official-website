import type { NavBarLink } from "~/types/config";
import { getPermalink, getAsset } from "./utils/permalinks";

/** 按一级菜单名（name）白名单过滤顶栏链接；names 未传(undefined)时不过滤，原样返回；空数组会返回空列表。 */
export function filterNavbarByNames(
  links: NavBarLink[],
  names?: string[],
): NavBarLink[] {
  if (!names) return links;
  return links.filter((item) => names.includes(item.name));
}

export const footerData = {
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
    { ariaLabel: "RSS", icon: "tabler:rss", href: getAsset("/rss.xml") },
  ],
  footNote: "footer.copyright",
};
