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

  test("accessibility: every tone, the title and the alert tones reach their contrast", async ({ page }) => {
    await visitStates(page, "banner", theme);
    await expectContrast(page, [
      { sel: "#sample-neutral .cap-banner-text", what: "neutral banner text" },
      { sel: "#sample-info .cap-banner-text", what: "notice banner text" },
      { sel: "#sample-ok .cap-banner-text", what: "ok banner text" },
      { sel: "#sample-neutral .cap-status-glyph", what: "neutral glyph", min: 3 },
      { sel: "#sample-info .cap-status-glyph", what: "notice glyph", min: 3 },
      { sel: "#sample-ok .cap-status-glyph", what: "ok glyph", min: 3 },
      { sel: "#sample-neutral", what: "neutral edge", part: "border", min: 3 },
      { sel: "#sample-info", what: "notice edge", part: "border", min: 3 },
      { sel: "#sample-ok", what: "ok edge", part: "border", min: 3 },
      { sel: "#sample-title .cap-banner-title", what: "banner title" },
      { sel: "#sample-title .cap-banner-text", what: "banner description" },
      { sel: "#sample-title a", what: "a link in a banner" },
      { sel: "#sample-alert-title .cap-alert-title", what: "critical alert title" },
      { sel: "#sample-alert-title .cap-alert-text", what: "critical alert description" },
      { sel: "#sample-alert-warn .cap-alert-title", what: "warning alert title" },
      { sel: "#sample-alert-warn .cap-alert-text", what: "warning alert description" },
      { sel: "#sample-alert-neutral .cap-alert-title", what: "neutral alert title" },
      { sel: "#sample-comfortable .cap-banner-text", what: "comfortable banner text" },
    ]);
  });

  test("accessibility: a banner with a title and an alert with a title keep their roles and names", async ({ page }) => {
    await visitStates(page, "banner", theme);
    await expect(page.locator("#sample-title")).toMatchAriaSnapshot(`
      - status:
        - paragraph: Showing data from 4 minutes ago
        - paragraph:
          - text: /The watcher did not answer/
          - link "read what the watcher said"
        - button "Try again"
    `);
    await expect(page.locator("#sample-alert-title")).toMatchAriaSnapshot(`
      - alert:
        - paragraph: Could not save the schedule
        - paragraph: /The cron line has six fields/
        - button "Edit the line"
    `);
    await expect(page.locator("#sample-ok")).toHaveAttribute("role", "status");
    await expect(page.locator("#sample-crit")).toHaveAttribute("role", "alert");
  });

  test("accessibility: every tone has its own glyph shape, hidden from assistive technology", async ({ page }) => {
    await visitStates(page, "banner", theme);
    const shapes = await page.evaluate(() =>
      ["#sample-ok", "#sample-warn", "#sample-crit", "#sample-info"].map((id) => document.querySelector(`${id} > .cap-status-glyph`)!.innerHTML),
    );
    expect(new Set(shapes).size).toBe(4);
    const hidden = await page.locator(".cap-banner > .cap-status-glyph, .cap-alert > .cap-status-glyph").evaluateAll((els) => els.every((e) => e.getAttribute("aria-hidden") === "true"));
    expect(hidden).toBe(true);
  });

  test("keyboard: an action in a titled banner is reachable with Tab", async ({ page }) => {
    await visitStates(page, "banner", theme);
    await page.locator("#sample-title a").focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("#sample-title").getByRole("button", { name: "Try again" })).toBeFocused();
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
