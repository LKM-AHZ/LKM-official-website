/**
 * 本地图标生成器：Astro include 与 Vue/React 客户端 SVG 集合
 *
 * 扫描 .astro / .ts / .yaml / .json 中 tabler / material-symbols 图标，
 * 生成 src/lib/icons/astro-include.ts 供 astro-icon include 精确引用，
 * 客户端另收集 .vue / .tsx 的引用，避免全量打包与运行时在线加载。
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
import { createRequire } from "node:module";
import { glob } from "tinyglobby";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = path.join(ROOT, "src");
const ICONS_DIR = path.join(ROOT, "src", "lib", "icons");
const INCLUDE_FILE = path.join(ICONS_DIR, "astro-include.ts");
const CLIENT_FILE = path.join(ICONS_DIR, "client-icons.json");
// React 编辑器单独一份：EditorToolbar 只 import 它，主站页面不必为编辑器图标付费
const CLIENT_REACT_FILE = path.join(ICONS_DIR, "client-icons-react.json");
const require = createRequire(import.meta.url);

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
async function collectIcons(patterns, extraIgnore = []) {
  const files = await glob(patterns, {
    cwd: SRC_DIR,
    ignore: ["**/__tests__/**", "**/*.test.*", ...extraIgnore],
  });
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

  // 客户端组件也使用本地 SVG，避免离线或 CSP 限制时功能按钮只剩空白。
  // 按框架拆成两份：Vue 主站（.vue + 编辑器目录之外的 .ts）与 React 编辑器
  // （features/editor 下的 .ts/.tsx）。编辑器工具栏的独立图标因此不再随每个页面下发。
  const vueClientIcons = await collectIcons(
    ["**/*.vue", "**/*.ts"],
    ["features/editor/**"],
  );
  const reactClientIcons = await collectIcons([
    "features/editor/**/*.{ts,tsx}",
  ]);
  writeClientIcons(CLIENT_FILE, vueClientIcons, "client-icons.json");
  writeClientIcons(
    CLIENT_REACT_FILE,
    reactClientIcons,
    "client-icons-react.json",
  );
}

/**
 * 把 iconMap 写成 @iconify/vue / @iconify/react 可直接 addCollection 的 JSON。
 * 抽成函数是因为 Vue / React 两份集合除了文件路径与日志标签之外完全同构。
 */
function writeClientIcons(file, iconMap, label) {
  const collections = [...iconMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([prefix, names]) => {
      const source = require(`@iconify-json/${prefix}/icons.json`);
      const icons = Object.fromEntries(
        [...names].sort().map((name) => {
          if (!source.icons[name])
            throw new Error(`图标不存在：${prefix}:${name}`);
          return [name, source.icons[name]];
        }),
      );
      return { prefix, width: source.width, height: source.height, icons };
    });
  if (collections.length === 0) {
    throw new Error(`[icons] ${label} 为空：扫描 glob 可能失效`);
  }
  const content = JSON.stringify(collections, null, 2) + "\n";
  const previous = fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : null;
  if (previous !== content) fs.writeFileSync(file, content);
  console.log(
    `[icons] ${label}: ${collections.reduce((sum, c) => sum + Object.keys(c.icons).length, 0)} 图标`,
  );
}

main().catch((err) => {
  console.error("[icons] 生成失败:", err);
  process.exit(1);
});
