import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the links reach their contrast", async ({ page }) => {
    await visitStates(page, "subscribe-links", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#sub-full li:first-child .cap-subscribe-link", what: "an app link" },
      { sel: "#sub-full .cap-subscribe-more", what: "the more link" },
    ]);
  });
});
