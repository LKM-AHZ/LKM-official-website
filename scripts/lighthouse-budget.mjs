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
 * 基线 delta（JS 体积）：把基准期的每页 JS 中位写入 scripts/jsbudget-baseline.json（提交 git），
 * 键名 jsKib，单位 KiB（gz），与 BUDGET.jsKb（env LIGHTHOUSE_JS_KB）同单位。
 * 归因时若某页 jsKib 较基线上涨超过 LIGHTHOUSE_JS_DELTA_PCT → 硬失败（拦回归），下降不管。
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

const PATHS = [
  "/",
  "/editor",
  // 如需纳入预算检查在此追加
];

// `/editor` 是已确认的接受项（编辑器固有重量）：整页仅告警，不计硬失败。
const WARNONLY_PAGES = new Set(["/editor"]);

function envNum(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

// 字节 → KiB（保留 1 位小数）。基线写入与运行时比较必须用同一个换算：
// 一边 0.1 KiB、一边整数 KiB 会让 delta 出现纯粹由舍入造成的假涨落
function toKiB(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

/** 三态标记：PASS / WARN（仅告警页）/ FAIL —— 避免每个指标都写一遍嵌套三元 */
function status(ok, warnOnly) {
  if (ok) return " PASS";
  return warnOnly ? " WARN" : " FAIL";
}

// 预算阈值（env 可覆盖）。硬/告警分层在 main 的分支里实现：
// LCP、Perf 只告警；CLS、TBT、JS 体积（含基线 delta）硬拦。
const BUDGET = {
  lcpMs: { value: envNum("LIGHTHOUSE_LCP_MS", 2500) },
  cls: { value: envNum("LIGHTHOUSE_CLS", 0.1) },
  tbtMs: { value: envNum("LIGHTHOUSE_TBT_MS", 200) },
  perf: { value: envNum("LIGHTHOUSE_PERF", 60) },
  // JS 绝对阈仅防「发布事故级」暴增（默认取大宽松值，覆盖 /editor 固有 2.6M+）；
  // 真正的 per-page JS 回归由基线 delta（JS_DELTA_PCT）承担。
  jsKb: { value: envNum("LIGHTHOUSE_JS_KB", 3500) },
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
  // 文件不存在 = 尚未立基线（正常，静默）；文件在但解析失败 = 门禁会被悄无声息地关掉，
  // 必须在 CI 日志里显式告警，否则 JS 回归保护会在最需要它的时刻失效
  if (!existsSync(BASELINE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(BASELINE_FILE, "utf-8"));
  } catch (err) {
    process.stdout.write(
      `::warning::lighthouse-budget 基线文件无法解析，本次 JS delta 门禁已跳过: ${BASELINE_FILE} (${err?.message ?? err})\n`,
    );
    return null;
  }
}

function saveBaseline(entries) {
  const baseline = { generatedAt: new Date().toISOString(), pages: {} };
  for (const { path, m } of entries) {
    baseline.pages[path] = {
      // 单位是 KiB（gz 后的中位值），键名写成 jsKib 以免被读成 Kb/MB
      jsKib: m.totalJsBytes != null ? toKiB(m.totalJsBytes) : null,
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
      process.stdout.write(`  ${p}: jsKib=${v.jsKib ?? "-"}\n`);
    }
    return;
  }

  const baseline = loadBaseline();

  let hardErrors = 0;
  // 指标缺失（Lighthouse 没产出该 audit，多为测量异常）与「真的超阈」必须分开计数：
  // 否则 triage 时只看得到 `CLS=- FAIL`，把 flaky 运行和真实回归混在一起
  let measureErrors = 0;
  const warnings = [];

  process.stdout.write(
    `Lighthouse 分层门禁（runs中位；硬:CLS/TBT/JS[+delta]；告警:LCP/Perf/编辑器）\n`,
  );

  for (const { path, m, pageRuns } of results) {
    const warnOnly = WARNONLY_PAGES.has(path);
    const flags = [];

    const lcpVal = m.lcp ?? null;
    const lcpOk = lcpVal != null && lcpVal < BUDGET.lcpMs.value;
    if (lcpVal == null) measureErrors++;
    else if (!lcpOk && !warnOnly) warnings.push(`${path} LCP=${lcpVal}ms`);
    flags.push(
      `LCP=${lcpVal ?? "-"}${lcpVal == null ? " N/A" : lcpOk ? " PASS" : " WARN"}`,
    );

    const clsVal = m.cls ?? null;
    const clsOk = clsVal != null && clsVal < BUDGET.cls.value;
    if (clsVal == null) measureErrors++;
    else if (!clsOk && !warnOnly) hardErrors++;
    flags.push(
      `CLS=${clsVal ?? "-"}${clsVal == null ? " N/A" : status(clsOk, warnOnly)}`,
    );

    const tbtVal = m.tbt ?? null;
    const tbtOk = tbtVal != null && tbtVal < BUDGET.tbtMs.value;
    if (tbtVal == null) measureErrors++;
    else if (!tbtOk && !warnOnly) hardErrors++;
    flags.push(
      `TBT=${tbtVal ?? "-"}ms${tbtVal == null ? " N/A" : status(tbtOk, warnOnly)}`,
    );

    const perfVal = m.perfScore ?? null;
    const perfOk = perfVal != null && perfVal >= BUDGET.perf.value;
    if (perfVal == null) measureErrors++;
    else if (!perfOk && !warnOnly) warnings.push(`${path} Perf=${perfVal}`);
    flags.push(
      `Perf=${perfVal ?? "-"}${perfVal == null ? " N/A" : perfOk ? " PASS" : " WARN"}`,
    );

    // per-page JS 体积（gz，KiB），硬阈值 + 基线 delta
    const jsVal = m.totalJsBytes != null ? toKiB(m.totalJsBytes) : null;
    const jsOk = jsVal != null && jsVal < BUDGET.jsKb.value;
    if (jsVal == null) {
      measureErrors++;
    } else if (!jsOk) {
      if (warnOnly) {
        warnings.push(`${path} JS=${jsVal}KiB`);
      } else {
        hardErrors++; // 绝对 JS 阈值是稳定信号，硬拦
      }
    }

    // 基线 delta（仅对硬拦截页；editor 也看 JS 体积回归——编辑器 JS 变大是真回归）
    let deltaWarn = "";
    let deltaFailed = false;
    if (jsVal != null && baseline?.pages?.[path]?.jsKib != null) {
      const baseKib = baseline.pages[path].jsKib;
      if (baseKib > 0) {
        const pct = ((jsVal - baseKib) / baseKib) * 100;
        if (pct > JS_DELTA_PCT) {
          // JS 体积回归：这是最稳定的真实信号，即便 editor 也应硬拦
          hardErrors++;
          deltaFailed = true;
          deltaWarn = ` ↑${pct.toFixed(0)}%>${JS_DELTA_PCT}%基线(${baseKib}KiB)`;
        } else {
          deltaWarn = ` (基线${baseKib}KiB±${pct.toFixed(0)}%)`;
        }
      }
    } else if (baseline == null) {
      deltaWarn = " (无基线,仅绝对阈)";
    }

    // delta 破线是硬拦截（warn-only 页也拦），状态必须显示 FAIL，
    // 否则 triage 时会看到「PASS/WARN」却拿到 exit 1。
    let jsFlag;
    if (deltaFailed) jsFlag = " FAIL";
    else if (jsVal == null) jsFlag = " N/A";
    else jsFlag = status(jsOk, warnOnly);
    flags.push(`JS=${jsVal ?? "-"}KiB${jsFlag}${deltaWarn}`);

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
  }
  if (measureErrors > 0) {
    process.stdout.write(
      `\n${measureErrors} 项指标缺失（Lighthouse 未产出该 audit，属测量异常而非超阈；按失败处理）\n`,
    );
  }
  if (hardErrors > 0 || measureErrors > 0) process.exit(1);
  process.stdout.write(`\n硬预算全部在阈值内（PASS；告警项请留意 LCP/Perf）\n`);
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
