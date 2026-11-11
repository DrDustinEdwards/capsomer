import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "scope-chip", theme);
    await expectNoAxeViolations(page);
  });
});

test("behavior: choosing a scope submits the form with the kept values; Show stays only with no script", async ({
  page,
}) => {
  await visitStates(page, "scope-chip", "light");
  await expect(page.locator("#scope-all .cap-scope-submit")).toBeHidden();
  await expect(page.locator("#scope-noscript .cap-scope-submit")).toBeVisible();
  await page.getByRole("combobox", { name: "Show posts from" }).selectOption("example-net");
  await expect(page).toHaveURL(/[?&]status=draft&site=example-net/);
});
