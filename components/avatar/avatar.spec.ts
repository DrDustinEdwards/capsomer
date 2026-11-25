import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "avatar", theme);
    await expectNoAxeViolations(page);
  });

  test("behavior: a picture that fails to load gives way to the initials", async ({ page }) => {
    await visitStates(page, "avatar", theme);
    await expect(page.locator("#av-broken")).toHaveAttribute("data-state", "error");
    await expect(page.locator("#av-broken .cap-avatar-image")).toBeHidden();
    await expect(page.locator("#av-broken .cap-avatar-fallback")).toBeVisible();
    await expect(page.locator("#av-picture")).not.toHaveAttribute("data-state", "error");
  });
});
