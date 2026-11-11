import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the ad is hidden from assistive technology", async ({
    page,
  }) => {
    await visitStates(page, "error-ad", theme);
    await expect(page.locator(".cap-ad").first()).toBeVisible();
    await expectNoAxeViolations(page);
    for (const ad of await page.locator(".cap-ad").all())
      await expect(ad).toHaveAttribute("aria-hidden", "true");
  });
});

test("behavior: the ink follows the theme, and the art's symbols resolve", async ({ page }) => {
  const ink = async (theme: "light" | "dark") => {
    await visitStates(page, "error-ad", theme);
    return page
      .locator(".cap-ad-ink")
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
  };
  expect(await ink("light")).not.toBe(await ink("dark"));
  const use = page.locator(".cap-ad-art use").first();
  const href = await use.getAttribute("href");
  expect(href).toBe("#ad-field-notes-book");
  await expect(page.locator(`symbol${href}`).first()).toBeAttached();
  expect((await use.boundingBox())?.width ?? 0).toBeGreaterThan(0);
});
