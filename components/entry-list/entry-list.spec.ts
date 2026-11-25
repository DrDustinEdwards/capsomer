import { test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations and every part reaches its contrast", async ({ page }) => {
    await visitStates(page, "entry-list", theme);
    await expectNoAxeViolations(page);
  });
});
