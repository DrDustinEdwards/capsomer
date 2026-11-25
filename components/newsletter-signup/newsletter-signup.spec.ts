import { test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the consent, error and sent lines reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "newsletter-signup", theme);
    await expectNoAxeViolations(page);
  });
});
