// The "官网" switch leads to the standalone static site. The local "/" route
// remains the community portal homepage.
export const OFFICIAL_SITE_URL =
  (import.meta.env.PUBLIC_OFFICIAL_SITE_URL as string | undefined)?.trim() ||
  "https://lkm-ahz.icu/";
