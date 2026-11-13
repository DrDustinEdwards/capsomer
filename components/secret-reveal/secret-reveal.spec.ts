import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the secret is named and described", async ({
    page,
  }) => {
    await visitStates(page, "secret-reveal", theme);
    await expectNoAxeViolations(page);
    const block = page.locator(".cap-secret-value");
    await expect(block).toHaveAccessibleName("Your new API key");
    await expect(block).toHaveAccessibleDescription(/will not be shown again/);
    await expectContrast(page, [
      { sel: ".cap-secret-value", what: "the secret" },
      { sel: ".cap-secret-note", what: "the warning" },
    ]);
  });
});
