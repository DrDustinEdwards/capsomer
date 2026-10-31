import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "toolbar", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: a pressed toggle's word and edges reach their contrast", async ({ page }) => {
    await visitStates(page, "toolbar", theme);
    await expectContrast(page, [
      { sel: "#tb-wrap", what: "a pressed toggle's word" },
      { sel: "#tb-wrap", what: "a pressed toggle's edge", part: "border" },
    ]);
  });

  test("keyboard: the bar is one tab stop; arrows skip a disabled button, wrap, and Home and End go to the ends", async ({ page }) => {
    await visitStates(page, "toolbar", theme);
    const bar = page.getByRole("toolbar", { name: "Draft" });
    await page.locator("h1").click();
    await page.keyboard.press("Tab");
    await expect(bar.getByRole("button", { name: "Save" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(bar.getByRole("button", { name: "Wrap lines" })).toBeFocused();
    await page.keyboard.press("End");
    await expect(bar.getByRole("link", { name: "History" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(bar.getByRole("button", { name: "Save" })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    // The stop stays where focus last was: Tab leaves the bar, Shift Tab comes back to it.
    await page.keyboard.press("Tab");
    await expect(bar.locator(":focus")).toHaveCount(0);
    await page.keyboard.press("Shift+Tab");
    await expect(bar.getByRole("link", { name: "History" })).toBeFocused();
  });

  test("keyboard: right to left, Left arrow moves forward", async ({ page }) => {
    await visitStates(page, "toolbar", theme);
    const bar = page.locator("#tb-rtl");
    await bar.getByRole("button").first().focus();
    await page.keyboard.press("ArrowLeft");
    await expect(bar.getByRole("button").nth(1)).toBeFocused();
  });
});
