import { expect, test, type Page } from "@playwright/test";
import { FAMILIES, themes } from "../../tokens/palette-core.mjs";
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

  test("accessibility: the switch's roles and names, two choices and no System", { tag: "@markup" }, async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "light");
    await expect(page.locator(".cap-theme")).toMatchAriaSnapshot(`
      - group "Theme":
        - radio "Light" [checked]
        - radio "Dark"
    `);
    await expect(radio(page, "System")).toHaveCount(0);
  });

  test("accessibility: the choices are drawn as one control with an icon each, and reach their contrast", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "light");
    await expect(page.locator(".cap-theme-options")).toBeVisible();
    await expect(page.locator(".cap-theme-options svg[aria-hidden='true']")).toHaveCount(2);
    await expectContrast(page, [
      { sel: ".cap-theme label:has(input:checked)", what: "the chosen choice's word" },
      { sel: ".cap-theme label:has(input:not(:checked))", what: "an unchosen choice's word" },
      { sel: ".cap-theme-options", what: "the control's edge", part: "border" },
    ]);
  });

  test("accessibility: the states page's hover, disabled and comfortable rows have no violations", async ({ page }) => {
    await visitStates(page, "theme-switch", theme);
    await expectNoAxeViolations(page, "section[aria-labelledby='s-states']");
    await expect(page.locator("section[aria-labelledby='s-states'] [data-density='comfortable'] .cap-theme-options")).toBeVisible();
  });

  test("behavior: the chosen choice has one marker, a fill at 3:1 against the page, and no underline", async ({ page }) => {
    await visitStates(page, "theme-switch", theme);
    const chosen = page.locator(".cap-theme-options > label:has(input:checked)").first();
    const r = await chosen.evaluate((el) => {
      return { shadow: getComputedStyle(el).boxShadow, ratio: window.capRatio(getComputedStyle(el).backgroundColor, getComputedStyle(document.body).backgroundColor) };
    });
    expect(r.shadow, "no second marker (an underline)").toBe("none");
    expect(r.ratio).toBeGreaterThanOrEqual(3);
  });

  test("keyboard: the chosen choice shows a focus ring", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "light");
    await page.keyboard.press("Tab");
    await expect(radio(page, "Light")).toBeFocused();
    await expect(page.locator(".cap-theme label:has(input:focus-visible)")).toHaveCount(1);
  });

  test("behavior: the first visit follows the system and remembers nothing", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "first");
    // The system's theme is what the emulated color scheme says; the control shows it and
    // nothing is written to storage until the person chooses. (The states page sets
    // data-theme itself from its ?theme= address, so the attribute says nothing here.)
    await expect(radio(page, theme === "dark" ? "Dark" : "Light")).toBeChecked();
    expect(await page.evaluate(() => localStorage.getItem("cap-theme-specimen-first"))).toBeNull();
  });

  test("behavior: the light and dark specimens apply their choice to the page", async ({ page }) => {
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

  test("accessibility: the button form names what it does, switches, remembers, and shows its name and key on focus", async ({ page }) => {
    await visitStates(page, "theme-switch", theme, "button");
    await expectNoAxeViolations(page);
    const button = page.locator(".cap-theme-button");
    const other = theme === "dark" ? "light" : "dark";
    await expect(button).toHaveAccessibleName(`Switch to ${other} theme`);
    await expect(page.getByRole("radio")).toHaveCount(0);
    await button.focus();
    const tip = button.locator(".cap-theme-tip");
    await expect(tip).toBeVisible();
    await expect(tip).toContainText(`Switch to ${other} theme`);
    await expect(tip.locator("kbd")).toHaveText("T");
    expect(await button.getAttribute("aria-describedby")).toBeNull();
    await expectContrast(page, [{ sel: ".cap-theme-button", what: "the button's glyph" }]);
    await page.keyboard.press("Enter");
    await expect(html(page)).toHaveAttribute("data-theme", other);
    await expect(button).toHaveAccessibleName(`Switch to ${theme} theme`);
    await page.reload();
    await expect(html(page)).toHaveAttribute("data-theme", other);
    await expect(page.locator(".cap-theme-button")).toHaveAccessibleName(`Switch to ${theme} theme`);
    // The T key and the button agree.
    await page.keyboard.press("t");
    await expect(html(page)).toHaveAttribute("data-theme", theme);
    await expect(page.locator(".cap-theme-button")).toHaveAccessibleName(`Switch to ${other} theme`);
  });
});

// The device's "increase contrast" setting turns on the generated stronger set, in the theme the
// person chose with the switch as well as in the system's (the dark mode plan, 2026-10-29).
for (const theme of ["light", "dark"] as const) {
  test(`behavior: prefers-contrast: more applies the stronger ${theme} set, with ${theme} chosen in the switch`, async ({ page }) => {
    const other = theme === "dark" ? "light" : "dark";
    await page.emulateMedia({ colorScheme: other, contrast: "more" });
    await visitStates(page, "theme-switch", theme);
    await page.evaluate((choice) => document.documentElement.setAttribute("data-theme", choice), theme);
    const t = themes(FAMILIES.purple);
    const base = t[theme].tokens;
    const more = t[`${theme}More`].tokens;
    const changed = ["muted", "line-strong", "ring", "accent-text", "line"].filter((k) => more[k] !== base[k]);
    expect(changed.length).toBeGreaterThan(0);
    for (const k of changed) {
      const painted = await page.evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim(), k);
      expect(painted, `--${k}`).toBe(more[k]);
    }
  });
}
