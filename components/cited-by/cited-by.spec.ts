import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test.beforeEach(async ({ page }) => {
    await visitStates(page, "cited-by", theme);
    await expect(page.locator('[data-mount="capped"] .cap-cited-by')).toHaveCount(1);
  });

  test("accessibility: no axe violations", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("accessibility: the count, its source and the list reach their contrast", async ({
    page,
  }) => {
    await expectContrast(page, [
      { sel: '[data-mount="count"] a', what: "the count's link" },
      { sel: '[data-mount="count"] .cap-cited-by-source', what: "the count's source" },
      { sel: '[data-mount="list"] .cap-cited-by-list a', what: "a citing work's link" },
      { sel: '[data-mount="list"] li .cap-cited-by-source', what: "a venue and year" },
    ]);
  });

  test("behavior: no count below 1, and a capped list says N of M", async ({ page }) => {
    await expect(page.locator('[data-mount="count-zero"]')).toBeEmpty();
    await expect(page.getByRole("region", { name: "Cited by 5 of 40" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Cited by 3", exact: true })).toBeVisible();
    const capped = page.locator('[data-mount="capped"]');
    await expect(capped.locator(".cap-cited-by > .cap-cited-by-source")).toHaveText(
      "Example Index, read an unrecorded date. Newest first.",
    );
    await expect(capped.getByRole("link", { name: "10.5555/example.2024.007" })).toHaveAttribute(
      "href",
      "https://doi.org/10.5555/example.2024.007",
    );
    await expect(capped.locator("li").last()).toHaveText("Spring update");
  });
});
