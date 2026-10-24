/**
 * i18n 词典平铺生成器
 *
 * 读取 src/lib/i18n/languages/{en,zh_CN}.ts（嵌套对象），用与运行时一致的
 * flatten 平铺成扁平 Record，写到 src/lib/i18n/generated/*.flat.ts。
 *
 * 目的：
 *  - 构建期完成 flatten，削掉每次加载/水合在客户端做的 flatten 递归 CPU；
 *  - 与 runtime flatten 共用同一实现（flatten.ts），保证键序/内容天然一致；
 *  - 产出的 *.flat.ts 由 astro.config manualChunks 切成 zh/en 独立 chunk，
 *    供 i18n 按当前 locale 按需加载（默认 zh-CN 同步、en 异步）。
 *
 * 用 esbuild（Astro/Vite 自带依赖）把带 extensionless import 的 dict .ts
 * 打包成 ESM，规避 Node 原生 type-stripping 对 extensionless 相对导入的限制。
 *
 * 用法：node scripts/generate-i18n-flat.mjs（已接入 prebuild，每次构建自动运行）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { globSync } from "tinyglobby";
// 用 prettier 格式化产物，保证与 check:prettier 一致（超长 value 需换行），
// 避免生成文件触发 CI 的 prettier 门禁。
import * as prettier from "prettier";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = path.join(ROOT, "src");
const LANGS_DIR = path.join(ROOT, "src", "lib", "i18n", "languages");
const OUT_DIR = path.join(ROOT, "src", "lib", "i18n", "generated");

/**
 * 客户端词典裁剪配置。
 *
 * 客户端只需要「渲染/交互时会被 t() 查询」的键；`page.*`、`blog.*` 之类只在
 * .astro frontmatter 里用到的键留在 SSR 全量词典里即可。裁剪规则：
 *  1. 扫描 .vue/.tsx/.ts/.js 与 .astro 的 <script> 块，收集源码里出现过的候选键；
 *  2. 保留动态拼接键的静态前缀（如 t(`editor.heading${level}`) → editor.heading）；
 *  3. 保留后端下发、源码里不会出现字面量的命名空间（CLIENT_FORCE_PREFIXES）。
 * 宁可多留不可漏：漏掉的键在客户端会直接显示成 key 本身（SSR 与客户端词典
 * 键集不一致还会造成水合时文本被替换）。
 */
const CLIENT_FORCE_PREFIXES = [
  // 后端 points API 返回 name_key/desc_key/title_key，前端直接 t(item.name_key)
  "contributionData.",
];

