import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  // sitemap 由 @astrojs/sitemap 输出在「站点根 + base」下：必须把 BASE_URL 拼进路径，
  // 只以 SITE 解析会得到站点根的 /sitemap-index.xml（子路径部署时 404）。
  // 解析放在 GET 内而非模块顶层：SITE 缺失/为空时 new URL 会抛错，
  // 模块顶层求值发生在导入期，Node standalone 下会让整个服务起不来（而不只是 /robots.txt 出错）。
  let sitemapLine = "";
  try {
    const basePath = import.meta.env.BASE_URL.replace(/^\/+/, "").replace(
      /\/?$/,
      "/",
    );
    const sitemapUrl = new URL(
      `${basePath}sitemap-index.xml`,
      new URL(import.meta.env.SITE).origin,
    ).href;
    sitemapLine = `\n\nSitemap: ${sitemapUrl}`;
  } catch {
    console.warn("[robots.txt] SITE 未配置或非法，本次响应省略 Sitemap 行");
  }

  const robotsTxt = `
User-agent: *
Disallow: /_astro/${sitemapLine}
`.trim();

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // 内容是构建期常量（随进程序不变），但仍走 SSR 逐个请求渲染：
      // 给个短缓存，避免爬虫每次命中都重新执行这条路由
      "Cache-Control": "public, max-age=3600",
    },
  });
};
