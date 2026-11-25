import { test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the words reach their contrast on each tint", async ({
    page,
  }) => {
    await visitStates(page, "mode-banner", theme);
    await expectNoAxeViolations(page);
  });
});
