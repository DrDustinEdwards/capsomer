import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "hero", theme);
    await expectNoAxeViolations(page);
  });
});

test("behavior: the hero is a region named by its title, its backdrop hidden", async ({ page }) => {
  await visitStates(page, "hero", "light");
  await expect(page.getByRole("region", { name: "Annual report" })).toBeVisible();
  await expect(page.locator("#sample-card .cap-hero-backdrop")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
});
