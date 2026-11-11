import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the words reach their contrast on each tint", async ({
    page,
  }) => {
    await visitStates(page, "mode-banner", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#mb-demo .cap-mode-banner-text", what: "the demo's words" },
      { sel: "#mb-view .cap-mode-banner-text", what: "viewing as" },
    ]);
  });
});
