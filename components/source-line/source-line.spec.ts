import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, the words reach their contrast, and the link is a target", async ({
    page,
  }) => {
    await visitStates(page, "source-line", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [{ sel: "#sl-source .cap-source-line a", what: "the source line" }]);
    const box = await page.locator("#sl-source .cap-source-line a").boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
  });
});
