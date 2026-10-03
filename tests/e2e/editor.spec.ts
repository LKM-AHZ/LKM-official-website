import { expect, test } from "@playwright/test";

test("rich text toolbar switches headings and inserts a sized table", async ({
  page,
}) => {
  await page.goto("/editor");
  const toolbar = page.locator(".rte-toolbar");
  await expect(toolbar).toBeVisible();

  await toolbar.locator(".rte-toolbar-select").first().click();
  await toolbar
    .locator(".rte-toolbar-popover--heading")
    .getByRole("button", { name: "H2" })
    .click();
  await expect(page.locator(".rte-editor-content h2")).toBeVisible();

  await toolbar.locator(".rte-toolbar-insert").click();
  await toolbar
    .locator(".rte-toolbar-popover--insert")
    .getByRole("button", { name: "表格" })
    .click();
  const picker = toolbar.locator(".rte-toolbar-popover--table");
  await expect(picker).toBeVisible();
  await picker.getByRole("button", { name: "2 行 2 列" }).click();
  await expect(page.locator(".rte-editor-content table tr")).toHaveCount(2);
  await expect(
    page.locator(".rte-editor-content table tr").first().locator("th, td"),
  ).toHaveCount(2);
});

test("mobile toolbar keeps common actions visible and offers the rest in More", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/editor");
  const toolbar = page.locator(".rte-toolbar");
  await expect(toolbar).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "更多" })).toBeVisible();
  await toolbar.getByRole("button", { name: "更多" }).click();
  await expect(toolbar.locator(".rte-toolbar-popover--more")).toBeVisible();
  await expect(
    toolbar
      .locator(".rte-toolbar-popover--more")
      .getByRole("button", { name: "表格" }),
  ).toBeVisible();
});

test("deleting text saves without a false version conflict, including after reload", async ({
  page,
}) => {
  await page.goto("/editor");
  const editor = page.locator(".rte-editor-content");
  const status = page.locator(".rte-save-status");
  await expect(editor).toBeVisible();

  await editor.click();
  await page.keyboard.type("AB");
  await expect(status).toHaveText("有未保存更改");
  await expect(status).toHaveText("已保存", { timeout: 10_000 });

  await page.keyboard.press("Backspace");
  await expect(editor).toContainText("A");
  await expect(status).toHaveText("有未保存更改");
  await expect(status).toHaveText("已保存", { timeout: 10_000 });

  await page.reload();
  await expect(editor).toContainText("A");
  await editor.click();
  await page.keyboard.press("Backspace");
  await expect(status).toHaveText("有未保存更改");
  await expect(status).toHaveText("已保存", { timeout: 10_000 });
  await expect(status).not.toContainText("版本冲突");
});
