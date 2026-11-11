import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the count reaches its contrast pressed and not", async ({ page }) => {
    await visitStates(page, "like-button", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#lk-off .cap-like-button span:last-child", what: "the count" },
      { sel: "#lk-on .cap-like-button span:last-child", what: "the liked count" },
      { sel: "#lk-failed .cap-like-error", what: "the error" },
    ]);
  });

  test("keyboard: Space toggles it, and its name stays the same", async ({ page }) => {
    await visitStates(page, "like-button", theme);
    const button = page.locator("#lk-off").getByRole("button", { name: "Like Field notes, 12" });
    await button.focus();
    await page.keyboard.press("Space");
    await expect(page.locator("#lk-off .cap-like-button")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#lk-off").getByRole("button", { name: /^Like Field notes, 13$/, pressed: true })).toBeVisible();
  });
});
