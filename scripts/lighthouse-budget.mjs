#!/usr/bin/env node
/**
 * Lighthouse 预算门槛脚本（模块 0 · CI，2026-08-20 完善为「分层 + JS 体积 delta」）。
 *
 * 对关键路径页跑 Lighthouse，对照 CWV 预算阈值判定达标。
 *
 * 分层判定（无后端降级的 SSR 下 LCP/TBT 绝对值不可靠，故分级）：
 *  - 硬指标（超阈 → exit(1) 拦截）：CLS、TBT、per-page JS 体积、JS delta 回归。
 *    JS 体积（totalJsBytes gz）是稳定真实的回归信号，主用硬拦截。
 *  - 告警指标（超阈 → ::warning:: 输出，不 exit、不红）：LCP、Perf 得分；
 *    `/editor` 为公认接受项（编辑器固有重量），整页走告警档。
 *
 * 基线 delta（JS 体积）：把基准期的每页 JS 中位写入 scripts/jsbudget-baseline.json（提交 git）。
 * 归因时若某页 jsKb 较基线上涨超过 LIGHTHOUSE_JS_DELTA_PCT → 硬失败（拦回归），下降不管。
 *
 * 阈值（env 可覆盖）：
 *   LIGHTHOUSE_LCP_MS / LIGHTHOUSE_CLS / LIGHTHOUSE_TBT_MS / LIGHTHOUSE_PERF
 *   LIGHTHOUSE_JS_KB        per-page JS 绝对硬阈（KiB gz）
 *   LIGHTHOUSE_JS_DELTA_PCT JS 较基线上涨百分比的硬阈（默认 8）
 *
 * 用法：
 *   node scripts/lighthouse-budget.mjs                        # 默认 runs=1
 *   node scripts/lighthouse-budget.mjs --runs=3               # 每页 3 次取中位（CI 用）
 *   node scripts/lighthouse-budget.mjs --runs-per-path=/editor:2  # 仅指定页多测，其余 single
 *   node scripts/lighthouse-budget.mjs --update-baseline      # 用本次中位刷新基线文件
 */
import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { withPreview } from "./lib/start-preview.mjs";
import { measureLighthouse, medianMetrics } from "./lib/lighthouse-run.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const BASELINE_FILE = resolve(SCRIPT_DIR, "jsbudget-baseline.json");

const PATHS = ["/", "/blog", "/editor", /* "/community/treehole" 暂未就绪，跳过检查 */ "/community"];
// 原文为 const PATHS = ["/", "/blog", "/editor", "/community/treehole", "/community"];

// `/editor` 是已确认的接受项（编辑器固有重量）：整页仅告警，不计硬失败。
const WARNONLY_PAGES = new Set(["/editor"]);

