import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations in any state", async ({ page }) => {
    await visitStates(page, "sign-in-settings", theme);
    await expect(page.getByRole("heading", { name: "Passkeys" }).first()).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

test("keyboard: Rename opens the name field with focus, and a refused change says so", async ({
  page,
}) => {
  await visitStates(page, "sign-in-settings", "light");
  const full = page.locator("[data-mount='full']");
  await full.getByRole("button", { name: "Rename Work laptop" }).press("Enter");
  const field = full.getByRole("textbox", { name: "New name for Work laptop" });
  await expect(field).toBeFocused();
  await field.fill("Studio laptop");
  await field.press("Enter");
  await expect(full.getByRole("alert")).toHaveText("The passkey was not renamed. Try again.");
});

test("behavior: every part fits a 320px screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await visitStates(page, "sign-in-settings", "light");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
