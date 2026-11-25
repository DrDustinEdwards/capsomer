import { test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the label and note reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "danger-zone", theme);
    await expectNoAxeViolations(page);
  });
});
