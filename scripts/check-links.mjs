#!/usr/bin/env node
/**
 * 内部链接检查脚本（server 模式）
 * 启动/复用 astro preview，验证关键页面的内部链接不失效。
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { withPreview } from "./lib/start-preview.mjs";

const STATIC_EXT = new Set([
  ".js",
  ".css",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".xml",
  ".gz",
  ".br",
  ".map",
  ".avif",
  ".gif",
  ".mp4",
  ".webm",
]);

const KEY_PAGES = [
  "/",
  "/blog/",
  "/login/",
  "/register/",
  // "/official/contact/",       // 页面尚未实现，暂时跳过检查
  // "/official/communities/",   // 页面尚未实现，暂时跳过检查
];
// 暂时把这面注释掉  清汉 2026/8/30

function extractPageHrefs(html) {
  const hrefs = [];
  const re = /href=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html))) {
    const val = m[1];
    if (!val) continue;
    if (/^(https?:|mailto:|tel:|javascript:|#)/.test(val)) continue;
    if (val.startsWith("/_astro/")) continue; // hashed assets

    const ext = val.split("?")[0].split("#")[0];
    if (STATIC_EXT.has(ext.slice(ext.lastIndexOf(".")))) continue;

    const clean = val.split("?")[0].split("#")[0];
    if (clean === "" || clean === "/") continue;
    hrefs.push(clean);
  }
  return hrefs;
}

async function main() {
  if (!existsSync(resolve(import.meta.dirname, "..", "dist"))) {
    console.error("ERROR: dist/ 目录不存在，请先运行 pnpm build");
    process.exit(1);
  }

  let errors = 0;
  let totalLinks = 0;

  await withPreview(async (base) => {
    for (const page of KEY_PAGES) {
      const res = await fetch(base + page);
      if (res.status >= 400) {
        console.error(`  FAIL: ${page} HTTP ${res.status}`);
        errors++;
        continue;
      }
      const html = await res.text();
      const hrefs = extractPageHrefs(html);

      for (const href of [...new Set(hrefs)]) {
        totalLinks++;
        const target = base + href;
        const checkRes = await fetch(target, { method: "HEAD" }).catch(
          () => null,
        );
        const ok = checkRes && checkRes.status < 400;
        if (!ok) {
          console.error(
            `  FAIL ${page}: "${href}" (HTTP ${checkRes?.status ?? "无响应"})`,
          );
          errors++;
        }
      }
    }
  });

  console.log(
    `\n链接检查完成 (${KEY_PAGES.length} 关键页面): ${totalLinks} 唯一链接, ${errors} 失效`,
  );
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
