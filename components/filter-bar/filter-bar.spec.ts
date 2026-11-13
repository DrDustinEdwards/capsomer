import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "filter-bar", theme);
    await expectNoAxeViolations(page);
  });

  test("keyboard: Enter in the search applies the filters as a GET", async ({ page }) => {
    await visitStates(page, "filter-bar", theme);
    await expect(page.getByRole("search", { name: "Filter people" })).toBeVisible();
    const field = page.locator("#sample-plain").getByLabel("Name or email");
    await field.fill("lee");
    await Promise.all([page.waitForURL(/[?&]q=lee/), field.press("Enter")]);
  });
});

test("behavior: a live bar waits out an IME composition, then applies", async ({ page }) => {
  await visitStates(page, "filter-bar", "light");
  const field = page.locator("#sample-live").getByLabel("Name or email");
  await field.evaluate((el) => {
    const input = el as HTMLInputElement;
    input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    input.value = "ni";
    input.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true }));
  });
  await page.waitForTimeout(500);
  expect(page.url()).not.toContain("q=ni");
  await field.evaluate((el) => {
    const input = el as HTMLInputElement;
    input.value = "你";
    input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
  });
  await page.waitForURL(/[?&]q=%E4%BD%A0/);
});
