import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: every kind's words reach their contrast", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await expectContrast(page, [
      { sel: "#sample-nothing .cap-empty-title", what: "nothing yet title" },
      { sel: "#sample-nothing .cap-empty-media", what: "the icon tile's icon", min: 3 },
      { sel: "#sample-clear .cap-status", what: "all clear status" },
      { sel: "#sample-failed .cap-empty-title", what: "failed title" },
      { sel: "#sample-failed .cap-empty-text", what: "failed text" },
      { sel: "#sample-direct .cap-empty-title", what: "0.1 markup title" },
      { sel: "#sample-wait .cap-empty-text", what: "how long it takes" },
      { sel: "#e-missing .cap-missing", what: "no value" },
    ]);
  });
});
