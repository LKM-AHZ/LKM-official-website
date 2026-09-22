/**
 * astro-icon include 生成器
 *
 * 扫描 .astro / .ts / .yaml / .json 中 tabler / material-symbols 图标，
 * 生成 src/lib/icons/astro-include.ts 供 astro-icon include 精确引用，
 * 避免 `'*'` 全量打包（6214 个图标）。
 *
 * 约束：图标名必须写成字面量（`tabler:user`）。本脚本用正则提取引用，
 * 由变量/拼接构造的名字（如 `tabler:${name}`）会被静默漏掉；而 astro.config.ts 用
 * include 精确控制打包，漏掉的图标运行时既不报错也没有 fallback，只是渲染不出来。
 *
 * 用法：node scripts/generate-icons.mjs（已接入 prebuild，每次构建自动运行）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "tinyglobby";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = path.join(ROOT, "src");
const ICONS_DIR = path.join(ROOT, "src", "lib", "icons");
const INCLUDE_FILE = path.join(ICONS_DIR, "astro-include.ts");

// 扫描用图标前缀（对应本地 @iconify-json 包；astro-icon 运行时仅读这些本地资源）
const PREFIX_SET = new Set([
  "tabler",
  "material-symbols",
  "fa6-brands",
  "fa6-regular",
  "fa6-solid",
  "flat-color-icons",
]);

// 实际写进 astro-include.ts 的前缀。fa6-* / flat-color-icons 的清单在
// astro.config.ts 的 icon({ include }) 里手工维护（那份才决定打包哪些图标），
// 本脚本收集到的这部分会被丢弃——两个集合显式分开，避免误以为「加进 PREFIX_SET 就生效」
const EMIT_PREFIX_SET = new Set(["tabler", "material-symbols"]);

const PREFIX_RE = new RegExp(
  `\\b(${[...PREFIX_SET].join("|")}):[a-z0-9-]+`,
  "g",
);

/** 收集一组文件中的图标引用：prefix -> Set<name> */
async function collectIcons(patterns) {
  const files = await glob(patterns, { cwd: SRC_DIR });
  const collected = new Map();
  for (const file of files) {
    const content = fs.readFileSync(path.join(SRC_DIR, file), "utf-8");
    for (const match of content.match(PREFIX_RE) ?? []) {
      const idx = match.indexOf(":");
      const prefix = match.slice(0, idx);
      const name = match.slice(idx + 1);
      if (!collected.has(prefix)) collected.set(prefix, new Set());
      collected.get(prefix).add(name);
    }
  }
  return collected;
}

async function main() {
  fs.mkdirSync(ICONS_DIR, { recursive: true });

  // astro include：.astro 组件 + data（astro-icon 渲染的 tabler / material-symbols）
  const astroIcons = await collectIcons(["**/*.astro"]);
  const dataIcons = await collectIcons([
    "**/*.ts",
    "**/*.yaml",
    "**/*.yml",
    "**/*.json",
  ]);
  const astroMap = new Map();
  for (const map of [astroIcons, dataIcons]) {
    for (const [prefix, names] of map) {
      if (!EMIT_PREFIX_SET.has(prefix)) continue;
      if (!astroMap.has(prefix)) astroMap.set(prefix, new Set());
      for (const n of names) astroMap.get(prefix).add(n);
    }
  }

  const includeLines = [];
  includeLines.push(
    "/* 本文件由 scripts/generate-icons.mjs 自动生成，请勿手动修改 */",
  );
  includeLines.push(
    "export const astroIconInclude: Record<string, string[]> = {",
  );
  // prefix 也要排序：否则输出顺序取决于 tinyglobby 的遍历顺序，同一份输入在不同机器上
  // 会生成不同顺序的文件，造成无意义 diff 与缓存失效
  const sortedPrefixes = [...astroMap.keys()].sort((a, b) =>
    a.localeCompare(b),
  );
  for (const prefix of sortedPrefixes) {
    const names = astroMap.get(prefix);
    includeLines.push(
      `  '${prefix}': [${[...names]
        .sort()
        .map((n) => `'${n}'`)
        .join(", ")}],`,
    );
  }
  includeLines.push("};");
  includeLines.push("");
  // 内容没变就不写：无条件 writeFileSync 会刷新 mtime，让 Vite/Astro 的依赖图与 HMR 无谓失效
  const nextContent = includeLines.join("\n");
  const prevContent = fs.existsSync(INCLUDE_FILE)
    ? fs.readFileSync(INCLUDE_FILE, "utf-8")
    : null;
  if (prevContent !== nextContent) {
    fs.writeFileSync(INCLUDE_FILE, nextContent, "utf-8");
  }
  const incTotal = [...astroMap.values()].reduce((acc, s) => acc + s.size, 0);

  console.log(`[icons] astro-include.ts: ${incTotal} 图标`);
}

main().catch((err) => {
  console.error("[icons] 生成失败:", err);
  process.exit(1);
});
