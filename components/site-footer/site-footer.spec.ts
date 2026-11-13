import { test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "site-footer", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the small print and the links reach their contrast", async ({ page }) => {
    await visitStates(page, "site-footer", theme);
    await expectContrast(page, [
      { sel: "#sample-plain .cap-site-footer-note", what: "small print" },
      { sel: "#sample-plain .cap-site-footer-links a", what: "a quiet link" },
      { sel: "#sample-raised .cap-site-footer-note", what: "small print on the raised surface" },
      { sel: "#sample-raised .cap-site-footer-links a", what: "a link on the raised surface" },
    ]);
  });
});
