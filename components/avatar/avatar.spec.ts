import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "avatar", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the initials and the count reach their contrast", async ({ page }) => {
    await visitStates(page, "avatar", theme);
    await expectContrast(page, [
      { sel: "#av-initials .cap-avatar-fallback", what: "the initials" },
      { sel: "#av-group .cap-avatar-count", what: "the group's count" },
    ]);
  });

  test("behavior: a picture that fails to load gives way to the initials", async ({ page }) => {
    await visitStates(page, "avatar", theme);
    await expect(page.locator("#av-broken")).toHaveAttribute("data-state", "error");
    await expect(page.locator("#av-broken .cap-avatar-image")).toBeHidden();
    await expect(page.locator("#av-broken .cap-avatar-fallback")).toBeVisible();
    await expect(page.locator("#av-picture")).not.toHaveAttribute("data-state", "error");
  });
});
