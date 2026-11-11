import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "offline-keep", theme);
    await expect(page.locator("#keep-live button")).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

test("behavior: a kept page opens offline, and removing it clears the store and the worker", async ({
  page,
  context,
}) => {
  await visitStates(page, "offline-keep", "light");
  const button = page.locator("#keep-live").getByRole("button");
  await expect(button).toHaveText("Keep on this device");
  expect(await page.evaluate(() => caches.keys())).not.toContain("cap-specimen-kept-v1");
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Live: keep this page, then remove it" }),
  ).toBeVisible();
  await context.setOffline(false);
  await page.reload();
  const again = page.locator("#keep-live").getByRole("button");
  await expect(again).toHaveAttribute("aria-pressed", "true");
  await again.click();
  await expect(again).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => caches.keys())).not.toContain("cap-specimen-kept-v1");
  expect(
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length),
  ).toBe(0);
});
