/**
 * 评审阻断项 R7 的回归锁：凡是整页/整块跑 mock 数据的页面，必须渲染不可关闭的「演示数据」横幅。
 *
 * 为什么用源码断言而不是渲染测试：这些页面是 Astro SSR 页面，渲染需要整套 API 环境；
 * 而这里要钉住的只是一条结构事实——「页面里确有 `<DemoNotice />`」。mock 页面一旦新增
 * （例如又接一个假功能），把它加进 PAGES 就能被同一条规则覆盖。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PAGES = [
  "src/pages/index.astro",
  "src/pages/chat.astro",
  "src/pages/competition/index.astro",
  "src/pages/competition/bank.astro",
  "src/pages/competition/[id]/index.astro",
  "src/pages/competition/[id]/exam.astro",
];

const read = (path: string): string =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("演示数据标注（R7）", () => {
  it.each(PAGES)("%s 渲染了不可关闭的 DemoNotice", (page) => {
    const src = read(page);
    // 单双引号两种写法都接受（老页面用单引号），只钉「确实导入了这个组件」
    expect(src).toMatch(
      /import DemoNotice from ["']~\/components\/patterns\/DemoNotice\.astro["']/,
    );
    // 导入不等于渲染：必须真的出现在模板里
    expect(src).toMatch(/<DemoNotice\b/);
  });

  it("横幅本身没有关闭控件（不可关闭才是它的语义）", () => {
    const src = read("src/components/patterns/DemoNotice.astro");
    expect(src).not.toMatch(/<button/i);
    expect(src).not.toMatch(/aria-label="关闭|dismiss/i);
    // 必须是首屏可见的 sticky 横幅，而不是页面底部的说明
    expect(src).toMatch(/sticky top-0/);
    expect(src).toMatch(/role="note"/);
  });
});
