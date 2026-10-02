import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "switch", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: words and the track reach their contrast in both states", async ({ page }) => {
    await visitStates(page, "switch", theme);
    await expectContrast(page, [
      { sel: "#sw-on", what: "a switch's label" },
      { sel: "#sw-on .cap-switch-state", what: "the word On" },
      { sel: "#sw-off .cap-switch-state", what: "the word Off" },
      { sel: "#sw-off input", what: "the track's edge, off", part: "border" },
      { sel: "#sw-on input", what: "the track's edge, on", part: "border" },
      { sel: "#sw-hover-off input", what: "a hovered track's edge, off", part: "border" },
      { sel: "#sw-hover-on input", what: "a hovered track's edge, on", part: "border" },
      { sel: "#sw-disabled-why", what: "the reason beside a disabled switch" },
      { sel: "#sw-busy input", what: "the pending switch's outline", part: "outline" },
      { sel: "#sw-sm input", what: "a small switch's edge, on", part: "border" },
      { sel: "#sw-invalid input", what: "an invalid switch's edge", part: "border" },
      { sel: "#sw-invalid-why", what: "an invalid switch's message" },
    ]);
  });

  test("accessibility: roles, names and states", async ({ page }) => {
    await visitStates(page, "switch", theme);
    await expect(page.locator("#main")).toMatchAriaSnapshot(`
      - switch "Single-key shortcuts" [checked]
      - switch "Compact rows"
    `);
    await expect(page.getByRole("switch", { name: "Compact rows" })).not.toBeChecked();
    await expect(page.getByRole("switch", { name: "Email alerts" })).toBeDisabled();
    await expect(page.getByRole("switch", { name: "Email alerts" })).toHaveAccessibleDescription("Add an email address in Settings first.");
  });

  test("keyboard: Tab moves to the switch", async ({ page }) => {
    await visitStates(page, "switch", theme);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("switch", { name: "Single-key shortcuts" })).toBeFocused();
    await expectContrast(page, [{ sel: "#sw-on input", what: "the focus ring", part: "outline", min: 3 }]);
  });

  test("keyboard: Space turns it on or off at once, and the word follows", async ({ page }) => {
    await visitStates(page, "switch", theme);
    const sw = page.getByRole("switch", { name: "Show times in UTC" });
    const word = page.locator("#sw-focus .cap-switch-state");
    await sw.focus();
    await page.keyboard.press("Space");
    await expect(sw).toBeChecked();
    await expect(word).toHaveText("On");
    await page.keyboard.press("Space");
    await expect(sw).not.toBeChecked();
    await expect(word).toHaveText("Off");
  });

  test("behaviour: a click on the label turns it on; the name stays a fixed noun", async ({ page }) => {
    await visitStates(page, "switch", theme);
    await page.getByText("Compact rows").click();
    const sw = page.getByRole("switch", { name: "Compact rows" });
    await expect(sw).toBeChecked();
    await expect(page.locator("#sw-off .cap-switch-state")).toHaveText("On");
    await expect(sw).toHaveAccessibleName("Compact rows");
  });

  test("behaviour: a pending switch says so, is not disabled, and keeps its name", async ({ page }) => {
    await visitStates(page, "switch", theme);
    const sw = page.getByRole("switch", { name: "Nightly export" });
    await expect(sw).toHaveAttribute("aria-busy", "true");
    await expect(sw).toBeEnabled();
    await sw.focus();
    await expect(sw).toBeFocused();
    await expect(sw).toHaveAccessibleName("Nightly export");
  });

  test("behaviour: a disabled switch does not move", async ({ page }) => {
    await visitStates(page, "switch", theme);
    await page.getByText("Email alerts").click({ force: true });
    await expect(page.getByRole("switch", { name: "Email alerts" })).not.toBeChecked();
  });

  test("accessibility: an invalid switch exposes aria-invalid and its message", async ({ page }) => {
    await visitStates(page, "switch", theme);
    const sw = page.getByRole("switch", { name: "Public status page" });
    await expect(sw).toHaveAttribute("aria-invalid", "true");
    await expect(sw).toHaveAccessibleDescription("Verify the domain before publishing.");
  });

  test("accessibility: a small switch keeps a 24 px hit area", async ({ page }) => {
    await visitStates(page, "switch", theme);
    const box = await page.locator("#sw-sm").boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(24);
  });

  test("keyboard: Space toggles a small switch", async ({ page }) => {
    await visitStates(page, "switch", theme);
    const sw = page.getByRole("switch", { name: "Dense mode" }).first();
    await sw.focus();
    await page.keyboard.press("Space");
    await expect(sw).not.toBeChecked();
    await page.keyboard.press("Space");
    await expect(sw).toBeChecked();
  });
});
