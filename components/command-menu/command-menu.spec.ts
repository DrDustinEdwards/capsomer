import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const menu = (page: Page) => page.getByRole("dialog", { name: "Command menu" });
const box = (page: Page) => page.getByRole("combobox", { name: "Search commands" });
const shownOptions = (page: Page) => page.getByRole("option");

async function activeName(page: Page): Promise<string> {
  return page.evaluate(() => {
    const input = document.querySelector("[role='combobox']");
    const id = input?.getAttribute("aria-activedescendant");
    return (id && document.getElementById(id)?.querySelector(".cap-cmd-option-label")?.textContent) || "";
  });
}

async function openFromButton(page: Page, theme: "light" | "dark") {
  await visitStates(page, "command-menu", theme, "closed");
  const btn = page.getByRole("button", { name: /Commands/ });
  await btn.focus();
  await page.keyboard.press("Enter");
  await expect(menu(page)).toBeVisible();
  return btn;
}

eachTheme((theme) => {
  test("accessibility: no axe violations, the states page", async ({ page }) => {
    await visitStates(page, "command-menu", theme);
    await expectNoAxeViolations(page);
  });

  for (const id of ["closed", "open", "filtered", "stops", "nomatch", "active"]) {
    test(`accessibility: no axe violations, ${id}`, async ({ page }) => {
      await visitStates(page, "command-menu", theme, id);
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: options, the active option, key caps and the label reach their contrast", async ({ page }) => {
    await visitStates(page, "command-menu", theme, "active");
    await expect(menu(page)).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-cmd-option[aria-selected='true'] .cap-cmd-option-label", what: "the active option on accent-soft" },
      { sel: ".cap-cmd-option[aria-selected='false'] .cap-cmd-option-label", what: "an option" },
      { sel: ".cap-cmd-option[aria-selected='true'] kbd", what: "a key cap in the active option" },
      { sel: ".cap-cmd-option[aria-selected='false'] kbd", what: "a key cap" },
      { sel: ".cap-cmd-option kbd", what: "a key cap's boundary", part: "border" },
      { sel: ".cap-cmd-group-title", what: "a group heading" },
      { sel: ".cap-cmd-label", what: "the input's label" },
      { sel: ".cap-cmd-input", what: "typed text" },
      { sel: ".cap-cmd-foot", what: "the key hints" },
    ]);
    await visitStates(page, "command-menu", theme, "stops");
    await expectContrast(page, [{ sel: ".cap-cmd-hint", what: "a stop's hint" }]);
    await visitStates(page, "command-menu", theme, "nomatch");
    await expectContrast(page, [{ sel: ".cap-cmd-empty", what: "the no-match line" }]);
  });

  test("accessibility: the menu's roles and names", async ({ page }) => {
    await visitStates(page, "command-menu", theme, "open");
    await expect(menu(page)).toMatchAriaSnapshot(`
      - dialog "Command menu":
        - combobox "Search commands" [expanded]
        - listbox "Commands":
          - group "Go to":
            - option /Overview\\s*,\\s*shortcut g o/ [selected]
            - option /Sites/
            - option /Queue/
          - group "Stop":
            - option /Pause capsomer\\s*,\\s*asks a reason/
            - option /Revoke foxhound-driver\\s*,\\s*preview first/
          - group "Actions":
            - option /Refresh now\\s*,\\s*shortcut r/
          - group "Copy":
            - option "Copy the command for the blocked capsomer job"
          - group "Help":
            - option /Show keyboard shortcuts/
    `);
  });

  test("keyboard: Ctrl K (Cmd K on a Mac) opens the menu with focus in the search", async ({ page }) => {
    await visitStates(page, "command-menu", theme, "closed");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(menu(page)).toBeVisible();
    await expect(box(page)).toBeFocused();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(menu(page)).toBeHidden();
  });

  test("keyboard: / opens the menu", async ({ page }) => {
    await visitStates(page, "command-menu", theme, "closed");
    await page.keyboard.press("/");
    await expect(menu(page)).toBeVisible();
    await expect(box(page)).toBeFocused();
    await expect(box(page)).toHaveValue("");
  });

  test("keyboard: arrow keys move the active option", async ({ page }) => {
    await openFromButton(page, theme);
    expect(await activeName(page)).toBe("Overview");
    await page.keyboard.press("ArrowDown");
    expect(await activeName(page)).toBe("Sites");
    await expect(page.getByRole("option", { name: /Sites/ })).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    expect(await activeName(page)).toBe("Sites");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    expect(await activeName(page)).toBe("Overview");
    await expect(box(page)).toBeFocused();
  });

  test("keyboard: Enter runs the active command and closes the menu", async ({ page }) => {
    await openFromButton(page, theme);
    await page.keyboard.type("refresh");
    expect(await activeName(page)).toBe("Refresh now");
    await page.keyboard.press("Enter");
    await expect(menu(page)).toBeHidden();
    await expect(page.getByRole("status")).toHaveText("Ran: Refresh now");
  });

  test("keyboard: Esc closes the menu and focus returns to its button", async ({ page }) => {
    const btn = await openFromButton(page, theme);
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
    await expect(btn).toBeFocused();
  });

  test("keyboard: typing filters by label and keywords, case-insensitive", async ({ page }) => {
    await openFromButton(page, theme);
    await page.keyboard.type("CK");
    await expect(shownOptions(page)).toHaveCount(3);
    await expect(page.getByRole("group", { name: "Help" })).toBeHidden();
    expect(await activeName(page)).toBe("Sites");
    await box(page).fill("dashboard");
    await expect(shownOptions(page)).toHaveCount(1);
    expect(await activeName(page)).toBe("Overview");
    await box(page).fill("zebra");
    await expect(shownOptions(page)).toHaveCount(0);
    await expect(menu(page).getByRole("status")).toHaveText("No commands match “zebra”");
    await expect(box(page)).toHaveAttribute("aria-expanded", "false");
    await expect(box(page)).not.toHaveAttribute("aria-activedescendant", /.+/);
  });

  test("keyboard: typing stop, or pause, lists the stops, each saying what it asks, and running one only opens its control", async ({ page }) => {
    await openFromButton(page, theme);
    await page.keyboard.type("stop");
    await expect(shownOptions(page)).toHaveCount(2);
    await expect(page.getByRole("group", { name: "Stop" })).toBeVisible();
    await expect(page.getByRole("option", { name: /Pause capsomer\s*,\s*asks a reason/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /Revoke foxhound-driver\s*,\s*preview first/ })).toBeVisible();
    // No command stops everything.
    await box(page).fill("all");
    await expect(page.getByRole("option", { name: /Stop|Pause|Revoke/ })).toHaveCount(0);
    await box(page).fill("pause");
    await expect(shownOptions(page)).toHaveCount(2);
    await box(page).fill("pause everything");
    await expect(shownOptions(page)).toHaveCount(0);
    await box(page).fill("revoke");
    expect(await activeName(page)).toBe("Revoke foxhound-driver");
    await page.keyboard.press("Enter");
    await expect(menu(page)).toBeHidden();
    await expect(page.getByRole("status")).toHaveText("Ran: Revoke foxhound-driver opens its preview");
  });

  test("behaviour: the stops specimen shows what typing stop finds", async ({ page }) => {
    await visitStates(page, "command-menu", theme, "stops");
    await expect(box(page)).toHaveValue("stop");
    await expect(shownOptions(page)).toHaveCount(2);
  });

  test("behaviour: a click on an option runs it", async ({ page }) => {
    await openFromButton(page, theme);
    await page.getByRole("option", { name: /Switch light and dark/ }).click();
    await expect(menu(page)).toBeHidden();
    await expect(page.getByRole("status")).toHaveText("Ran: Switch light and dark");
  });

  test("behaviour: the filtered and no-match specimens show what was typed", async ({ page }) => {
    await visitStates(page, "command-menu", theme, "filtered");
    await expect(box(page)).toHaveValue("ck");
    await expect(shownOptions(page)).toHaveCount(3);
    await visitStates(page, "command-menu", theme, "nomatch");
    await expect(menu(page).getByRole("status")).toHaveText("No commands match “deploy to vercel”");
  });
});
