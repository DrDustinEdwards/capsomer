import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const sheet = (page: Page) => page.getByRole("dialog", { name: "Keyboard shortcuts" });
const said = (page: Page) => page.getByRole("status");

eachTheme((theme) => {
  test("accessibility: no axe violations, the states page", async ({ page }) => {
    await visitStates(page, "shortcuts", theme);
    await expectNoAxeViolations(page);
  });

  for (const id of ["page", "open", "off"]) {
    test(`accessibility: no axe violations, ${id}`, async ({ page }) => {
      await visitStates(page, "shortcuts", theme, id);
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: the sheet's text and key caps reach their contrast", async ({ page }) => {
    await visitStates(page, "shortcuts", theme, "open");
    await expect(sheet(page)).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-keys-title", what: "the sheet's title" },
      { sel: ".cap-keys-group-title", what: "a group heading" },
      { sel: ".cap-keys-list kbd", what: "a key cap" },
      { sel: ".cap-keys-list kbd", what: "a key cap's boundary", part: "border", min: 3 },
      { sel: ".cap-keys-list dd", what: "a shortcut's label" },
      { sel: ".cap-keys-about", what: "what a command is for, under its name" },
      { sel: ".cap-keys-note", what: "the note under the switch" },
    ]);
  });

  test("accessibility: the sheet's roles and names", async ({ page }) => {
    await visitStates(page, "shortcuts", theme, "open");
    await expect(sheet(page)).toMatchAriaSnapshot(`
      - dialog "Keyboard shortcuts":
        - heading "Keyboard shortcuts" [level=2]
        - button "Close"
        - heading "General" [level=3]
        - heading "Go to" [level=3]
        - heading "Actions" [level=3]
        - switch "Single-key shortcuts" [checked]
    `);
  });

  test("keyboard: ? opens the sheet, and Esc closes it", async ({ page }) => {
    await visitStates(page, "shortcuts", theme, "page");
    await page.keyboard.press("?");
    await expect(sheet(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
    await expect(sheet(page).getByText("Go to Overview")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet(page)).toBeHidden();
  });

  test("behaviour: the sheet says what a command is for, under its name", async ({ page }) => {
    await visitStates(page, "shortcuts", theme, "open");
    await expect(sheet(page).getByText("Go to Overview")).toContainText("Problems first, worst first; then the sites.");
  });

  test("keyboard: Ctrl K (Cmd K on a Mac) in the open sheet closes it and runs its shortcut; keys that match nothing leave it open", async ({ page }) => {
    await visitStates(page, "shortcuts", theme, "page");
    await page.keyboard.press("?");
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press("ControlOrMeta+c");
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(sheet(page)).toBeHidden();
    await expect(said(page)).toHaveText("The command menu opens here.");
  });

  test("keyboard: Esc closes the sheet and focus returns to the button that opened it", async ({ page }) => {
    await visitStates(page, "shortcuts", theme, "page");
    const open = page.getByRole("button", { name: "Keyboard shortcuts" });
    await open.focus();
    await page.keyboard.press("Enter");
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet(page)).toBeHidden();
    await expect(open).toBeFocused();
  });

  test("keyboard: g then o runs a two-key shortcut", async ({ page }) => {
    await visitStates(page, "shortcuts", theme, "page");
    await page.keyboard.press("g");
    await page.keyboard.press("o");
    await expect(said(page)).toHaveText("Went to Overview.");
  });

  test("keyboard: Ctrl K (Cmd K on a Mac) runs its shortcut", async ({ page }) => {
    await visitStates(page, "shortcuts", theme, "page");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(said(page)).toHaveText("The command menu opens here.");
  });

  test("keyboard: keys typed into a field are left alone", async ({ page }) => {
    await visitStates(page, "shortcuts", theme, "page");
    await page.getByRole("textbox", { name: "A note" }).focus();
    await page.keyboard.type("go r");
    await expect(page.getByRole("textbox", { name: "A note" })).toHaveValue("go r");
    await expect(said(page)).toHaveText("");
  });

  test("keyboard: with single-key shortcuts off, g o does nothing, and the choice is remembered", async ({ page }) => {
    await visitStates(page, "shortcuts", theme, "page");
    await page.keyboard.press("?");
    const sw = page.getByRole("switch", { name: "Single-key shortcuts" });
    await expect(sw).toBeChecked();
    await sw.focus();
    await page.keyboard.press("Space");
    await expect(sw).not.toBeChecked();
    await expect(sheet(page).locator(".cap-switch-state")).toHaveText("Off");
    await page.keyboard.press("Escape");
    await expect(sheet(page)).toBeHidden();
    await page.keyboard.press("g");
    await page.keyboard.press("o");
    await page.keyboard.press("?");
    await expect(said(page)).toHaveText("");
    await expect(sheet(page)).toBeHidden();
    // Shortcuts with Ctrl or Cmd keep working.
    await page.keyboard.press("ControlOrMeta+k");
    await expect(said(page)).toHaveText("The command menu opens here.");

    await page.reload();
    await page.keyboard.press("g");
    await page.keyboard.press("o");
    await expect(said(page)).toHaveText("");
    await page.getByRole("button", { name: "Keyboard shortcuts" }).click();
    await expect(page.getByRole("switch", { name: "Single-key shortcuts" })).not.toBeChecked();
  });

  test("behaviour: the off specimen shows the switch off", async ({ page }) => {
    await visitStates(page, "shortcuts", theme, "off");
    await expect(page.getByRole("switch", { name: "Single-key shortcuts" })).not.toBeChecked();
  });
});
