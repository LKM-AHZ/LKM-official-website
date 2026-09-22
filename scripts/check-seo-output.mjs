#!/usr/bin/env node
/**
 * SEO 检查脚本（server 模式）
 * 启动/复用 astro preview，对关键页面与产物做基本 SEO 检查。
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { withPreview } from "./lib/start-preview.mjs";

const DIST = resolve(import.meta.dirname, "..", "dist", "client");

function contains(pattern, content) {
  if (pattern instanceof RegExp) {
    // 带 g/y 标志的正则 test() 会推进 lastIndex，复用同一个正则时第二次起会漏检
    pattern.lastIndex = 0;
    return pattern.test(content);
  }
  return content.includes(pattern);
}

async function checkPage(base, path, checks) {
  let res;
  try {
    res = await fetch(base + path);
  } catch (err) {
    // 网络抖动不应该让整个检查中断、丢掉后续页面
    console.error(`  FAIL ${path}: 请求失败 (${err?.message ?? err})`);
    return 1;
  }
  if (res.status >= 400) {
    console.error(`  FAIL ${path}: HTTP ${res.status}`);
    return 1;
  }
  const content = await res.text();
  let errors = 0;
  for (const [label, pattern] of Object.entries(checks)) {
    if (!contains(pattern, content)) {
      console.error(`  FAIL ${path}: 缺少 ${label}`);
      errors++;
    }
  }
  return errors;
}

async function main() {
  // 只存在 dist/ 而缺 dist/client（或反之）时，后面的 fetch/sitemap 读取会报出无关错误，
  // 这里直接检查真正被消费的那份产物
  if (!existsSync(DIST)) {
    console.error(`ERROR: ${DIST} 不存在，请先运行 pnpm build`);
    process.exit(1);
  }

  let errors = 0;
  await withPreview(async (base) => {
    errors += await checkPage(base, "/", {
      "<title>": /<title>[^<]+<\/title>/,
      canonical: /rel="canonical"/,
      "meta description": /name="description"/,
      "<h1>": /<h1[^>]*>/,
      "<main>": /<main[^>]*>/,
    });

    // robots.txt：区分「取不到（网络/非 2xx）」与「取到了但没有 Sitemap 声明」，
    // 否则 HTTP 状态被吞掉，排查时分不清是路由 404 还是内容缺指令
    const robotsRes = await fetch(base + "/robots.txt").catch(() => null);
    if (!robotsRes?.ok) {
      console.error(
        `  FAIL: robots.txt 无法访问 (HTTP ${robotsRes?.status ?? "无响应"})`,
      );
      errors++;
    } else {
      const robotsContent = await robotsRes.text();
      // 大小写不敏感地匹配「指令行」而不是裸 includes("sitemap")——后者会把注释或 URL 里的
      // sitemap 字样也算通过（robots 指令名大小写不敏感，SITEMAP: 同样合法）
      if (!/^\s*sitemap\s*:/im.test(robotsContent)) {
        console.error("  FAIL: robots.txt 缺少 Sitemap 声明");
        errors++;
      }
    }

    // sitemap 静态产物
    const sitemapFile = resolve(DIST, "sitemap-index.xml");
    if (!existsSync(sitemapFile)) {
      console.error("  FAIL: 缺少 sitemap-index.xml");
      errors++;
    } else {
      const sitemapRaw = readFileSync(sitemapFile, "utf-8");
      const urls = [...sitemapRaw.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
        (m) => m[1],
      );
      // 空 sitemap（或 build 配置坏掉）不能算通过，否则这一步是静默空转
      if (urls.length === 0) {
        console.error("  FAIL: sitemap-index.xml 中解析不到任何 <loc> 条目");
        errors++;
      } else {
        console.log(`  Sitemap 包含 ${urls.length} 个条目`);
      }
    }
  });

  console.log(`\nSEO 检查完成: ${errors} 错误`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
