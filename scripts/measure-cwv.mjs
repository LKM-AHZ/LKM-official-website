#!/usr/bin/env node
/**
 * 本地 Core Web Vitals 测量脚本（计划模块 0）。
 * 启动 Astro preview（复用 start-preview.mjs 的 withPreview），对关键路径页
 * 跑 Lighthouse 实验室审计，输出各页 CWV / TBT / 性能得分的对照表。
 *
 * 用法：
 *   node scripts/measure-cwv.mjs
 *   node scripts/measure-cwv.mjs --urls=/blog,/editor
 *   node scripts/measure-cwv.mjs --urls=/blog --runs=3
 *   node scripts/measure-cwv.mjs --json          # 输出 JSON（供 CI/脚本消费）
 *
 * 指标说明：
 *   LCP/CLS/TTI/SI 由 Lighthouse 实验室直接给出（LCP 属 CWV）。
 *   INP 是 field metric，实验室用 total-blocking-time（TBT）作交互响应性代理；
 *   真实 INP 由 Sentry RUM / CrUX 的 field 数据提供（见模块 0 RUM 部分）。
 */
import { parseArgs } from "node:util";
import { withPreview } from "./lib/start-preview.mjs";
import { measureLighthouse, medianMetrics } from "./lib/lighthouse-run.mjs";

// 计划定义的关键路径页（index / 博客 / 编辑器 / 树洞 / 论坛）
// 注：树洞真实路由为 /treehole
const DEFAULT_PATHS = ["/", "/editor", "/treehole"];

function parseFlags() {
  const { values } = parseArgs({
    options: {
      urls: { type: "string" },
      runs: { type: "string", default: "1" },
      json: { type: "boolean", default: false },
    },
  });
  const runs = Math.max(1, parseInt(values.runs ?? "1", 10) || 1);
  const paths = values.urls
    ? String(values.urls)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : DEFAULT_PATHS;
  return { runs, paths, json: !!values.json };
}

function rowFor(m) {
  return {
    LCP_ms: m.lcp,
    CLS: m.cls,
    TBT_ms: m.tbt,
    TTI_ms: m.tti,
    SI_ms: m.si,
    Perf_score: m.perfScore,
    JS_KiB: m.totalJsBytes != null ? Math.round(m.totalJsBytes / 1024) : null,
  };
}

async function main() {
  const { runs, paths, json } = parseFlags();

  const all = await withPreview(async (base) => {
    const out = [];
    for (const p of paths) {
      const url = `${base}${p.startsWith("/") ? p : `/${p}`}`;
      process.stdout.write(`  测量 ${url} (runs=${runs}) ...\n`);
      const { runs: raw } = await measureLighthouse(url, { runs });
      const med = medianMetrics(raw);
      out.push({ path: p, ...rowFor(med) });
    }
    return out;
  });

  if (json) {
    process.stdout.write(`${JSON.stringify(all, null, 2)}\n`);
    return;
  }

  // Markdown 表格
  const h = [
    "页面",
    "LCP(ms)",
    "CLS",
    "TBT(ms)",
    "TTI(ms)",
    "SI(ms)",
    "Perf分",
    "JS(KiB)",
  ];
  process.stdout.write(
    `\n## Core Web Vitals 基线（Lighthouse lab, runs=${runs}）\n\n`,
  );
  process.stdout.write(`| ${h.join(" | ")} |\n`);
  process.stdout.write(`|${h.map(() => "---").join("|")}|\n`);
  for (const r of all) {
    const cells = [
      r.path,
      r.LCP_ms ?? "-",
      r.CLS ?? "-",
      r.TBT_ms ?? "-",
      r.TTI_ms ?? "-",
      r.SI_ms ?? "-",
      r.Perf_score ?? "-",
      r.JS_KiB ?? "-",
    ];
    process.stdout.write(`| ${cells.join(" | ")} |\n`);
  }
  process.stdout.write(
    `\n注：INP 为 field metric，实验室以 TBT 作响应性代理；真实 INP 见 Sentry RUM。\n`,
  );
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
