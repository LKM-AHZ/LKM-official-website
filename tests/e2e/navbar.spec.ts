import { test, expect } from "@playwright/test";

const BASE_PATH = process.env.BASE_PATH ?? "";

test("桌面顶栏收拢搜索与偏好设置", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_PATH}/`);

  const navbar = page.locator("#navbar");
  await expect(navbar.getByRole("button", { name: "搜索" })).toBeVisible();
  await expect(navbar.getByRole("button", { name: "显示设置" })).toBeVisible();
  await expect(navbar.getByRole("button", { name: "通知" })).toHaveCount(0);
  await expect(navbar.locator("#scheme-switch")).toHaveCount(0);

  await navbar
    .locator('astro-island[component-url*="PreferencesMenu"]:not([ssr])')
    .waitFor();
  await navbar.getByRole("button", { name: "显示设置" }).click();
  const hueSlider = navbar.locator("input.preferences-hue");
  await expect(hueSlider).toBeVisible();
  await expect(hueSlider).toHaveAttribute("type", "range");
  await expect(hueSlider).toHaveCSS(
    "background-image",
    /color-selection-bar|gradient/,
  );
});

test("字号设置在宽屏与刷新后保持生效", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto(`${BASE_PATH}/`);
  await expect(page.locator("html")).toHaveCSS("font-size", "15px");

  const navbar = page.locator("#navbar");
  await navbar
    .locator('astro-island[component-url*="PreferencesMenu"]:not([ssr])')
    .waitFor();
  await navbar.getByRole("button", { name: "显示设置" }).click();
  await navbar
    .getByRole("group", { name: "字体大小" })
    .getByRole("button", { name: "大" })
    .click();
  await expect(page.locator("html")).toHaveCSS("font-size", "17px");

  await page.reload();
  await expect(page.locator("html")).toHaveCSS("font-size", "17px");
  await navbar
    .locator('astro-island[component-url*="PreferencesMenu"]:not([ssr])')
    .waitFor();
  await navbar.getByRole("button", { name: "显示设置" }).click();
  await expect(
    navbar
      .getByRole("group", { name: "字体大小" })
      .getByRole("button", { name: "大" }),
  ).toHaveAttribute("aria-pressed", "true");

  await navbar
    .getByRole("group", { name: "字体大小" })
    .getByRole("button", { name: "标准" })
    .click();
  await expect(page.locator("html")).toHaveCSS("font-size", "15px");
});

test("移动端可搜索并从菜单调整外观", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_PATH}/`);

  await expect(
    page.locator("#navbar").getByRole("button", { name: "搜索" }),
  ).toBeVisible();
  await page.locator("#navbar").getByRole("button", { name: "搜索" }).click();
  await expect(page.locator("#global-search-input")).toBeVisible();
  await page.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "Menu" }).click();
  const drawer = page.getByRole("navigation", { name: "移动端导航" });
  await drawer
    .locator('astro-island[component-url*="PreferencesMenu"]:not([ssr])')
    .waitFor();
  await expect(drawer.getByRole("button", { name: "显示设置" })).toBeVisible();
  await drawer.getByRole("button", { name: "显示设置" }).click();
  await expect(drawer.locator("input.preferences-hue")).toBeVisible();
  await drawer
    .getByRole("group", { name: "字体大小" })
    .getByRole("button", { name: "小" })
    .click();
  await expect(page.locator("html")).toHaveCSS("font-size", "14px");
});

test("搜索组件加载后侧边栏仍可展开和收起", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_PATH}/files/`);
  await expect(
    page.locator("#navbar").getByRole("button", { name: "搜索" }),
  ).toBeVisible();

  const sidebar = page.locator("[data-sidebar]");
  const content = page.locator("[data-main-content]");
  await expect(sidebar).toBeVisible();
  await expect(content).toHaveCSS("padding-left", "240px");
  await expect(sidebar.getByRole("link", { name: "概览" })).toHaveAttribute(
    "aria-current",
    "location",
  );
  await sidebar.getByRole("link", { name: "文件库" }).click();
  await expect(page).toHaveURL(/#library$/);
  await expect(sidebar.getByRole("link", { name: "文件库" })).toHaveAttribute(
    "aria-current",
    "location",
  );

  await sidebar.getByRole("button", { name: "Toggle sidebar" }).click();
  await expect(sidebar).toHaveCSS("width", "67px");
  await expect(sidebar).toHaveCSS("height", "828px");
  await expect(content).toHaveCSS("padding-left", "67px");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(sidebar).toHaveCSS("width", "50px");
  await expect(content).toHaveCSS("padding-left", "50px");
});

test("侧边栏只链接当前页面的实际模块", async ({ page }) => {
  for (const route of [
    "forum",
    "forum/basic-science",
    "files",
    "qa",
    "projects",
    "competition",
    "competition/bank",
  ]) {
    await page.goto(`${BASE_PATH}/${route}/`);
    const links = page.locator("[data-sidebar] a[href]");
    expect(await links.count()).toBeGreaterThanOrEqual(2);
    for (const href of await links.evaluateAll((items) =>
      items.map((item) => item.getAttribute("href")),
    )) {
      expect(href).toMatch(/^#[\w-]+$/);
      await expect(page.locator(href!)).toHaveCount(1);
    }
  }
});

test("两个应用沿用主站顶栏，树洞侧栏不遮挡内容", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${BASE_PATH}/starhope/`);
    await expect(page.locator(".starhope-app aside")).toBeVisible();
    await page.goto(`${BASE_PATH}/treehole/`);
    const sidebar = page.locator(".th-app .side-nav");
    if (width <= 768) {
      await expect(sidebar).toBeHidden();
      await page.getByRole("button", { name: "菜单" }).click();
      await expect
        .poll(() => sidebar.evaluate((el) => el.getBoundingClientRect().left))
        .toBe(0);
    }
    await expect(sidebar).toBeVisible();
    const layout = await page.evaluate(() => {
      const siteNav = document.querySelector("#navbar-wrapper");
      const sidebar = document.querySelector(".th-app .side-nav");
      const content = document.querySelector(".th-app .main-content");
      return {
        siteBottom: siteNav?.getBoundingClientRect().bottom ?? 0,
        sidebarTop: sidebar?.getBoundingClientRect().top ?? 0,
        sidebarRight: sidebar?.getBoundingClientRect().right ?? 0,
        contentLeft: content?.getBoundingClientRect().left ?? 0,
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(layout.siteBottom).toBeGreaterThan(0);
    expect(layout.sidebarTop).toBeGreaterThanOrEqual(layout.siteBottom - 1);
    if (width > 768)
      expect(layout.contentLeft).toBeGreaterThanOrEqual(layout.sidebarRight);
    expect(layout.overflow).toBeLessThanOrEqual(0);
    await expect(sidebar.getByRole("link", { name: /设置/ })).toBeVisible();
  }
});

test("树洞侧栏的选中颜色跟随网站主题色", async ({ page }) => {
  await page.goto(`${BASE_PATH}/treehole/`);
  const active = page.locator(".th-app .side-nav .nav-link.active");
  await expect(active).toBeVisible();
  await page.evaluate(() =>
    document.documentElement.style.setProperty("--hue", "20"),
  );
  await page.waitForTimeout(250);
  const warm = await active.evaluate(
    (element) => getComputedStyle(element).color,
  );
  await page.evaluate(() =>
    document.documentElement.style.setProperty("--hue", "260"),
  );
  await page.waitForTimeout(250);
  const cool = await active.evaluate(
    (element) => getComputedStyle(element).color,
  );
  expect(warm).not.toBe(cool);
});
