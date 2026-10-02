import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const html = (page: Page) => page.locator("html");
const radio = (page: Page, name: string) => page.getByRole("radio", { name });

eachTheme((theme) => {
  test("accessibility: no axe violations, the states page", async ({ page }) => {
    await visitStates(page, "theme-switch", theme);
    await expectNoAxeViolations(page);
  });

  for (const id of ["first", "light", "dark"]) {
    test(`accessibility: no axe violations, ${id}`, async ({ page }) => {
      await visitStates(page, "theme-switch", theme, id);
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: the switch's roles and names, two choices and no System", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "light");
    await expect(page.locator(".cap-theme")).toMatchAriaSnapshot(`
      - group "Theme":
        - radio "Light" [checked]
        - radio "Dark"
    `);
    await expect(radio(page, "System")).toHaveCount(0);
  });

  test("accessibility: the choices are drawn as one control, and the chosen one reaches its contrast", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "light");
    await expect(page.locator(".cap-theme .cap-seg-options")).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-theme label:has(input:checked)", what: "the chosen choice's word" },
      { sel: ".cap-theme label:has(input:not(:checked))", what: "an unchosen choice's word" },
      { sel: ".cap-theme .cap-seg-options", what: "the control's edge", part: "border" },
      { sel: ".cap-theme label:has(input:checked)", what: "the chosen choice's edge", part: "border" },
    ]);
  });

  test("behaviour: the first visit follows the system and remembers nothing", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "first");
    // The system's theme is what the emulated colour scheme says; the control shows it and
    // nothing is written to storage until the person chooses. (The states page sets
    // data-theme itself from its ?theme= address, so the attribute says nothing here.)
    await expect(radio(page, theme === "dark" ? "Dark" : "Light")).toBeChecked();
    expect(await page.evaluate(() => localStorage.getItem("cap-theme-specimen-first"))).toBeNull();
  });

  test("behaviour: the light and dark specimens apply their choice to the page", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "light");
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await visitStates(page, "theme-switch", theme, "dark");
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
  });

  test("keyboard: an arrow key chooses the other theme, and the choice persists across a reload", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "first");
    const start = theme === "dark" ? "Dark" : "Light";
    const other = theme === "dark" ? "Light" : "Dark";
    await radio(page, start).focus();
    await page.keyboard.press("ArrowRight");
    await expect(radio(page, other)).toBeChecked();
    await expect(html(page)).toHaveAttribute("data-theme", other.toLowerCase());
    await page.reload();
    await expect(radio(page, other)).toBeChecked();
    await expect(html(page)).toHaveAttribute("data-theme", other.toLowerCase());
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
