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

/**
 * 探测 GraphQL 后端是否可达。
 * 只要端口在监听，即使返回 400/405 也算可达；ECONNREFUSED / DNS 失败才算不在。
 * 地址与 [graphql] 的回退规则保持一致：未配 API_URL 时用 localhost:8000/graphql。
 * 为了方便过CI，这里采取两种方案：
 * 在 check-links.mjs 里加一个探测函数并修改const ok判定
 * 在 CI workflow 里给真后端：加 service container，在 job 的 env: 里注入指向预发环境的 API_UR
 * 2026/9/28   清汉
 */
async function backendReachable() {
  const url = process.env.API_URL || "http://localhost:8000/graphql";
  try {
    await fetch(url, { method: "GET" });
    return true;
  } catch {
    return false;
  }
}

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
  let degraded = 0;

  // 后端不可用时，5xx 属于「环境降级」而非「链接失效」，只警告不判失败；
  // 后端可达（CI 注入了 API_URL）时恢复严格判定，5xx 一样算失败。
  // 也可用 LINK_CHECK_ALLOW_5XX=1 强制降级，用于本地无后端时的临时排查。
  const backendUp = await backendReachable();
  const allow5xx = !backendUp || process.env.LINK_CHECK_ALLOW_5XX === "1";
  if (!backendUp) {
    console.warn(
      "  WARN: 未探测到 GraphQL 后端，5xx 将视为环境降级（4xx 仍严格判定为失效）",
    );
  }

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

        const status = checkRes?.status ?? 0;
        const label = status === 0 ? "无响应" : `HTTP ${status}`;

        if (status >= 400 && status < 500) {
          // 真死链：路由不存在，任何环境都该失败
          console.error(`  FAIL ${page}: "${href}" (${label})`);
          errors++;
        } else if (status >= 500 || status === 0) {
          // 服务端错误：后端不在时属环境降级，后端在时是真故障
          if (allow5xx) {
            console.warn(
              `  WARN ${page}: "${href}" (${label}) — 后端不可用，非链接失效`,
            );
            degraded++;
          } else {
            console.error(`  FAIL ${page}: "${href}" (${label})`);
            errors++;
          }
        }
      }
    }
  });

  console.log(
    `\n链接检查完成 (${KEY_PAGES.length} 关键页面): ${totalLinks} 次链接检查, ${errors} 失效, ${degraded} 后端降级`,
  );
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
