import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "timeline", theme);
    await expectNoAxeViolations(page);
  });
});

test("behavior: the steps are an ordered list, and the line ends filled once seen", async ({
  page,
}) => {
  await visitStates(page, "timeline", "light");
  const tl = page.locator("#tl-default");
  await expect(tl.getByRole("listitem")).toHaveCount(3);
  await expect(tl).toHaveAttribute("data-shown", "");
  await expect
    .poll(() => tl.evaluate((el) => getComputedStyle(el, "::after").scale))
    .toMatch(/^(none|1)$/);
});

test("behavior: with reduced motion the line is full at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await visitStates(page, "timeline", "light");
  const scale = await page
    .locator("#tl-default")
    .evaluate((el) => getComputedStyle(el, "::after").scale);
  expect(scale).toMatch(/^(none|1)$/);
});
