import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "count-up", theme);
    await expectNoAxeViolations(page);
  });
});

test("behavior: the figure ends at its value, formatted; with reduced motion it never moves", async ({
  page,
}) => {
  await visitStates(page, "count-up", "light");
  await expect(page.locator("#cu-money")).toHaveText("$12,480");
  await expect(page.locator("#cu-count")).toHaveText("312");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const seen = await page.locator("#cu-count").evaluate(
    (el) =>
      new Promise<string[]>((resolve) => {
        const texts: string[] = [];
        const mo = new MutationObserver(() => texts.push(el.textContent ?? ""));
        mo.observe(el, { childList: true, characterData: true, subtree: true });
        setTimeout(() => resolve(texts), 700);
      }),
  );
  expect(seen.every((t) => t === "312")).toBe(true);
});
