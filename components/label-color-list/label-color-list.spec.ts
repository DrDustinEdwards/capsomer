import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "label-color-list", theme);
    await expect(page.getByRole("textbox", { name: "Label 1" })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: every label's word reaches 4.5:1 and every dot 3:1", async ({ page }) => {
    await visitStates(page, "label-color-list", theme);
    const checks = [];
    for (let c = 1; c <= 8; c++) {
      const sel = `.cap-color-label-list .cap-color-label[data-color="${c}"]`;
      checks.push({ sel, what: `label word ${c}` });
      const dot = await page.evaluate((s) => {
        const el = document.querySelector(`${s} .cap-color-label-dot`);
        return el ? getComputedStyle(el).backgroundColor : null;
      }, sel);
      const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(dot, `dot ${c} is painted`).not.toBeNull();
      const ratio = await page.evaluate(([a, b]) => window.capRatio(a!, b!), [dot!, ground]);
      expect(ratio, `dot ${c}: ${dot} on ${ground}`).toBeGreaterThanOrEqual(3);
    }
    await expectContrast(page, checks);
  });

  test("keyboard: Tab goes from a row's name to its color, and a new color shows its dot", async ({
    page,
  }) => {
    await visitStates(page, "label-color-list", theme);
    const form = page.getByRole("form", { name: "Edit the stages" });
    await form.getByRole("textbox", { name: "Label 2" }).focus();
    await page.keyboard.press("Tab");
    const color = form.getByRole("combobox", { name: "Color 2" });
    await expect(color).toBeFocused();
    await color.selectOption("7").catch(async () => {
      await page.keyboard.press("Enter");
      await page.getByRole("option", { name: "Orchid" }).click();
    });
    await expect(
      form.locator(".cap-color-label-edit > li").nth(1).locator(".cap-color-label"),
    ).toHaveAttribute("data-color", "7");
  });
});
