import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// Serves the states page with style-src 'self' (no inline styles), as the apps do, and
// records every violation. Base UI writes positions and visually-hidden styles as React
// style props; on the client React applies them through the CSSOM, which CSP allows. A
// violation here means something wrote a style attribute or a <style> element.
async function strictStyles(page: Page): Promise<void> {
  await page.route(/states\.html/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), "content-security-policy": "style-src 'self'" } });
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => w.__csp.push(`${e.violatedDirective}: ${e.sample || e.blockedURI}`));
  });
}

const site = (page: Page) => page.getByRole("combobox", { name: "Site", exact: true });

eachTheme((theme) => {
  test("accessibility: no axe violations, closed, disabled and invalid", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    await expect(site(page)).toBeVisible();
    await expectNoAxeViolations(page);
  });

  for (const state of ["open", "filtered", "no-match", "highlighted", "loading"]) {
    test(`accessibility: no axe violations, ${state}`, async ({ page }) => {
      await visitStates(page, "combobox", theme, state);
      await expect(page.locator(".cap-combobox-popup")).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: label, help, error, value and boundaries reach their contrast", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    await expect(site(page)).toBeVisible();
    await expectContrast(page, [
      { sel: "[data-mount='closed'] .cap-combobox-label", what: "the label" },
      { sel: "[data-mount='closed'] .cap-combobox-help", what: "the help text" },
      { sel: "[data-mount='chosen'] .cap-combobox-input", what: "the chosen value in the box" },
      { sel: "[data-mount='invalid'] .cap-combobox-error", what: "the error message" },
      { sel: "[data-mount='disabled'] .cap-combobox-help", what: "the disabled box's reason" },
      { sel: "[data-mount='closed'] .cap-combobox-group", what: "the box's border", part: "border" },
      { sel: "[data-mount='invalid'] .cap-combobox-group", what: "the invalid box's border", part: "border" },
      { sel: "[data-mount='closed'] .cap-combobox-trigger", what: "the open button's glyph", min: 3 },
    ]);
  });

  test("accessibility: options, the highlighted option, empty and loading text reach their contrast", async ({ page }) => {
    await visitStates(page, "combobox", theme, "open");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expectContrast(page, [{ sel: ".cap-combobox-item:not([data-highlighted]) .cap-combobox-item-label", what: "an option" }]);
    await page.locator(".cap-combobox-input").focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(".cap-combobox-item[data-highlighted]")).toHaveCount(1);
    await expectContrast(page, [{ sel: ".cap-combobox-item[data-highlighted] .cap-combobox-item-label", what: "the highlighted option on --accent-soft" }]);

    await visitStates(page, "combobox", theme, "no-match");
    await expectContrast(page, [{ sel: ".cap-combobox-empty", what: "the no-match message" }]);
    await visitStates(page, "combobox", theme, "loading");
    await expectContrast(page, [{ sel: ".cap-combobox-status", what: "the loading message" }]);
  });

  test("accessibility: the combobox's roles and names", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    await expect(page.locator("[data-mount='closed']")).toMatchAriaSnapshot(`
      - paragraph: Type to filter. Only a listed site can be chosen.
      - combobox "Site"
      - button "Show Site options"
    `);
    await expect(site(page)).toHaveAttribute("aria-expanded", "false");
    await expect(site(page)).toHaveAccessibleDescription("Type to filter. Only a listed site can be chosen.");
  });

  test("accessibility: the open list's roles and names", async ({ page }) => {
    await visitStates(page, "combobox", theme, "filtered");
    await expect(page.getByRole("listbox")).toMatchAriaSnapshot(`
      - listbox:
        - option "foxhound.app"
        - option "foxhound.app staging"
    `);
    await expect(page.getByRole("option")).toHaveCount(2);
  });

  test("keyboard: ArrowDown opens the list and moves through the options", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const input = site(page);
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("ArrowDown");
    const highlighted = page.locator(".cap-combobox-item[data-highlighted]");
    await expect(highlighted).toHaveCount(1);
    const first = await highlighted.textContent();
    await expect(input).toHaveAttribute("aria-activedescendant", (await highlighted.getAttribute("id")) ?? "missing");
    await page.keyboard.press("ArrowDown");
    await expect(highlighted).toHaveCount(1);
    expect(await highlighted.textContent()).not.toBe(first);
    await expect(input).toBeFocused();
  });

  test("keyboard: Enter chooses the highlighted option and closes the list", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const input = site(page);
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const label = (await page.locator(".cap-combobox-item[data-highlighted]").textContent())?.trim() ?? "";
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(input).toHaveValue(label);
    await expect(page.locator("[data-mount='closed'] [data-chosen]")).not.toHaveAttribute("data-chosen", "");
  });

  test("keyboard: Esc closes the list and keeps focus in the box", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const input = site(page);
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-expanded", "false");
  });

  test("keyboard: typing filters the list", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    await site(page).focus();
    await page.keyboard.type("recova");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option")).toHaveCount(2);
    await expect(page.getByRole("option", { name: "Recova merchant" })).toBeVisible();
  });

  test("behaviour: text that matches no option is not kept", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const input = site(page);
    await input.focus();
    await page.keyboard.type("carrel");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("Carrel");
    await input.fill("not a site");
    await page.keyboard.press("Tab");
    await expect(input).toHaveValue("Carrel");
    await expect(page.locator("[data-mount='closed'] [data-chosen]")).toHaveAttribute("data-chosen", "carrel");
  });

  test("behaviour: no match names the typed text", async ({ page }) => {
    await visitStates(page, "combobox", theme, "no-match");
    await expect(page.locator(".cap-combobox-empty")).toContainText("No match for “foxhund”");
    await expect(page.getByRole("option")).toHaveCount(0);
  });

  test("behaviour: loading says so, and never says no match", async ({ page }) => {
    await visitStates(page, "combobox", theme, "loading");
    await expect(page.getByRole("status").filter({ hasText: "Loading sites" })).toBeVisible();
    await expect(page.locator(".cap-combobox-empty")).toHaveText("");
  });

  test("behaviour: disabled ignores input and says why", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const input = page.getByRole("combobox", { name: "Site to back up" });
    await expect(input).toBeDisabled();
    await expect(input).toHaveValue("Capsid Portal");
    await expect(input).toHaveAccessibleDescription("Locked while capsid deploys. It unlocks when the deploy ends.");
  });

  test("behaviour: invalid is marked and described by its message", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const input = page.getByRole("combobox", { name: "Site to watch (required)" });
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription("Choose a site from the list. The watcher only checks sites it knows.");
  });

  test("behaviour: the popup is as wide as the box and below it", async ({ page }) => {
    await visitStates(page, "combobox", theme, "open");
    const box = await page.locator(".cap-combobox-group").boundingBox();
    const popup = await page.locator(".cap-combobox-popup").boundingBox();
    expect(box && popup).toBeTruthy();
    if (box && popup) {
      expect(Math.abs(popup.width - box.width)).toBeLessThan(1.5);
      expect(popup.y).toBeGreaterThanOrEqual(box.y + box.height);
    }
  });

  test("behaviour: works under style-src 'self' with no violation", async ({ page }) => {
    await strictStyles(page);
    await visitStates(page, "combobox", theme);
    await site(page).focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.locator(".cap-combobox-positioner")).toHaveCSS("position", "absolute");
    const violations = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
    expect(violations).toEqual([]);
  });
});
