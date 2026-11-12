import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and every tone reaches its contrast", async ({
    page,
  }) => {
    await visitStates(page, "badge", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#b-tones .cap-badge:not([data-tone])", what: "a plain count" },
      { sel: "#b-tones [data-tone='need']", what: "a count that needs you" },
      { sel: "#b-tones [data-tone='crit']", what: "a failing count" },
      { sel: "#b-tones [data-tone='warn']", what: "a slow count" },
    ]);
  });
});
