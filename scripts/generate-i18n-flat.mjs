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
const LANGS_DIR = path.join(ROOT, "src", "lib", "i18n", "languages");
const OUT_DIR = path.join(ROOT, "src", "lib", "i18n", "generated");

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
  { source: "en.ts", varTs: "en", outVar: "enFlat", outFile: "en.flat.ts" },
  {
    source: "zh_CN.ts",
    varTs: "zh_CN",
    outVar: "zhFlat",
    outFile: "zh_CN.flat.ts",
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
    const rawTs = formatFlatTs(loc.outVar, flat);
    const tsCode = await prettier.format(rawTs, {
      parser: "typescript",
      printWidth: 80,
    });
    generated.push({ loc, tsCode, keys: Object.keys(flat).length });
  } catch (err) {
    throw new Error(
      `[i18n-flat] ${loc.source} 生成失败: ${err?.message ?? err}`,
      { cause: err },
    );
  }
}

for (const { loc, tsCode, keys } of generated) {
  fs.writeFileSync(path.join(OUT_DIR, loc.outFile), tsCode, "utf-8");
  console.log(`[i18n-flat] ${loc.source} -> ${loc.outFile} (${keys} keys)`);
}
