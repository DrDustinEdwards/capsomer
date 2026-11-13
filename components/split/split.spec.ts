import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "split", theme);
    await expectNoAxeViolations(page);
  });
});

test("behavior: the picture sits beside the text, flips with data-flip, and stacks under the heading on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await visitStates(page, "split", "light");
  const sides = (id: string) =>
    page.locator(id).evaluate((el) => {
      const t = el.querySelector(".cap-split-text")!.getBoundingClientRect();
      const m = el.querySelector(".cap-split-media")!.getBoundingClientRect();
      return { mediaRight: m.left > t.left, level: Math.abs(m.top - t.top) < 2 };
    });
  expect(await sides("#split-right")).toEqual({ mediaRight: true, level: true });
  expect(await sides("#split-flip")).toEqual({ mediaRight: false, level: true });
  await page.setViewportSize({ width: 390, height: 900 });
  const stacked = await page.locator("#split-right").evaluate((el) => {
    const h = el.querySelector(".cap-split-head")!.getBoundingClientRect();
    const t = el.querySelector(".cap-split-text")!.getBoundingClientRect();
    const m = el.querySelector(".cap-split-media")!.getBoundingClientRect();
    return h.bottom <= m.top && m.bottom <= t.top;
  });
  expect(stacked).toBe(true);
});
