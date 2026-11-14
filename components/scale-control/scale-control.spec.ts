import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "scale-control", theme);
    await expectNoAxeViolations(page);
  });

  test("behavior: the stepper is disabled at the least, and Scale sends the count", async ({
    page,
  }) => {
    await visitStates(page, "scale-control", theme);
    const form = page.getByRole("form", { name: "Scale the print run" });
    await expect(form.getByRole("button", { name: "Decrease copies" })).toBeDisabled();
    await form.getByRole("button", { name: "Increase copies" }).click();
    await form.getByRole("button", { name: "Scale" }).click();
    await expect(page).toHaveURL(/[?&]n=2(&|$)/);
  });
});
