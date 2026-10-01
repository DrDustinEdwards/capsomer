import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const html = (page: Page) => page.locator("html");
const radio = (page: Page, name: string) => page.getByRole("radio", { name });

eachTheme((theme) => {
  test("accessibility: no axe violations, the states page", async ({ page }) => {
    await visitStates(page, "theme-switch", theme);
    await expectNoAxeViolations(page);
  });

  for (const id of ["system", "light", "dark"]) {
    test(`accessibility: no axe violations, ${id} selected`, async ({ page }) => {
      await visitStates(page, "theme-switch", theme, id);
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: the switch's roles and names", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "system");
    await expect(page.locator(".cap-theme")).toMatchAriaSnapshot(`
      - group "Theme":
        - radio "System" [checked]
        - radio "Light"
        - radio "Dark"
    `);
  });

  test("accessibility: the choices are drawn as one control, and the chosen one reaches its contrast", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "system");
    await expect(page.locator(".cap-theme .cap-seg-options")).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-theme label:has(input:checked)", what: "the chosen choice's word" },
      { sel: ".cap-theme label:has(input:not(:checked))", what: "an unchosen choice's word" },
      { sel: ".cap-theme .cap-seg-options", what: "the control's edge", part: "border" },
      { sel: ".cap-theme label:has(input:checked)", what: "the chosen choice's edge", part: "border" },
    ]);
  });

  test("behaviour: each specimen applies its choice to the page", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "system");
    await expect(html(page)).not.toHaveAttribute("data-theme", /.+/);
    await visitStates(page, "theme-switch", theme, "light");
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await visitStates(page, "theme-switch", theme, "dark");
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
  });

  test("keyboard: arrow keys change the theme, and the choice persists across a reload", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "system");
    await radio(page, "System").focus();
    await page.keyboard.press("ArrowRight");
    await expect(radio(page, "Light")).toBeChecked();
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await page.keyboard.press("ArrowRight");
    await expect(radio(page, "Dark")).toBeChecked();
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(radio(page, "Dark")).toBeChecked();
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    await radio(page, "Dark").focus();
    await page.keyboard.press("ArrowRight");
    await expect(radio(page, "System")).toBeChecked();
    await expect(html(page)).not.toHaveAttribute("data-theme", /.+/);
  });

  test("keyboard: t switches light and dark, and the switch follows", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "light");
    await page.keyboard.press("t");
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    await expect(radio(page, "Dark")).toBeChecked();
    await page.keyboard.press("t");
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await expect(radio(page, "Light")).toBeChecked();
  });
});
