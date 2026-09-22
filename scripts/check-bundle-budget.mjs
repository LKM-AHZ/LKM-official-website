#!/usr/bin/env node
/**
 * JS Bundle Budget 检查
 *
 * 唯一硬门禁：dist/client/_astro 下全部 JS 的 gz 总量 2000 KiB（超限 exit 1）。
 * 单 chunk 180 KiB 只是参考线（打 WARN、不阻断，超大 chunk 交架构优化处理）。
 * 历史计划里的按页预算（首页 180 / 博客 160 / 编辑器 450 / 其他 220）本脚本并未实现，
 * 不要误以为它们在这里生效。
 * 检查 dist/client/_astro/ 下的 .js.gz。
 */
import { readdirSync, statSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";

const DIST = resolve(import.meta.dirname, "..", "dist", "client");

const MAX_CHUNK_KIB = 180; // 单 chunk 参考线（仅 WARN）
const MAX_TOTAL_KIB = 2000; // gz 总量硬门禁

function walkDir(dir, pattern) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkDir(full, pattern));
    } else if (pattern.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

function main() {
  if (!existsSync(DIST)) {
    console.error(`ERROR: 构建产物目录不存在: ${DIST}（先跑 pnpm run build）`);
    process.exit(1);
  }

  const astroDir = resolve(DIST, "_astro");
  if (!existsSync(astroDir)) {
    console.log(`PASS: 无 _astro 目录（${astroDir}）`);
    process.exit(0);
  }

  const jsGzFiles = walkDir(astroDir, /\.js\.gz$/);
  if (jsGzFiles.length === 0) {
    console.log("PASS: 无 JS gz 文件");
    process.exit(0);
  }

  const sizes = jsGzFiles.map((f) => ({
    name: relative(astroDir, f).replace(/\\/g, "/").replace(/\.gz$/, ""),
    size: statSync(f).size,
  }));

  sizes.sort((a, b) => b.size - a.size);

  let errors = 0;
  let totalSize = sizes.reduce((s, f) => s + f.size, 0);

  console.log(`\nJS Bundle Budget (共 ${sizes.length} 个 JS)`);
  console.log(
    `  单个 chunk 上限: ${MAX_CHUNK_KIB} KiB  |  总量上限: ${MAX_TOTAL_KIB} KiB\n`,
  );

  // 明细只打前 10 个，但超线统计必须覆盖全部 chunk，否则第 11 大的超限 chunk 会被漏报
  const overChunks = sizes.filter((f) => f.size > MAX_CHUNK_KIB * 1024);
  for (const { name, size } of sizes.slice(0, 10)) {
    const kib = (size / 1024).toFixed(1);
    const over = size > MAX_CHUNK_KIB * 1024;
    const mark = over ? "WARN" : " OK ";
    // 超大 chunk 不在预算检查阶段阻断，由阶段4架构优化处理
    console.log(`  ${mark}  ${kib.padStart(7)} KiB  ${name}`);
  }
  if (overChunks.length > 0) {
    console.log(
      `  （共 ${overChunks.length} 个 chunk 超过 ${MAX_CHUNK_KIB} KiB 参考线，仅提示不阻断）`,
    );
  }

  const totalKib = (totalSize / 1024).toFixed(1);
  const overTotal = totalSize > MAX_TOTAL_KIB * 1024;
  console.log(
    `\n  总计: ${totalKib} KiB / ${MAX_TOTAL_KIB} KiB  ${overTotal ? "FAIL" : "OK"}`,
  );
  if (overTotal) errors++;

  if (errors > 0) {
    console.log(`\n${errors} 预算超限（需在阶段4架构优化中处理）`);
    process.exit(1);
  }

  console.log("\n所有 bundle 在预算内");
}

main();
