import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the marks reach their contrast", async ({ page }) => {
    await visitStates(page, "status-matrix", theme);
    await expect(page.locator("#sm-grid table")).toBeVisible();
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#sm-grid .cap-matrix-mark[data-tone='crit']", what: "a failing mark", min: 3 },
      { sel: "#sm-grid .cap-matrix-mark[data-tone='warn']", what: "a partial mark", min: 3 },
      { sel: "#sm-grid .cap-matrix-none", what: "a cell not checked", min: 3 },
    ]);
  });
});

test("behavior: each cell is named with its row, column, status and why, and the row headers stay in view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await visitStates(page, "status-matrix", "light");
  await expect(
    page.getByRole("img", {
      name: "Search and AI readers, docs.example.com: Failing. No llms.txt",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Accessibility, api.example.com: Not checked" }),
  ).toBeVisible();
  const wrap = page.locator("#sm-grid .cap-table-wrap");
  const head = page.locator("#sm-grid th[scope='row']").first();
  const before = (await head.boundingBox())!.x;
  await wrap.evaluate((el) => (el.scrollLeft = 400));
  expect(Math.abs((await head.boundingBox())!.x - before)).toBeLessThan(2);
});
