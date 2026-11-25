import { test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the questions and answers reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "faq", theme);
    await expectNoAxeViolations(page);
  });
});
