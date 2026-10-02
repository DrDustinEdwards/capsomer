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
    await expect(page.locator(".cap-shell-tabs a, .cap-shell-tabs button")).toHaveCount(5);
    await expect(page.locator(".cap-shell-tabs")).toMatchAriaSnapshot(`
      - navigation "Sections":
        - link "Overview"
        - link "Queue"
        - link "Sites, 2 down or degraded"
        - link "Activity"
        - button "More"
    `);
  });

  test("accessibility: the tab bar's current and More states reach their contrast", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "shell", theme, "phone");
    await expectContrast(page, [
      { sel: ".cap-shell-tabs a[aria-current='page']", what: "the current tab" },
      { sel: ".cap-shell-tabs button", what: "the More tab" },
      { sel: ".cap-shell-badge", what: "a tab's count" },
    ]);
    await visitStates(page, "shell", theme, "phone-more-current");
    await expectNoAxeViolations(page);
    await expect(page.getByRole("button", { name: "More" })).toHaveAttribute("aria-current", "true");
    await expectContrast(page, [{ sel: ".cap-shell-tabs button[aria-current]", what: "the current More tab" }]);
  });

  test("accessibility: the top bar's Settings link is named, current on its view, after Theme and before Sign out", async ({ page }) => {
    await visitStates(page, "shell", theme, "collapsed");
    const top = page.locator(".cap-shell-top");
    await expect(top.getByRole("link", { name: "Settings" })).toHaveAttribute("aria-current", "page");
    await expectContrast(page, [{ sel: ".cap-shell-settings[aria-current='page']", what: "the current Settings button's edge", part: "border" }]);
    await visitStates(page, "shell", theme, "expanded");
    const names = await top.locator("a, button").evaluateAll((els) => els.map((el) => el.getAttribute("aria-label") ?? el.textContent?.trim() ?? ""));
    const at = names.indexOf("Theme");
    expect(names[at + 1]).toBe("Settings");
    expect(names[at + 2]).toBe("Sign out");
    await expect(top.getByRole("link", { name: "Settings" })).not.toHaveAttribute("aria-current", "page");
  });

  test("keyboard: More opens the sheet, Esc closes it and focus returns to More", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "shell", theme, "phone");
    const more = page.getByRole("button", { name: "More" });
    await more.focus();
    await page.keyboard.press("Enter");
    const sheet = page.getByRole("dialog", { name: "More views" });
    await expect(sheet).toBeVisible();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await expect(sheet.getByRole("link", { name: /^Namespaces/ })).toBeVisible();
    await expectNoAxeViolations(page);
    await expectContrast(page, [{ sel: ".cap-shell-more-list .cap-shell-count", what: "a count in the sheet" }]);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(more).toBeFocused();
    await expect(more).toHaveAttribute("aria-expanded", "false");
  });

  test("behaviour: a link in the More sheet closes it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "shell", theme, "phone");
    await page.getByRole("button", { name: "More" }).click();
    const sheet = page.getByRole("dialog", { name: "More views" });
    await sheet.getByRole("link", { name: "Backups" }).click();
    await expect(sheet).toBeHidden();
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
