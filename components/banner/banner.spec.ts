import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "banner", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: banner and alert text reach their contrast", async ({ page }) => {
    await visitStates(page, "banner", theme);
    await expectContrast(page, [
      { sel: "#sample-warn .cap-banner-text", what: "warning banner text" },
      { sel: "#sample-crit .cap-banner-text", what: "critical banner text" },
      { sel: "#sample-warn .cap-status-glyph", what: "warning banner glyph", min: 3 },
      { sel: "#sample-crit .cap-status-glyph", what: "critical banner glyph", min: 3 },
      { sel: "#sample-alert .cap-alert-text", what: "inline alert text" },
      { sel: "#sample-warn", what: "warning banner edge", part: "border", min: 3 },
      { sel: "#sample-crit", what: "critical banner edge", part: "border", min: 3 },
    ]);
  });

  test("accessibility: the banner's and the alert's roles and names", async ({ page }) => {
    await visitStates(page, "banner", theme);
    await expect(page.locator("#sample-warn")).toMatchAriaSnapshot(`
      - status:
        - paragraph: Could not refresh. Showing data from 4 minutes ago.
        - button "Try again"
    `);
    await expect(page.locator("#sample-alert")).toMatchAriaSnapshot(`
      - alert: "Could not save the schedule: the server did not answer. Your changes are kept here; save again in a minute."
    `);
    await expect(page.getByRole("button", { name: "Save schedule" })).toHaveAccessibleDescription(/Could not save the schedule/);
  });

  test("keyboard: Tab reaches the banners' actions in reading order, not the banners", async ({ page }) => {
    await visitStates(page, "banner", theme);
    await page.locator("#sample-warn").getByRole("button", { name: "Try again" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("#sample-crit").getByRole("link", { name: "Sign in" })).toBeFocused();
    await expect(page.locator("#sample-warn")).not.toHaveAttribute("tabindex");
  });

  test("keyboard: Enter on Dismiss hides the banner and focus moves to the page, not nowhere", async ({ page }) => {
    await visitStates(page, "banner", theme);
    const dismiss = page.locator("#sample-dismiss").getByRole("button", { name: "Dismiss" });
    await dismiss.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#sample-dismiss")).toBeHidden();
    await expect(page.locator("main").first()).toBeFocused();
  });

  test("behaviour: a failed refresh keeps the last good data on screen", async ({ page }) => {
    await visitStates(page, "banner", theme);
    await expect(page.locator("#sample-warn")).toBeVisible();
    await expect(page.getByRole("list", { name: "Sites, as of 4 minutes ago" }).getByRole("listitem")).toHaveCount(3);
  });
});
