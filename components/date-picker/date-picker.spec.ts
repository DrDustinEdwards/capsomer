import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const calendar = (page: Page) => page.getByRole("dialog", { name: "Choose a date" });
const day = (page: Page, iso: string) => calendar(page).locator(`td[data-date='${iso}']`);

eachTheme((theme) => {
  test("accessibility: no axe violations, closed and open", async ({ page }) => {
    await visitStates(page, "date-picker", theme);
    await expectNoAxeViolations(page);
    await visitStates(page, "date-picker", theme, "open");
    await expect(calendar(page)).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: days, the chosen day and the month reach their contrast", async ({ page }) => {
    await visitStates(page, "date-picker", theme, "open");
    await expect(day(page, "2026-11-14")).toBeFocused();
    await expectContrast(page, [
      { sel: ".cap-date-picker-head .cap-dialog-title", what: "the month" },
      { sel: ".cap-date-picker-grid th", what: "a day's name" },
      { sel: "td[data-date='2026-11-20']", what: "a day" },
      { sel: "td[aria-selected='true']", what: "the chosen day" },
      { sel: "td[aria-disabled='true']", what: "a day that cannot be chosen" },
      { sel: "td[data-date='2026-11-14']", what: "the focused day's ring", part: "outline", min: 3 },
    ]);
  });

  test("keyboard: the calendar opens on the input's date and the APG keys move the day", async ({ page }) => {
    await visitStates(page, "date-picker", theme);
    await page.getByRole("button", { name: "Change date, Saturday, November 14, 2026" }).press("Enter");
    await expect(day(page, "2026-11-14")).toBeFocused();
    await expect(day(page, "2026-11-14")).toHaveAttribute("aria-selected", "true");
    await expect(calendar(page).getByRole("grid", { name: "November 2026" })).toBeVisible();
    const moves: Array<[string, string]> = [
      ["ArrowRight", "2026-11-15"],
      ["ArrowDown", "2026-11-22"],
      ["ArrowLeft", "2026-11-21"],
      ["ArrowUp", "2026-11-14"],
      ["Home", "2026-11-08"],
      ["End", "2026-11-14"],
      ["PageDown", "2026-12-14"],
      ["PageUp", "2026-11-14"],
      ["Shift+PageDown", "2027-11-14"],
      ["Shift+PageUp", "2026-11-14"],
    ];
    for (const [key, iso] of moves) {
      await page.keyboard.press(key);
      await expect(day(page, iso), key).toBeFocused();
    }
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(calendar(page)).toBeHidden();
    await expect(page.locator("#dp-due")).toHaveValue("2026-11-15");
    await expect(page.getByRole("button", { name: "Change date, Sunday, November 15, 2026" })).toBeFocused();
  });

  test("keyboard: Esc closes with nothing changed; the month buttons keep focus; Tab stays inside", async ({ page }) => {
    await visitStates(page, "date-picker", theme);
    const open = page.locator("#dp-due").locator("xpath=..").getByRole("button");
    await open.press("Enter");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Shift+Tab");
    const next = calendar(page).getByRole("button", { name: "Next year" });
    await expect(next).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(calendar(page).getByRole("button", { name: "Next month" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(calendar(page).getByRole("heading")).toHaveText("December 2026");
    await expect(calendar(page).getByRole("button", { name: "Next month" })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(day(page, "2026-12-15")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(calendar(page).getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(calendar(page).getByRole("button", { name: "Choose" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(calendar(page).getByRole("button", { name: "Previous year" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(calendar(page)).toBeHidden();
    await expect(page.locator("#dp-due")).toHaveValue("2026-11-14");
    await expect(open).toBeFocused();
  });

  test("keyboard: a day before the minimum cannot be chosen; Choose takes the focused day", async ({ page }) => {
    await visitStates(page, "date-picker", theme, "open");
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowUp");
    await expect(day(page, "2026-11-01")).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Enter");
    await expect(calendar(page)).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await calendar(page).getByRole("button", { name: "Choose" }).click();
    await expect(page.locator("#dp-open")).toHaveValue("2026-11-15");
  });

  test("behavior: a typed date that does not exist is wrong on leaving", async ({ page }) => {
    await visitStates(page, "date-picker", theme);
    const input = page.locator("#dp-due");
    await input.fill("2026-02-31");
    await input.blur();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription(/Enter a real date/);
  });
});

test.describe("with no script", () => {
  test.use({ javaScriptEnabled: false });
  test("behavior: the input alone takes the date, and the button that needs script is hidden", async ({ page }) => {
    await page.goto("components/date-picker/states.html");
    await expect(page.locator("#dp-due")).toBeEditable();
    await expect(page.locator("#dp-due").locator("xpath=..").locator("[data-cap-part='open']")).toBeHidden();
  });
});
