import { test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "summary-list", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: labels, values, a missing value and the Change links reach their contrast", async ({ page }) => {
    await visitStates(page, "summary-list", theme);
    await expectContrast(page, [
      { sel: "#sl-check dt", what: "a label" },
      { sel: "#sl-check dd", what: "a value" },
      { sel: "#sl-check .cap-summary-missing", what: "a missing value" },
      { sel: "#sl-change-address", what: "a Change link" },
    ]);
  });

});
