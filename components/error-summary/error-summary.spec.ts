import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// Field's submit check writing the summary, and the title prefix, are tested in field.spec.ts.
eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "error-summary", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the title, links and edge reach their contrast", async ({ page }) => {
    await visitStates(page, "error-summary", theme);
    await expectContrast(page, [
      { sel: "#es-static-t", what: "the title" },
      { sel: "#es-static .cap-error-summary-list a", what: "a link to a field" },
      { sel: "#es-static .cap-error-summary", what: "the summary's edge", part: "border" },
    ]);
  });

  test("keyboard: Tab reaches the links; Enter on one puts focus in its field", async ({ page }) => {
    await visitStates(page, "error-summary", theme);
    const summary = page.getByRole("alert", { name: "There is a problem" }).first();
    await summary.focus();
    await page.keyboard.press("Tab");
    await expect(summary.getByRole("link", { name: "Give the job a name, such as Nightly backup." })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("radio", { name: "Hour" })).toBeFocused();
    await summary.getByRole("link", { name: "Give the job a name, such as Nightly backup." }).press("Enter");
    await expect(page.getByRole("textbox", { name: "Job name" })).toBeFocused();
  });

  test("keyboard: a failed submit in the live form takes focus to a new summary with a ring", async ({ page }) => {
    await visitStates(page, "error-summary", theme);
    await page.getByRole("button", { name: "Add site" }).focus();
    await page.keyboard.press("Enter");
    const summary = page.locator("#es-live .cap-error-summary");
    await expect(summary).toBeFocused();
    await expect(summary.getByRole("link")).toHaveCount(2);
    await expectContrast(page, [{ sel: "#es-live .cap-error-summary", what: "the summary's focus ring", part: "outline", min: 3 }]);
  });
});
