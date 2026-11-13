import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "tracks", theme);
    await expectNoAxeViolations(page);
  });
});

test("the rail opens from 48rem and folds onto the reading line below it", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await visitStates(page, "tracks", "light");
  const facts = page.locator("#sample-facts");
  const text = page.locator("#sample-toc > p:not([data-track])");
  const [f, t] = [await facts.boundingBox(), await text.boundingBox()];
  expect(f && t && f.x + f.width <= t.x).toBe(true);
  // A wide block starts where the rail does.
  const wide = await page.locator("#sample-wide").boundingBox();
  expect(Math.round(wide?.x ?? 0)).toBe(Math.round(f?.x ?? -1));

  await page.setViewportSize({ width: 375, height: 800 });
  const [f2, t2] = [await facts.boundingBox(), await text.boundingBox()];
  expect(Math.round(f2?.x ?? 0)).toBe(Math.round(t2?.x ?? -1));
});
