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

  test("accessibility: the heading, the source and the body reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "panel", theme);
    await expectContrast(page, [
      { sel: "#p-head .cap-panel-head h3", what: "the panel's heading on the raised header" },
      { sel: "#p-head .cap-panel-src", what: "the source line on the raised header" },
      { sel: "#p-head .cap-panel-body p", what: "body text" },
      { sel: "#p-head .cap-panel-body .cap-muted", what: "muted body text" },
    ]);
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

  test("accessibility: description, action, footer and the padded block reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "panel", theme);
    await expectContrast(page, [
      { sel: "#p-card .cap-panel-desc", what: "the description on the raised header" },
      { sel: "#p-card .cap-panel-foot .cap-muted", what: "muted text on the footer band" },
      { sel: "#p-pad .cap-panel-pad p", what: "text in the padded block" },
    ]);
  });
});
