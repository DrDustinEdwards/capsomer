import { test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the address reaches its contrast", async ({
    page,
  }) => {
    await visitStates(page, "app-frame", theme);
    await expectNoAxeViolations(page);
  });
});
