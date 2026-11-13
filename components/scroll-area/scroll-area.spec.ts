import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the thumb keeps 3:1 against its track", async ({
    page,
  }) => {
    await visitStates(page, "scroll-area", theme);
    await expectNoAxeViolations(page);
    const ratio = await page.locator("#sa-rest").evaluate((el) => {
      const [thumb, track] = getComputedStyle(el).scrollbarColor.split(
        /\s(?=rgb|oklch|oklab|lab|lch|color\(|#)/,
      );
      return window.capRatio(thumb!, track!);
    });
    expect(ratio).toBeGreaterThanOrEqual(3);
  });
});
