import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "rating", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: a rating is one image named by its value; the input is a select", async ({
    page,
  }) => {
    await visitStates(page, "rating", theme);
    await expect(page.getByRole("img", { name: "3.5 out of 5 stars" })).toBeVisible();
    const select = page.getByLabel("Your rating");
    await select.selectOption("2.5");
    await expect(page.locator("#sample-input .cap-rating-stars")).toHaveAttribute("data-half", "5");
  });
});
