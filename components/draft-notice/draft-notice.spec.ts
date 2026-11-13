import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test.beforeEach(async ({ page }) => {
    await visitStates(page, "draft-notice", theme);
    await expect(page.locator('[data-mount="words"] .cap-draft-notice')).toHaveCount(1);
  });

  test("accessibility: no axe violations", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("accessibility: the word, its box and the sentence reach their contrast", async ({
    page,
  }) => {
    await expectContrast(page, [
      { sel: "#sample-default .cap-draft-notice-tag", what: "the word Draft" },
      { sel: "#sample-default .cap-draft-notice-tag", what: "the dashed box", part: "border" },
      { sel: "#sample-default > span:last-child", what: "the sentence" },
    ]);
  });

  test("behavior: the notice reads as one sentence, and show={false} draws nothing", async ({
    page,
  }) => {
    await expect(page.locator("#sample-default")).toHaveText("Draft:Only you can see this page.");
    await expect(page.locator('[data-mount="words"]')).toHaveText(
      "Preview:Only editors at Example Co can see this version.",
    );
    await expect(page.locator('[data-mount="hidden"]')).toBeEmpty();
  });
});
