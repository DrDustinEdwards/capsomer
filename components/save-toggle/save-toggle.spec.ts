import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "save-toggle", theme);
    await expectNoAxeViolations(page);
  });
});

test("behavior: pressing saves, both buttons for the item follow, and the id is stored", async ({
  page,
}) => {
  await visitStates(page, "save-toggle", "light");
  const a = page.locator("#save-a");
  const b = page.locator("#save-b");
  await a.click();
  await expect(a).toHaveAttribute("aria-pressed", "true");
  await expect(b).toHaveAttribute("aria-pressed", "true");
  await expect(b).toHaveText("Saved");
  expect(await page.evaluate(() => localStorage.getItem("cap-specimen-saved"))).toBe(
    '["spring-update"]',
  );
  await b.press("Enter");
  await expect(a).toHaveAttribute("aria-pressed", "false");
});
