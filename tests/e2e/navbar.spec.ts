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

test("移动端可搜索并从菜单调整外观", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_PATH}/`);

  await page
    .locator('astro-island[component-url*="search/index"]:not([ssr])')
    .waitFor();
  await page.locator("#navbar").getByRole("button", { name: "搜索" }).click();
  await expect(page.locator("#global-search-input")).toBeVisible();
  await page.getByRole("button", { name: "ESC" }).click();

  await page.getByRole("button", { name: "Menu" }).click();
  const drawer = page.getByRole("navigation", { name: "移动端导航" });
  await drawer
    .locator('astro-island[component-url*="PreferencesMenu"]:not([ssr])')
    .waitFor();
  await expect(drawer.getByRole("button", { name: "显示设置" })).toBeVisible();
  await drawer.getByRole("button", { name: "显示设置" }).click();
  await expect(drawer.locator("input.preferences-hue")).toBeVisible();
});
