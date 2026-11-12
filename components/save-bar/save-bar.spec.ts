import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "save-bar", theme);
    await expectNoAxeViolations(page);
  });

  test("the result is in a status region that is there before any save", async ({ page }) => {
    await visitStates(page, "save-bar", theme);
    const idle = page.getByRole("form", { name: "Notification settings" });
    await expect(idle.getByRole("status")).toBeAttached();
    await expect(idle.getByRole("status")).toHaveText("");
    await expect(page.locator("#s-failed ~ .cap-save-bar").getByRole("status")).toHaveText(
      "Failed to save. Please try again.",
    );
  });
});
