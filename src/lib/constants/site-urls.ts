// The homepage "前往官网" button leads to the standalone static site.
export const OFFICIAL_SITE_URL =
  (import.meta.env.PUBLIC_OFFICIAL_SITE_URL as string | undefined)?.trim() ||
  "https://lkm-ahz.icu/";
