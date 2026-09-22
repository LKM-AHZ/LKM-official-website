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

// 关键路径页（已删的 /official/*、/blog 旧路由不再列入；新增页面按需追加）
const KEY_PAGES = ["/", "/login/", "/register/"];

function extractPageHrefs(html) {
  const hrefs = [];
  const re = /href=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html))) {
    const val = m[1];
    if (!val) continue;
    if (/^(https?:|mailto:|tel:|javascript:|#)/.test(val)) continue;
    // 协议相对地址（//cdn.example.com/x）会被拼成 http://127.0.0.1:PORT//cdn... 而误报失效
    if (val.startsWith("//")) continue;
    if (val.startsWith("/_astro/")) continue; // hashed assets

    // 去掉 query/hash 后只解析一次；扩展名要求点在最后一段路径里（`/a.b/page` 不该被当成 .b）
    const path = val.split("?")[0].split("#")[0];
    const dot = path.lastIndexOf(".");
    const ext = dot > path.lastIndexOf("/") ? path.slice(dot) : "";
    if (STATIC_EXT.has(ext)) continue;

    if (path === "" || path === "/") continue;
    hrefs.push(path);
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

      // 去重只在本页内做：同一个 href 在不同页面上会解析成不同目标（相对链接），
      // 跨页去重会漏掉后一页的失效目标。因此下面的计数是「检查次数」而非「唯一链接数」。
      for (const href of [...new Set(hrefs)]) {
        totalLinks++;
        // 相对链接（about/、./x）必须相对当前页面解析，直接 base+href 会拼出坏 URL 误报
        const target = new URL(href, base + page).href;
        let checkRes = await fetch(target, { method: "HEAD" }).catch(
          () => null,
        );
        // 少数处理器不接受 HEAD 会回 405，此时用 GET 复核，避免把存在的页面报成失效
        // （重定向无需特殊处理：fetch 默认 follow，最终状态码已落在 checkRes 上）
        if (checkRes?.status === 405) {
          checkRes = await fetch(target).catch(() => null);
        }
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
    `\n链接检查完成 (${KEY_PAGES.length} 关键页面): ${totalLinks} 次链接检查, ${errors} 失效`,
  );
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
