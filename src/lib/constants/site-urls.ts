// The public homepage moved to the standalone static site. Keep one target for
// the site switch and the top navigation so they cannot drift apart.
export const OFFICIAL_SITE_URL =
  (import.meta.env.PUBLIC_OFFICIAL_SITE_URL as string | undefined)?.trim() ||
  "https://lkm-ahz.icu/";
