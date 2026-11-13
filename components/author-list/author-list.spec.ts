import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test.beforeEach(async ({ page }) => {
    await visitStates(page, "author-list", theme);
    await expect(page.locator('[data-mount="open"] details[open]')).toHaveCount(1);
  });

  test("accessibility: no axe violations", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("accessibility: names and the owner's name reach their contrast", async ({ page }) => {
    await expectContrast(page, [
      { sel: '[data-mount="short"] .cap-author-list', what: "a name" },
      { sel: '[data-mount="short"] .cap-author-list-owner', what: "the owner's name" },
      { sel: '[data-mount="owner-late"] .cap-author-list-more', what: "the count of more names" },
    ]);
  });

  test("keyboard: Enter on the summary opens the full list, with its links", async ({ page }) => {
    const late = page.locator('[data-mount="owner-late"]');
    const summary = late.locator("summary");
    await expect(summary).toHaveText("Sam Lee, Jordan Park, ... Alex Rivera and 5 more");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(late.locator("details")).toHaveAttribute("open", "");
    await expect(late.locator(".cap-author-list-full")).toContainText("Drew Patel");
    await page.keyboard.press("Space");
    await expect(late.locator("details")).not.toHaveAttribute("open", "");
  });

  test("behavior: names link where given, and the summary holds no link", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Jordan Park" })).toHaveAttribute(
      "href",
      "https://example.org/jordan-park",
    );
    await expect(page.locator("summary a")).toHaveCount(0);
  });
});
