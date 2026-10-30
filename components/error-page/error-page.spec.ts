import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, the stack included", async ({ page }) => {
    for (const only of ["not-found", "server", "dev"]) {
      await visitStates(page, "error-page", theme, only);
      await expectNoAxeViolations(page);
    }
  });

  test("accessibility: the title and the sentence reach their contrast", async ({ page }) => {
    await visitStates(page, "error-page", theme, "dev");
    await expectContrast(page, [
      { sel: ".cap-error-page .cap-empty-title", what: "failed title" },
      { sel: ".cap-error-page .cap-empty-text", what: "the sentence" },
      { sel: ".cap-error-page-stack code", what: "the stack" },
    ]);
  });

  test("behavior: each status says its own words, is never indexed, and shows no stack outside development", async ({ page }) => {
    const cases = [
      { only: "not-found", title: "Page not found", retry: 0 },
      { only: "gone", title: "This page is gone", retry: 0 },
      { only: "server", title: "Something went wrong", retry: 1 },
    ];
    for (const c of cases) {
      await visitStates(page, "error-page", theme, c.only);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(c.title);
      await expect(page.locator('head meta[name="robots"][content="noindex"]')).toHaveCount(1);
      await expect(page.getByRole("link", { name: "Try again" })).toHaveCount(c.retry);
      await expect(page.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "#home");
      await expect(page.locator(".cap-error-page-stack")).toHaveCount(0);
    }
    // A thrown error's message never reaches the page outside development.
    await expect(page.getByText("D1 timed out")).toHaveCount(0);
  });

  test("keyboard: the site header's skip link comes first and moves to main", async ({ page }) => {
    await visitStates(page, "error-page", theme, "not-found");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /skip/i })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    await expect(page.getByRole("banner")).toBeVisible();
  });
});
