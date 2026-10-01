import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "select", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: words and edges reach their contrast", async ({ page }) => {
    await visitStates(page, "select", theme);
    await expectContrast(page, [
      { sel: "#sel-platform", what: "the chosen option" },
      { sel: "#sel-platform", what: "a select's edge", part: "border" },
      { sel: "#sel-hover", what: "a hovered select's edge", part: "border" },
      { sel: "#sel-invalid", what: "an invalid select's edge", part: "border" },
      { sel: "#sel-invalid-e", what: "an error message" },
      { sel: "#sel-disabled-h", what: "the reason beside a disabled select" },
    ]);
  });

  test("accessibility: roles and names", async ({ page }) => {
    await visitStates(page, "select", theme);
    await expect(page.locator("#default")).toMatchAriaSnapshot(`
      - combobox "Platform"
    `);
    await expect(page.locator("#sel-invalid")).toHaveAccessibleDescription("Choose who owns this job. It cannot run without an owner.");
    await expect(page.locator("#sel-disabled")).toBeDisabled();
  });

  test("keyboard: Tab moves focus to the select", async ({ page }) => {
    await visitStates(page, "select", theme);
    await page.keyboard.press("Tab");
    await expect(page.locator("#sel-platform")).toBeFocused();
    await expectContrast(page, [{ sel: "#sel-platform", what: "the focus ring", part: "outline", min: 3 }]);
  });

  test("keyboard: typing letters chooses the first option that starts with them", async ({ page }) => {
    await visitStates(page, "select", theme);
    const sel = page.locator("#sel-platform");
    await sel.focus();
    await page.keyboard.type("v");
    await expect(sel).toHaveValue("vercel");
  });

  test("keyboard: Space opens the list, arrows move, Enter chooses, Esc closes without changing", async ({ page }) => {
    await visitStates(page, "select", theme);
    const sel = page.locator("#sel-every");
    await sel.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(sel).toHaveValue("15");
    await expect(sel).toBeFocused();

    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    await expect(sel).toHaveValue("15");
    await expect(sel).toBeFocused();
  });
});
