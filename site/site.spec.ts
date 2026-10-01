import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations } from "../test/helpers.ts";

// The site itself: every view loads in the shell with no axe violations, the rail moves
// between views, and a component's page shows its states in both themes.
const VIEWS = ["overview", "components", "colour", "type", "motion", "tests", "defaults", "changes", "settings"];

eachTheme((theme) => {
  for (const view of VIEWS) {
    test(`accessibility: the ${view} view has no axe violations`, async ({ page }) => {
      await page.goto(`./?theme=${theme}#/${view}`);
      await expect(page.locator(".cap-shell")).toBeVisible();
      await expect(page.locator("#cap-main h1").first()).toBeVisible();
      await expectNoAxeViolations(page, ".cap-shell");
    });
  }

  test("keyboard: the rail's links move between views and mark the current one", async ({ page }) => {
    await page.goto("./#/overview");
    const link = page.locator(".cap-shell-rail").getByRole("link", { name: /^Colour and contrast/ });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#\/colour$/);
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(page.locator("#cap-main h1")).toHaveText("Colour and contrast");
  });

  test("behaviour: a component's page shows its states in both themes", async ({ page }) => {
    await page.goto("./#/components/shell");
    await expect(page.locator("#cap-main h1")).toHaveText("Shell");
    await expect(page.locator("iframe.site-frame")).toHaveCount(2);
  });
});
