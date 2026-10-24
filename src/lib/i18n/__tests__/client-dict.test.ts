import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { globSync } from "tinyglobby";
import { describe, expect, it } from "vitest";
import { enClientFlat } from "../generated/en.client.flat";
import { zhClientFlat } from "../generated/zh_CN.client.flat";
import { zhFlat } from "../generated/zh_CN.flat";

// 文件位于 src/lib/i18n/__tests__/，向上三层即 src/
const SRC_DIR = fileURLToPath(new URL("../../../", import.meta.url));

/**
 * 客户端词典（*.client.flat）是按源码引用裁剪出来的：
 * SSR 全量 3434 键，客户端只保留 .vue/.tsx/.ts 与 .astro <script> 真正引用的键。
 * 裁剪一旦漏键，线上表现是「界面直接显示 key」并伴随水合文本不一致，很难在构建期发现，
 * 因此这里把生成器的三条裁剪规则固化成回归测试：
 *  1. 字面量 t("…") 必须命中；
 *  2. 动态 t(`prefix${…}`) 的整个键族必须完整保留；
 *  3. 后端下发的键族（contributionData.*）必须完整保留。
 */
const CLIENT_SOURCE = (() => {
  const files = globSync(["**/*.{vue,tsx,ts}"], {
    cwd: SRC_DIR,
    ignore: [
      "**/__tests__/**",
      "**/*.test.*",
      "**/i18n/languages/**",
      "**/i18n/generated/**",
    ],
  });
  return files
    .map((file) => fs.readFileSync(path.join(SRC_DIR, file), "utf-8"))
    .join("\n");
})();

describe("客户端 i18n 词典裁剪", () => {
  it("包含客户端代码里所有字面量 t() 键", () => {
    const keys = [
      ...CLIENT_SOURCE.matchAll(/(?<![A-Za-z0-9_$])t\(\s*["']([^"'\n]+)["']/g),
    ].map((match) => match[1]);
    const missing = [...new Set(keys)].filter(
      (key) => key.includes(".") && !(key in zhClientFlat),
    );
    expect(missing).toEqual([]);
  });

  it("动态拼接键的键族在客户端词典里完整保留", () => {
    const prefixes = [
      ...CLIENT_SOURCE.matchAll(/(?<![A-Za-z0-9_$])t\(\s*`([^`$]*)\$\{/g),
    ].map((match) => match[1]);
    expect(prefixes.length).toBeGreaterThan(0);

    for (const prefix of new Set(prefixes)) {
      const full = Object.keys(zhFlat).filter((k) => k.startsWith(prefix));
      const client = Object.keys(zhClientFlat).filter((k) =>
        k.startsWith(prefix),
      );
      expect(
        full.length,
        `前缀 ${prefix} 在完整词典中没有对应键`,
      ).toBeGreaterThan(0);
      expect(client.length, `前缀 ${prefix} 的键族被裁剪了`).toBe(full.length);
    }
  });

  it("后端下发的 contributionData.* 键完整保留", () => {
    const full = Object.keys(zhFlat).filter((k) =>
      k.startsWith("contributionData."),
    );
    expect(full.length).toBeGreaterThan(0);
    for (const key of full) {
      expect(key in zhClientFlat, key).toBe(true);
    }
  });

  it("zh 与 en 的客户端词典键集一致", () => {
    expect(Object.keys(enClientFlat).sort()).toEqual(
      Object.keys(zhClientFlat).sort(),
    );
  });

  it("客户端词典是完整词典的真子集", () => {
    expect(Object.keys(zhClientFlat).length).toBeLessThan(
      Object.keys(zhFlat).length,
    );
  });
});
