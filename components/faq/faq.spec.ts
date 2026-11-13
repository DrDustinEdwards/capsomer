import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the questions and answers reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "faq", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#faq-list .cap-faq-question", what: "a question" },
      { sel: "#faq-list .cap-faq-answer p", what: "an answer" },
    ]);
  });

  test("keyboard: opening one question closes the one open, with no script", async ({ page }) => {
    await visitStates(page, "faq", theme);
    const items = page.locator("#faq-accordion details");
    await expect(items.nth(0)).toHaveAttribute("open", "");
    await items.nth(1).locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(items.nth(1)).toHaveAttribute("open", "");
    await expect(items.nth(0)).not.toHaveAttribute("open");
  });

  test("accessibility: the questions are headings in the outline", async ({ page }) => {
    await visitStates(page, "faq", theme);
    await expect(page.locator("#faq-accordion").getByRole("heading", { level: 3 })).toHaveCount(3);
  });
});
