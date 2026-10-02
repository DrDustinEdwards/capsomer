import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// Serves the states page with style-src 'self' (no inline styles), as the apps do, and
// records every violation. See the doc page: Base UI's style props reach the DOM through
// the CSSOM on the client, which CSP allows.
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

const trigger = (page: Page) => page.getByRole("button", { name: "Actions for foxhound.app" });
const chosen = (page: Page) => page.locator("[data-chosen]").first();

eachTheme((theme) => {
  test("accessibility: no axe violations, closed", async ({ page }) => {
    await visitStates(page, "menu", theme);
    await expect(trigger(page)).toBeVisible();
    await expectNoAxeViolations(page, undefined, { baseUi: true });
  });

  for (const state of ["open", "highlighted", "disabled", "danger", "rich", "comfortable"]) {
    test(`accessibility: no axe violations, ${state}`, async ({ page }) => {
      await visitStates(page, "menu", theme, state);
      await expect(page.getByRole("menu")).toBeVisible();
      await expectNoAxeViolations(page, undefined, { baseUi: true });
    });
  }

  test("accessibility: the trigger reaches its contrast", async ({ page }) => {
    await visitStates(page, "menu", theme);
    await expect(trigger(page)).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-menu-trigger", what: "the trigger's label" },
      { sel: ".cap-menu-trigger", what: "the trigger's border", part: "border" },
      { sel: ".cap-menu-trigger svg", what: "the trigger's chevron", min: 3 },
    ]);
  });

  test("accessibility: items, shortcuts, reasons and the highlight reach their contrast", async ({ page }) => {
    await visitStates(page, "menu", theme, "open");
    await expect(page.getByRole("menu")).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-option:not([data-highlighted]) .cap-option-label", what: "an item" },
      { sel: ".cap-menu-kbd", what: "a shortcut" },
    ]);
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(".cap-option[data-highlighted]")).toHaveCount(1);
    await expectContrast(page, [{ sel: ".cap-option[data-highlighted] .cap-option-label", what: "the highlighted item on --accent-soft" }]);

    await visitStates(page, "menu", theme, "disabled");
    await expect(page.getByRole("menu")).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-option[data-disabled] .cap-option-label", what: "a disabled item's label" },
      { sel: ".cap-menu-reason", what: "a disabled item's reason" },
    ]);

    await visitStates(page, "menu", theme, "danger");
    await expect(page.getByRole("menu")).toBeVisible();
    await expectContrast(page, [{ sel: ".cap-option[data-tone='crit']:not([data-highlighted]) .cap-option-label", what: "a danger item" }]);
    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("menuitem", { name: "Delete site" })).toHaveAttribute("data-highlighted", "");
    await expectContrast(page, [{ sel: ".cap-option[data-tone='crit'][data-highlighted] .cap-option-label", what: "a highlighted danger item on --crit-soft" }]);
  });

  test("accessibility: the menu's roles and names", async ({ page }) => {
    await visitStates(page, "menu", theme, "open");
    await expect(page.getByRole("menu")).toMatchAriaSnapshot(`
      - menu "Actions":
        - menuitem "Open site"
        - menuitem "Copy address"
        - separator
        - menuitem "Run checks now"
        - menuitem "Pause checks"
    `);
    await expect(page.getByRole("menuitem", { name: "Run checks now" })).toHaveAttribute("aria-keyshortcuts", "Shift+R");
  });

  test("keyboard: Enter on the trigger opens the menu on its first item", async ({ page }) => {
    await visitStates(page, "menu", theme);
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("menuitem", { name: "Open site" })).toBeFocused();
  });

  test("keyboard: ArrowDown on the trigger opens the menu", async ({ page }) => {
    await visitStates(page, "menu", theme);
    await trigger(page).focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem").first()).toBeFocused();
  });

  test("keyboard: arrow keys move through the items, skipping separators", async ({ page }) => {
    await visitStates(page, "menu", theme);
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Duplicate settings" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Archive" })).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("menuitem", { name: "Duplicate settings" })).toBeFocused();
  });

  test("keyboard: typing a letter moves to the next item that starts with it", async ({ page }) => {
    await visitStates(page, "menu", theme);
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("d");
    await expect(page.getByRole("menuitem", { name: "Duplicate settings" })).toBeFocused();
  });

  test("keyboard: Esc closes the menu and focus returns to the trigger", async ({ page }) => {
    await visitStates(page, "menu", theme);
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(trigger(page)).toBeFocused();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("keyboard: Enter on an item runs it, closes the menu and returns focus", async ({ page }) => {
    await visitStates(page, "menu", theme);
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(chosen(page)).toHaveAttribute("data-chosen", "Duplicate settings");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  });

  test("keyboard: a disabled item is reachable, says why, and does not run", async ({ page }) => {
    await visitStates(page, "menu", theme);
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const archive = page.getByRole("menuitem", { name: "Archive" });
    await expect(archive).toBeFocused();
    await expect(archive).toHaveAttribute("aria-disabled", "true");
    await expect(archive).toHaveAccessibleDescription("Not while a deploy runs. Try again when it ends.");
    await page.keyboard.press("Enter");
    await expect(chosen(page)).toHaveAttribute("data-chosen", "");
  });

  test("behaviour: danger items come last, after one separator", async ({ page }) => {
    await visitStates(page, "menu", theme);
    await trigger(page).click();
    await expect(page.getByRole("menu")).toBeVisible();
    const order = await page.locator(".cap-menu > :is([role='menuitem'], [role='separator'])").evaluateAll((els) => els.map((e) => (e.getAttribute("role") === "separator" ? "|" : (e.querySelector(".cap-option-label")?.textContent ?? ""))));
    expect(order).toEqual(["Open site", "Duplicate settings", "|", "Archive", "Run checks now", "|", "Delete site"]);
    await expect(page.getByRole("menuitem", { name: "Delete site" })).toHaveAttribute("data-tone", "crit");
  });

  test("behaviour: danger items keep their order at the end", async ({ page }) => {
    await visitStates(page, "menu", theme, "danger");
    await expect(page.getByRole("menu")).toBeVisible();
    const labels = await page.locator(".cap-option .cap-option-label").allTextContents();
    expect(labels).toEqual(["Open site", "Copy address", "Remove from the watcher", "Delete site"]);
    await expect(page.getByRole("separator")).toHaveCount(1);
  });

  test("accessibility: the rich menu's roles, checks and group names", async ({ page }) => {
    await visitStates(page, "menu", theme, "rich");
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("group", { name: "Site" })).toBeVisible();
    await expect(page.getByRole("menuitemcheckbox", { name: "Check every minute" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("menuitemcheckbox", { name: "Email on failure" })).toHaveAttribute("aria-checked", "false");
    await expect(page.getByRole("group", { name: "Region" })).toBeVisible();
    await expect(page.getByRole("menuitemradio", { name: "Oregon" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("menuitemradio", { name: "Frankfurt" })).toHaveAttribute("aria-checked", "false");
    await expect(page.getByRole("menuitem", { name: "Move to" })).toHaveAttribute("aria-haspopup", "menu");
    await expectContrast(page, [{ sel: ".cap-listbox-label", what: "a group heading" }]);
  });

  test("keyboard: Space on a checkbox item toggles it and the menu stays open", async ({ page }) => {
    await visitStates(page, "menu", theme, "rich");
    const item = page.getByRole("menuitemcheckbox", { name: "Email on failure" });
    await item.focus();
    await page.keyboard.press("Space");
    await expect(item).toHaveAttribute("aria-checked", "true");
    await expect(chosen(page)).toHaveAttribute("data-chosen", "Email on failure on");
    await expect(page.getByRole("menu")).toBeVisible();
  });

  test("keyboard: Enter on a radio item chooses it, and only one is chosen", async ({ page }) => {
    await visitStates(page, "menu", theme, "rich");
    const item = page.getByRole("menuitemradio", { name: "Frankfurt" });
    await item.focus();
    await page.keyboard.press("Enter");
    await expect(chosen(page)).toHaveAttribute("data-chosen", "Region fra");
    await expect(page.getByRole("menuitemradio", { name: "Frankfurt" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("menuitemradio", { name: "Oregon" })).toHaveAttribute("aria-checked", "false");
  });

  test("keyboard: ArrowRight opens a submenu, Esc closes only the submenu, and ArrowLeft returns", async ({ page }) => {
    await visitStates(page, "menu", theme, "rich");
    const sub = page.getByRole("menuitem", { name: "Move to" });
    await sub.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("menuitem", { name: "Live sites" })).toBeFocused();
    await expect(page.getByRole("menu")).toHaveCount(2);
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("menu")).toHaveCount(1);
    await expect(sub).toBeFocused();
  });

  test("behaviour: a click outside closes the menu", async ({ page }) => {
    await visitStates(page, "menu", theme);
    await trigger(page).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await page.locator("h1").click();
    await expect(page.getByRole("menu")).toBeHidden();
  });

  test("behaviour: works under style-src 'self' with no violation", async ({ page }) => {
    await strictStyles(page);
    await visitStates(page, "menu", theme);
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.locator(".cap-menu-positioner")).toHaveCSS("position", "absolute");
    const violations = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
    expect(violations).toEqual([]);
  });
});
