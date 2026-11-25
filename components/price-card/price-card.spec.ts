import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the price and text reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "price-card", theme);
    await expectNoAxeViolations(page);
  });

  test("behavior: the actions of cards in a row line up at the foot", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await visitStates(page, "price-card", theme);
    const bottoms = await page
      .locator("#pc-grid .cap-price-card-action")
      .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().bottom)));
    expect(new Set(bottoms).size).toBe(1);
  });
});
