import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the words reach their contrast", async ({ page }) => {
    for (const only of ["published", "registered", "lists"]) {
      await visitStates(page, "consent", theme, only);
      await expectNoAxeViolations(page);
    }
    await visitStates(page, "consent", theme, "published");
    await expectContrast(page, [
      { sel: ".cap-consent-text", what: "the lead" },
      { sel: ".cap-permissions-heading", what: "a list's heading" },
      { sel: ".cap-consent-line", what: "the write grant's lines" },
    ]);
  });

  test("keyboard: the write grant, then Allow and Deny, in order", async ({ page }) => {
    await visitStates(page, "consent", theme, "published");
    await page.getByRole("checkbox", { name: /Allow changes/ }).focus();
    await expect(page.getByRole("checkbox", { name: /Allow changes/ })).toBeChecked();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Allow access" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Deny" })).toBeFocused();
    await expect(page.getByRole("list", { name: /What Example Assistant can do/ })).toBeVisible();
  });
});
