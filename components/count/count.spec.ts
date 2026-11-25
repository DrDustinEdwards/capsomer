import { test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and every tone reaches its contrast", async ({
    page,
  }) => {
    await visitStates(page, "count", theme);
    await expectNoAxeViolations(page);
  });
});
