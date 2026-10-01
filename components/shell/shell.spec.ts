import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, expanded", async ({ page }) => {
    await visitStates(page, "shell", theme, "expanded");
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations, collapsed", async ({ page }) => {
    await visitStates(page, "shell", theme, "collapsed");
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "shell", theme, "phone");
    await expectNoAxeViolations(page);
    await expect(page.locator(".cap-shell-rail")).toBeHidden();
    await expect(page.locator(".cap-shell-tabs a")).toHaveCount(5);
  });

  test("accessibility: menu text and counts reach their contrast", async ({ page }) => {
    await visitStates(page, "shell", theme, "expanded");
    await expectContrast(page, [
      { sel: ".cap-shell-rail a:not([aria-current]) .cap-shell-label", what: "an inactive menu entry" },
      { sel: ".cap-shell-rail a[aria-current] .cap-shell-label", what: "the current menu entry" },
      { sel: ".cap-shell-count[data-tone='crit']", what: "a critical count" },
      { sel: ".cap-shell-count[data-tone='warn']", what: "a warning count" },
      { sel: ".cap-shell-toggle .cap-shell-label", what: "the collapse button" },
      { sel: ".cap-shell-brand", what: "the brand" },
    ]);
  });

  test("accessibility: the menu's roles and names", async ({ page }) => {
    await visitStates(page, "shell", theme, "expanded");
    await expect(page.locator(".cap-shell-rail")).toMatchAriaSnapshot(`
      - navigation "Sections":
        - link "Overview"
        - link "Sites, 2 down or degraded"
        - link "Queue, 3 blocked"
        - link "Activity"
        - button "Collapse menu" [expanded]
    `);
  });

  test("keyboard: the skip link comes first and moves focus to the content", async ({ page }) => {
    await visitStates(page, "shell", theme, "expanded");
    await page.keyboard.press("Tab");
    const skip = page.locator(".cap-shell-skip");
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator("#cap-main")).toBeFocused();
  });

  test("keyboard: the collapse button collapses and expands the menu, and the names stay", async ({ page }) => {
    await visitStates(page, "shell", theme, "expanded");
    const toggle = page.locator("[data-cap-part='rail-toggle']");
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".cap-shell")).toHaveAttribute("data-rail", "collapsed");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAccessibleName("Expand menu");
    await expect(page.getByRole("link", { name: "Queue, 3 blocked" })).toBeVisible();
    await page.keyboard.press("Space");
    await expect(page.locator(".cap-shell")).not.toHaveAttribute("data-rail", "collapsed");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  test("keyboard: a collapsed entry shows its name on focus, and Esc hides it", async ({ page }) => {
    await visitStates(page, "shell", theme, "collapsed");
    const link = page.getByRole("link", { name: "Components" });
    await link.focus();
    const label = link.locator(".cap-shell-label");
    await expect(label).toHaveCSS("opacity", "1");
    await expectContrast(page, [{ sel: ".cap-shell-rail a:focus-visible .cap-shell-label", what: "the shown name" }]);
    await page.keyboard.press("Escape");
    await expect(label).toHaveCSS("opacity", "0");
  });

  test("behaviour: the collapsed choice is remembered", async ({ page }) => {
    await visitStates(page, "shell", theme, "expanded");
    await page.locator("[data-cap-part='rail-toggle']").click();
    await page.reload();
    await expect(page.locator(".cap-shell")).toHaveAttribute("data-rail", "collapsed");
    await expect(page.locator("[data-cap-part='rail-toggle']")).toHaveAttribute("aria-expanded", "false");
  });
});
