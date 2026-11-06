import { test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "step-indicator", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: step names, the bars and the counter reach their contrast", async ({ page }) => {
    await visitStates(page, "step-indicator", theme);
    await expectContrast(page, [
      { sel: "#steps-current .cap-step[aria-current] .cap-step-name", what: "the current step's name" },
      { sel: "#steps-current .cap-step:not([data-state]):not([aria-current]) .cap-step-name", what: "a step to come" },
      { sel: "#steps-current .cap-step[data-state='complete']", what: "a done step's bar", part: "border" },
      { sel: "#steps-current .cap-step:not([data-state]):not([aria-current])", what: "a step to come's bar", part: "border" },
      { sel: "#steps-current .cap-steps-counter", what: "the counter" },
    ]);
  });
});
