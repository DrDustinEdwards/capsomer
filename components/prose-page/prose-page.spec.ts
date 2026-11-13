import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the title, lead and body reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "prose-page", theme, "page");
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: ".cap-prose-page-title", what: "the title" },
      { sel: ".cap-prose-page-lead", what: "the lead" },
      { sel: ".cap-prose-page-body p", what: "the body" },
    ]);
  });

  test("behavior: a long title wraps inside a phone's width", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await visitStates(page, "prose-page", theme, "long");
    const fits = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fits).toBe(true);
  });
});
