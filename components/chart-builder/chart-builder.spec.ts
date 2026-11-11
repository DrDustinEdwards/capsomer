import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, closed and open", async ({ page }) => {
    await visitStates(page, "chart-builder", theme);
    await expect(page.getByRole("button", { name: "Insert chart" }).first()).toBeVisible();
    await expectNoAxeViolations(page);
    await visitStates(page, "chart-builder", theme, "filled");
    await page.waitForFunction(() => document.documentElement.hasAttribute("data-specimen-ready"));
    await expect(page.getByRole("dialog", { name: "Insert a chart" })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: the dialog's notes and the check reach their contrast", async ({ page }) => {
    await visitStates(page, "chart-builder", theme, "filled");
    await page.waitForFunction(() => document.documentElement.hasAttribute("data-specimen-ready"));
    await expectContrast(page, [
      { sel: ".cap-chart-builder-check li", what: "a finding of the check" },
      { sel: ".cap-chart-builder-suggestion .cap-chart-builder-note", what: "the drafted finding" },
      { sel: ".cap-chart-builder-y legend", what: "the y columns' legend" },
    ]);
  });

  test("keyboard: Enter opens it with focus inside, Esc closes it back to the button, and Insert waits for a finding", async ({
    page,
  }) => {
    await visitStates(page, "chart-builder", theme);
    const full = page.locator("[data-mount=full]");
    const open = full.getByRole("button", { name: "Insert chart" });
    await open.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Insert a chart" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(":focus")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();

    await page.keyboard.press("Enter");
    await dialog
      .getByRole("textbox", { name: "Data, as CSV" })
      .fill("month,visits\nJan,1204\nFeb,1530");
    await expect(dialog.locator("select")).toHaveValue("month");
    await expect(dialog.getByRole("checkbox", { name: "visits" })).toBeChecked();
    const insert = dialog.getByRole("button", { name: "Insert chart" });
    await expect(insert).toHaveAttribute("aria-disabled", "true");
    await dialog.getByRole("textbox", { name: "Title" }).fill("Visits by month");
    await expect(dialog.getByRole("status")).toContainText("flags nothing");
    await dialog.getByRole("button", { name: "Use as the finding" }).press("Enter");
    await expect(dialog.getByRole("textbox", { name: "Finding" })).toHaveValue(
      "Visits changed across 2 months.",
    );
    await insert.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(page.locator("#inserted")).toHaveText(
      ':::chart{type="bar" x="month" y="visits" title="Visits by month" alt="Visits changed across 2 months."}\n```csv\nmonth,visits\nJan,1204\nFeb,1530\n```\n:::',
    );
    await expect(open).toBeFocused();
  });
});
