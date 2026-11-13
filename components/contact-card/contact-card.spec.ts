import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the links and labels reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "contact-card", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#cc-cards .cap-contact-way", what: "a contact link" },
      { sel: "#cc-cards .cap-contact-lines a", what: "a phone number" },
      { sel: "#cc-cards .cap-contact-address", what: "the address" },
    ]);
  });

  test("behavior: every way is a target of at least 24px", async ({ page }) => {
    await visitStates(page, "contact-card", theme);
    const heights = await page
      .locator(".cap-contact-way")
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(24);
  });
});
