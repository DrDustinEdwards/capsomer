import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "panel", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the count and the link to the full view reach their contrast, and the link is a target", async ({
    page,
  }) => {
    await visitStates(page, "panel", theme);
    await expectContrast(page, [
      { sel: "#p-more .cap-panel-count", what: "the count on the raised header" },
      { sel: "#p-more .cap-panel-src", what: "the source line beside a link" },
      { sel: "#p-more .cap-panel-more a", what: "the link to the full view on the raised header" },
    ]);
    const box = await page.locator("#p-more .cap-panel-more a").boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
  });
});
