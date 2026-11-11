import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "form-status", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: a failure is an alert, a success a status, before a post an empty status", async ({
    page,
  }) => {
    await visitStates(page, "form-status", theme);
    await expect(page.locator("#sample-fail [role=alert]")).toContainText("The title is empty");
    await expect(page.locator("#sample-ok [role=status]")).toContainText("saved");
    await expect(page.locator("#sample-none [role=status]")).toHaveText("");
  });
});
