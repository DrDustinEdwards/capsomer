import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "writing-progress", theme);
    await expect(page.locator("[data-mount='target'] .cap-meter").first()).toBeVisible();
    await expect(page.locator("[data-mount='target'] svg").first()).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: the lines and the note reach their contrast", async ({ page }) => {
    await visitStates(page, "writing-progress", theme);
    await expectContrast(page, [
      { sel: "[data-mount='target'] .cap-progress-line", what: "streak line" },
      { sel: "[data-mount='target'] .cap-progress-note", what: "note" },
      { sel: "[data-mount='met'] .cap-progress-line.cap-muted", what: "pace line" },
      { sel: "[data-mount='none'] .cap-progress-line .cap-muted", what: "why there is no target" },
    ]);
  });

  test("keyboard: Enter on Your target opens the goal form, and its fields follow in order", async ({
    page,
  }) => {
    await visitStates(page, "writing-progress", theme);
    const panel = page.locator("[data-mount='target']");
    const summary = panel.getByText("Your target", { exact: true });
    await summary.focus();
    await page.keyboard.press("Enter");
    const byHand = panel.getByRole("radio", { name: "By hand" });
    await expect(byHand).toBeVisible();
    await byHand.focus();
    await page.keyboard.press("ArrowDown");
    await expect(panel.getByRole("radio", { name: "From the deadline" })).toBeChecked();
    await page.keyboard.press("Tab");
    await expect(panel.getByRole("textbox", { name: "Words a day" })).toBeFocused();
  });
});
