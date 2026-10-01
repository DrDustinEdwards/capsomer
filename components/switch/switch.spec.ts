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

  test("behaviour: a disabled switch does not move", async ({ page }) => {
    await visitStates(page, "switch", theme);
    await page.getByText("Email alerts").click({ force: true });
    await expect(page.getByRole("switch", { name: "Email alerts" })).not.toBeChecked();
  });
});
