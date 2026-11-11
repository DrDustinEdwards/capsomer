import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the line reaches its contrast fresh and stale", async ({
    page,
  }) => {
    await visitStates(page, "freshness", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#fr-fresh .cap-fresh-text", what: "the muted line" },
      { sel: "#fr-fresh b", what: "the age" },
      { sel: "#fr-stale b", what: "the stale age" },
    ]);
  });
});

test("behavior: a short line drops the second clause and keeps the age", async ({ page }) => {
  await visitStates(page, "freshness", "light");
  await expect(page.locator("#fr-short .cap-fresh-more")).toBeHidden();
  await expect(page.locator("#fr-short .cap-fresh-text")).toBeVisible();
  await expect(page.locator("#fr-fresh .cap-fresh-more")).toBeVisible();
});
