import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the price and text reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "price-card", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#pc-featured .cap-price-card-amount", what: "the price" },
      { sel: "#pc-featured .cap-price-card-unit", what: "the unit" },
      { sel: "#pc-featured .cap-price-card-text", what: "the text" },
      { sel: "#pc-plan .cap-plan-option-price", what: "a plan's price" },
    ]);
  });

  test("keyboard: arrow keys choose the next plan and skip a disabled one", async ({ page }) => {
    await visitStates(page, "price-card", theme);
    const monthly = page.getByRole("radio", { name: /Monthly/ });
    await monthly.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: /Yearly/ })).toBeChecked();
    await page.keyboard.press("ArrowRight");
    await expect(monthly).toBeChecked();
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
