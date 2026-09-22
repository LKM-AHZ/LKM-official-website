/**
 * 词典扁平化共享逻辑。
 *
 * 运行时（index.ts / useI18n.ts）与构建期生成器（scripts/generate-i18n-flat.mjs）
 * 共用同一实现，保证「生成器预平铺的哈希/键序」与「运行时 flatten」天然一致。
 * 生成器通过与运行时一致的 flatten，把嵌套词典预平铺成扁平 Record 写到
 * generated/*.flat.ts，从而削掉每次加载/水合在客户端做的 flatten 递归 CPU。
 */

export type NestedDict = Record<string, unknown>;
export type FlatDict = Record<string, string>;

/** 将嵌套词典扁平化为 `a.b.c` 路径 → 字符串 */
export function flatten(dict: NestedDict, prefix = ""): FlatDict {
  // 无原型对象：词典里出现 `__proto__`/`constructor` 这类键时，
  // 普通对象上的 [[Set]] 会命中原型访问器、把键静默丢掉（甚至污染原型链）
  const out: FlatDict = Object.create(null) as FlatDict;
  for (const [key, value] of Object.entries(dict)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out[path] = value;
    } else if (value && typeof value === "object") {
      Object.assign(out, flatten(value as NestedDict, path));
    }
  }
  return out;
}

/** 把扁平 Record 序列化为带缩进的 TypeScript 模块源码（生成器输出用）。 */
export function formatFlatTs(flatName: string, dict: FlatDict): string {
  const keys = Object.keys(dict).sort();
  const lines = keys.map(
    (k) => `  ${JSON.stringify(k)}: ${JSON.stringify(dict[k])},`,
  );
  const body = ["export const " + flatName + " = {", ...lines, `};`].join("\n");
  return (
    `// 此文件由 scripts/generate-i18n-flat.mjs 自动生成，勿手改。\n` +
    `// 来源：${flatName.replace(/Flat$/, "")} 嵌套词典经 flatten 平铺。\n` +
    body +
    "\n"
  );
}
