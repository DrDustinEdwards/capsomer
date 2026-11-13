import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test.beforeEach(async ({ page }) => {
    await visitStates(page, "record-facts", theme);
    await expect(page.locator('[data-mount="react"] dl')).toHaveCount(1);
  });

  test("accessibility: no axe violations", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("accessibility: labels, values and a linked identifier reach their contrast", async ({
    page,
  }) => {
    await expectContrast(page, [
      { sel: "#sample-facts dt", what: "a label" },
      { sel: "#sample-facts dd", what: "a value" },
      { sel: "#sample-facts dd[data-mono] a", what: "a linked identifier" },
    ]);
  });

  test("behavior: React leaves out a fact with no value and keeps label then value in order", async ({
    page,
  }) => {
    const react = page.locator('[data-mount="react"]');
    await expect(react.locator("dt")).toHaveText(["Year", "Stage", "DOI", "Kind"]);
    await expect(react.locator(".cap-record-facts-item").first()).toHaveText("Year2026");
  });
});