function envNum(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

// 预算阈值（env 可覆盖）。hard=false 的指标超阈只告警，不进硬失败。
const BUDGET = {
  lcpMs: {
    value: envNum("LIGHTHOUSE_LCP_MS", 2500),
    hard: false,
    label: "LCP(ms)",
  },
  cls: { value: envNum("LIGHTHOUSE_CLS", 0.1), hard: true, label: "CLS" },
  tbtMs: {
    value: envNum("LIGHTHOUSE_TBT_MS", 200),
    hard: true,
    label: "TBT(ms)",
  },
  perf: { value: envNum("LIGHTHOUSE_PERF", 60), hard: false, label: "Perf" },
  // JS 绝对阈仅防「发布事故级」暴增（默认取大宽松值，覆盖 /editor 固有 2.6M+）；
  // 真正的 per-page JS 回归由基线 delta（JS_DELTA_PCT）承担。
  jsKb: {
    value: envNum("LIGHTHOUSE_JS_KB", 3500),
    hard: true,
    label: "JS(KiB)",
  },
};

const JS_DELTA_PCT = envNum("LIGHTHOUSE_JS_DELTA_PCT", 8);

function parseFlags() {
  const { values } = parseArgs({
    options: {
      runs: { type: "string", default: "1" },
      "runs-per-path": { type: "string" },
      "update-baseline": { type: "boolean", default: false },
    },
  });
  const runsPerPath = {};
  if (values["runs-per-path"]) {
    for (const pair of String(values["runs-per-path"]).split(",")) {
      const [p, n] = pair.split(":");
      if (p) runsPerPath[p] = Math.max(1, parseInt(n, 10) || 1);
    }
  }
  return {
    runs: Math.max(1, parseInt(values.runs ?? "1", 10) || 1),
    runsPerPath,
    updateBaseline: !!values["update-baseline"],
  };
}

function loadBaseline() {
  if (!existsSync(BASELINE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(BASELINE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function saveBaseline(entries) {
  const baseline = { generatedAt: new Date().toISOString(), pages: {} };
  for (const { path, m } of entries) {
    baseline.pages[path] = {
      jsKb:
        m.totalJsBytes != null
          ? Math.round((m.totalJsBytes / 1024) * 10) / 10
          : null,
    };
  }
  writeFileSync(
    BASELINE_FILE,
    JSON.stringify(baseline, null, 2) + "\n",
    "utf-8",
  );
  return baseline;
}

async function main() {
  const { runs, runsPerPath, updateBaseline } = parseFlags();

  const results = await withPreview(async (base) => {
    // 逐页串行跑（Lighthouse 13 共享全局 performance.mark，同进程并发会触发
    // "start lh:computed:* performance mark has not been set" 竞态，故不并发）。
    const out = [];
    for (const p of PATHS) {
      const pageRuns = runsPerPath[p] ?? runs;
      const url = `${base}${p}`;
      const { runs: raw } = await measureLighthouse(url, { runs: pageRuns });
      out.push({ path: p, m: medianMetrics(raw), pageRuns });
    }
    return out;
  });

  if (updateBaseline) {
    const baseline = saveBaseline(results);
    process.stdout.write(`基线已更新 -> ${BASELINE_FILE}\n`);
    for (const [p, v] of Object.entries(baseline.pages)) {
      process.stdout.write(`  ${p}: jsKb=${v.jsKb ?? "-"}\n`);
    }
    return;
  }

  const baseline = loadBaseline();

  let hardErrors = 0;
  const warnings = [];

  process.stdout.write(
    `Lighthouse 分层门禁（runs中位；硬:CLS/TBT/JS[+delta]；告警:LCP/Perf/编辑器）\n`,
  );

  for (const { path, m, pageRuns } of results) {
    const warnOnly = WARNONLY_PAGES.has(path);
    const flags = [];

    const lcpVal = m.lcp ?? null;
    const lcpOk = lcpVal != null && lcpVal < BUDGET.lcpMs.value;
    if (!lcpOk) {
      if (!warnOnly) warnings.push(`${path} LCP=${lcpVal}ms`);
    }
    flags.push(`LCP=${lcpVal ?? "-"}${lcpOk ? " PASS" : " WARN"}`);

    const clsVal = m.cls ?? null;
    const clsOk = clsVal != null && clsVal < BUDGET.cls.value;
    if (!clsOk && !warnOnly) hardErrors++;
    flags.push(
      `CLS=${clsVal ?? "-"}${clsOk ? " PASS" : warnOnly ? " WARN" : " FAIL"}`,
    );

    const tbtVal = m.tbt ?? null;
    const tbtOk = tbtVal != null && tbtVal < BUDGET.tbtMs.value;
    if (!tbtOk && !warnOnly) hardErrors++;
    flags.push(
      `TBT=${tbtVal ?? "-"}ms${tbtOk ? " PASS" : warnOnly ? " WARN" : " FAIL"}`,
    );

    const perfVal = m.perfScore ?? null;
    const perfOk = perfVal != null && perfVal >= BUDGET.perf.value;
    if (!perfOk && !warnOnly) warnings.push(`${path} Perf=${perfVal}`);
    flags.push(`Perf=${perfVal ?? "-"}${perfOk ? " PASS" : " WARN"}`);

    // per-page JS 体积（gz），硬阈值 + 基线 delta
    const jsVal =
      m.totalJsBytes != null ? Math.round(m.totalJsBytes / 1024) : null;
    let jsOk = jsVal != null && jsVal < BUDGET.jsKb.value;
    if (!jsOk) {
      if (warnOnly) {
        warnings.push(`${path} JS=${jsVal}KiB`);
      } else {
        hardErrors++; // 绝对 JS 阈值是稳定信号，硬拦
      }
    }

    // 基线 delta（仅对硬拦截页；editor 也看 JS 体积回归——编辑器 JS 变大是真回归）
    let deltaWarn = "";
    if (jsVal != null && baseline?.pages?.[path]?.jsKb != null) {
      const baseKib = baseline.pages[path].jsKb;
      if (baseKib > 0) {
        const pct = ((jsVal - baseKib) / baseKib) * 100;
        if (pct > JS_DELTA_PCT) {
          // JS 体积回归：这是最稳定的真实信号，即便 editor 也应硬拦
          hardErrors++;
          deltaWarn = ` ↑${pct.toFixed(0)}%>${JS_DELTA_PCT}%基线(${baseKib}KiB)`;
        } else {
          deltaWarn = ` (基线${baseKib}KiB±${pct.toFixed(0)}%)`;
        }
      }
    } else if (baseline == null) {
      deltaWarn = " (无基线,仅绝对阈)";
    }

    flags.push(
      `JS=${jsVal ?? "-"}KiB${jsOk ? " PASS" : warnOnly ? " WARN" : " FAIL"}${deltaWarn}`,
    );

    process.stdout.write(
      `  [${path}]${warnOnly ? " [warn-only]" : ""} runs=${pageRuns} | ${flags.join(" | ")}\n`,
    );
  }

  // 告警输出为 GHA 可见（::warning:: 不阻塞，前缀才在 Actions 里高亮）
  for (const w of warnings) {
    process.stdout.write(`::warning::lighthouse-budget ${w}\n`);
  }

  if (hardErrors > 0) {
    process.stdout.write(`\n${hardErrors} 项硬预算超限（FAIL，CI 拦截）\n`);
    process.exit(1);
  }
  process.stdout.write(`\n硬预算全部在阈值内（PASS；告警项请留意 LCP/Perf）\n`);
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
