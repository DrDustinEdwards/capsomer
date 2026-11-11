import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "save-bar", theme);
    await expectNoAxeViolations(page);
  });

  test("behavior: the result is a live region beside Save, the failure keeps the server's words", async ({
    page,
  }) => {
    await visitStates(page, "save-bar", theme);
    await expect(page.locator("#sample-idle [role=status]")).toHaveText("");
    await expect(page.locator("#sample-saved [role=status]")).toContainText("Saved");
    await expect(page.locator("#sample-failed [role=status]")).toContainText("not verified");
    await expect(
      page.locator("#sample-saving").getByRole("button", { name: "Save changes" }),
    ).toHaveAttribute("aria-busy", "true");
    await expect(page.locator("#sample-autosave").getByRole("button")).toHaveCount(0);
  });
});
