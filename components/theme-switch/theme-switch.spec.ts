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

  test("behaviour: the chosen choice has one marker, a fill at 3:1 against the page, and no underline", async ({ page }) => {
    await visitStates(page, "theme-switch", theme);
    const chosen = page.locator(".cap-theme-options > label:has(input:checked)").first();
    const r = await chosen.evaluate((el) => {
      const paint = (c: string) => {
        const x = document.createElement("canvas").getContext("2d")!;
        x.fillStyle = c;
        x.fillRect(0, 0, 1, 1);
        const [r, g, b] = [...x.getImageData(0, 0, 1, 1).data].map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
      };
      const [a, b] = [paint(getComputedStyle(el).backgroundColor), paint(getComputedStyle(document.body).backgroundColor)];
      return { shadow: getComputedStyle(el).boxShadow, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
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