/** 键只由字母/数字/下划线/连字符和点组成；用 token 提取比逐键 includes 快一个数量级 */
const CLIENT_KEY_TOKEN_RE = /[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+/g;

const CLIENT_SCAN_IGNORE = [
  "**/i18n/languages/**",
  "**/i18n/generated/**",
  "**/__tests__/**",
  "**/*.test.*",
];

/** 收集客户端源码里出现过的键 token 与动态键前缀 */
function collectClientKeyUsage() {
  const sourceFiles = globSync(["**/*.{vue,tsx,ts,js,mjs}"], {
    cwd: SRC_DIR,
    ignore: CLIENT_SCAN_IGNORE,
  });
  const astroFiles = globSync(["**/*.astro"], {
    cwd: SRC_DIR,
    ignore: CLIENT_SCAN_IGNORE,
  });

  let source = "";
  for (const file of sourceFiles) {
    source += fs.readFileSync(path.join(SRC_DIR, file), "utf-8") + "\n";
  }
  // .astro 的 frontmatter 是纯 SSR，不参与裁剪；只有 <script> 块会进客户端包
  for (const file of astroFiles) {
    const content = fs.readFileSync(path.join(SRC_DIR, file), "utf-8");
    for (const match of content.matchAll(
      /<script[^>]*>([\s\S]*?)<\/script>/g,
    )) {
      source += (match[1] ?? "") + "\n";
    }
  }

  const dynamicPrefixes = new Set();
  // (?<![A-Za-z0-9_$]) 防止把 post(`...`)、format(`...`) 之类的普通函数调用当成 t()
  for (const match of source.matchAll(
    /(?<![A-Za-z0-9_$])t\(\s*`([^`$]*)\$\{/g,
  )) {
    const staticPart = match[1] ?? "";
    // 完全没有静态前缀（t(`${k}`)）无法推断键族，直接报错让人工登记，避免静默漏键
    if (!staticPart.trim()) {
      throw new Error(
        "[i18n-flat] 发现无静态前缀的动态翻译键 t(`${...}`)，无法推导客户端裁剪范围；请改为字面量或加进 CLIENT_FORCE_PREFIXES",
      );
    }
    dynamicPrefixes.add(staticPart);
  }

  // 字面量 t("…") 单独收一遍：token 正则要求至少一个点，遇到将来新增的
  // 顶层单词键（如 t("siteName")）也不会漏
  const literalKeys = new Set(
    [...source.matchAll(/(?<![A-Za-z0-9_$])t\(\s*["']([^"'\n]+)["']/g)].map(
      (match) => match[1],
    ),
  );

  const tokens = new Set(source.match(CLIENT_KEY_TOKEN_RE) ?? []);
  return { tokens, literalKeys, dynamicPrefixes };
}

/** 按 token / 动态前缀 / 强制前缀裁剪一份扁平词典 */
function pickClientFlat(flat, tokens, literalKeys, dynamicPrefixes) {
  const prefixes = [...dynamicPrefixes, ...CLIENT_FORCE_PREFIXES];
  const kept = Object.create(null);
  let dropped = 0;
  for (const key of Object.keys(flat)) {
    const keep =
      literalKeys.has(key) ||
      tokens.has(key) ||
      prefixes.some((prefix) => key.startsWith(prefix));
    if (keep) kept[key] = flat[key];
    else dropped += 1;
  }
  return { kept, dropped };
}

// 复用与运行时一致的 flatten / formatFlatTs（flatten.ts 纯 TS，无 extensionless import，可直 import）
const { flatten, formatFlatTs } = await import(
  "file://" +
    path.join(ROOT, "src", "lib", "i18n", "flatten.ts").replaceAll("\\", "/")
);

// 定位 esbuild JS API（pnpm 不提升，需在 .pnpm store 中查找 Astro/Vite 的 esbuild）
// pnpm 不提升 esbuild 到顶层，需在 .pnpm store 中查找 Astro/Vite 的 esbuild。
// 以 node_modules/.pnpm 为 cwd（ROOT 出发会被 .gitignore 的 node_modules/ 挡掉）。
const PNPM_DIR = path.join(ROOT, "node_modules", ".pnpm");
const esbuildCandidates = globSync("**/node_modules/esbuild/lib/main.js", {
  cwd: PNPM_DIR,
  onlyFiles: true,
  absolute: true,
});
if (esbuildCandidates.length === 0) {
  throw new Error(
    "[i18n-flat] 在 node_modules 中找不到 esbuild（Astro 应已带依赖）。",
  );
}
// store 里常因 peer/transitive 依赖存在多个 esbuild 副本，而字符串排序不等于版本排序
// （如 esbuild@0.9.0 会排在 esbuild@0.21.5 之后），故按 semver 数值取最高版本。
const versionOf = (p) =>
  (p.match(/esbuild@(\d+)\.(\d+)\.(\d+)/) ?? ["0", "0", "0", "0"])
    .slice(1)
    .map(Number);
const esbuildPath = esbuildCandidates
  .sort((a, b) => {
    const va = versionOf(a);
    const vb = versionOf(b);
    for (let i = 0; i < 3; i++) {
      if (va[i] !== vb[i]) return va[i] - vb[i];
    }
    return 0;
  })
  .at(-1);
const { build } = await import("file://" + esbuildPath.replaceAll("\\", "/"));

// 输出变量名（outVar）不能由文件名推导（zh_CN -> zhFlat），故显式登记
const LOCALES = [
  {
    source: "en.ts",
    varTs: "en",
    outVar: "enFlat",
    outFile: "en.flat.ts",
    clientVar: "enClientFlat",
    clientFile: "en.client.flat.ts",
  },
  {
    source: "zh_CN.ts",
    varTs: "zh_CN",
    outVar: "zhFlat",
    outFile: "zh_CN.flat.ts",
    clientVar: "zhClientFlat",
    clientFile: "zh_CN.client.flat.ts",
  },
];

// languages 目录是语言清单的事实来源：新增语言文件却忘了登记时直接报错，
// 否则该语言会静默不产出 flat 文件，运行时按需 import 的 chunk 直接 404
const uncovered = globSync("*.ts", { cwd: LANGS_DIR })
  .map((f) => path.basename(f))
  .filter((f) => !LOCALES.some((l) => l.source === f));
if (uncovered.length > 0) {
  throw new Error(
    `[i18n-flat] 以下语言文件未登记到 LOCALES，会静默不产出 flat 文件: ${uncovered.join(", ")}`,
  );
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// 客户端键集只依赖源码、与语言无关：只扫一遍，两个 locale 共用
const { tokens, literalKeys, dynamicPrefixes } = collectClientKeyUsage();
if (dynamicPrefixes.size > 0) {
  console.log(
    `[i18n-flat] 动态键前缀 ${dynamicPrefixes.size} 个: ${[...dynamicPrefixes].join(", ")}`,
  );
}

// 先全部生成完成再写盘：否则前一个 locale 已覆盖、后一个仍停在旧内容，
// generated 目录会处于半更新状态
const generated = [];
for (const loc of LOCALES) {
  try {
    const entry = path.join(LANGS_DIR, loc.source);
    const result = await build({
      entryPoints: [entry],
      bundle: true,
      format: "esm",
      platform: "neutral",
      logLevel: "silent",
      write: false,
    });
    const code = result.outputFiles[0].text;
    // data: URL 直接执行 esbuild 打出来的代码。前提是 languages/*.ts 都是本仓库受控的
    // 纯数据模块（无副作用）；若将来引入带副作用的 import 链，这里会以完整权限执行，
    // 届时应改成先落临时文件再 import。
    const mod = await import(
      "data:text/javascript;base64," + Buffer.from(code).toString("base64")
    );
    const dict = mod[loc.varTs];
    if (!dict || typeof dict !== "object") {
      throw new Error(`${loc.source} 未导出 \`${loc.varTs}\``);
    }
    const flat = flatten(dict);
    const fullTs = await prettier.format(formatFlatTs(loc.outVar, flat), {
      parser: "typescript",
      printWidth: 80,
    });

    const { kept, dropped } = pickClientFlat(
      flat,
      tokens,
      literalKeys,
      dynamicPrefixes,
    );
    // 客户端词典为空/几乎为空通常意味着扫描路径写错（例如 SRC_DIR 配错），
    // 这种“构建成功但线上全是 key”的故障必须在生成期暴露
    if (Object.keys(kept).length < 50) {
      throw new Error(
        `[i18n-flat] ${loc.source} 客户端词典仅 ${Object.keys(kept).length} 个键，疑似扫描失败，已中止`,
      );
    }
    const clientTs = await prettier.format(formatFlatTs(loc.clientVar, kept), {
      parser: "typescript",
      printWidth: 80,
    });

    generated.push({
      loc,
      fullTs,
      clientTs,
      keys: Object.keys(flat).length,
      clientKeys: Object.keys(kept).length,
      dropped,
    });
  } catch (err) {
    throw new Error(
      `[i18n-flat] ${loc.source} 生成失败: ${err?.message ?? err}`,
      { cause: err },
    );
  }
}

for (const { loc, fullTs, clientTs, keys, clientKeys, dropped } of generated) {
  fs.writeFileSync(path.join(OUT_DIR, loc.outFile), fullTs, "utf-8");
  fs.writeFileSync(path.join(OUT_DIR, loc.clientFile), clientTs, "utf-8");
  console.log(
    `[i18n-flat] ${loc.source} -> ${loc.outFile} (${keys} keys) + ${loc.clientFile} (${clientKeys} keys, 裁剪 ${dropped})`,
  );
}
