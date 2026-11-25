import { test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and every move reaches its contrast", async ({
    page,
  }) => {
    await visitStates(page, "delta", theme);
    await expectNoAxeViolations(page);
  });
});
