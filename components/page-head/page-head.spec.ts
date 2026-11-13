import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "page-head", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the title and the lead reach their contrast", async ({ page }) => {
    await visitStates(page, "page-head", theme);
    await expectContrast(page, [
      { sel: "#ph-full .cap-page-head-title", what: "the page title" },
      { sel: "#ph-full .cap-page-head-lead", what: "the lead line" },
    ]);
  });

  test("behavior: the actions sit at the right of the title, and drop below it in a narrow space", async ({
    page,
  }) => {
    await visitStates(page, "page-head", theme);
    const wide = await page.locator("#ph-full").evaluate((el) => {
      const t = el.querySelector(".cap-page-head-text")!.getBoundingClientRect();
      const a = el.querySelector(".cap-page-head-actions")!.getBoundingClientRect();
      return { sameRow: a.top < t.bottom, right: a.left >= t.right };
    });
    expect(wide).toEqual({ sameRow: true, right: true });
    const narrow = await page.locator("#ph-long").evaluate((el) => {
      const t = el.querySelector(".cap-page-head-text")!.getBoundingClientRect();
      const a = el.querySelector(".cap-page-head-actions")!.getBoundingClientRect();
      return { below: a.top >= t.bottom - 1, within: el.scrollWidth <= el.clientWidth };
    });
    expect(narrow).toEqual({ below: true, within: true });
  });
});
