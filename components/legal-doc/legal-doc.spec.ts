import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "legal-doc", theme);
    await expectNoAxeViolations(page);
  });

  test("keyboard: a contents link moves to its numbered section", async ({ page }) => {
    await visitStates(page, "legal-doc", theme);
    await expect(page.getByText("Last updated November 11, 2026")).toBeVisible();
    const contents = page.getByRole("navigation", { name: "Contents" });
    await contents.getByRole("link", { name: "Contact" }).press("Enter");
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.getByRole("heading", { name: "3. Contact" })).toBeInViewport();
  });
});
