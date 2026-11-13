import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the consent, error and sent lines reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "newsletter-signup", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#nl-card .cap-newsletter-consent span", what: "the consent line" },
      { sel: "#nl-error .cap-field-error", what: "the error" },
      { sel: "#nl-done .cap-form-status .cap-alert-body", what: "the sent line" },
    ]);
  });
});
