import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the words reach their contrast", async ({ page }) => {
    for (const only of ["published", "registered", "lists"]) {
      await visitStates(page, "consent", theme, only);
      await expectNoAxeViolations(page);
    }
    await visitStates(page, "consent", theme, "published");
    await expectContrast(page, [
      { sel: ".cap-consent-text", what: "the lead" },
      { sel: ".cap-permissions-heading", what: "a list's heading" },
      { sel: ".cap-consent-line", what: "the write grant's lines" },
    ]);
  });
});
