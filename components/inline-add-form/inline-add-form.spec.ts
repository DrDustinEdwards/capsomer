import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "inline-add-form", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the labels and the field edges reach their contrast", async ({ page }) => {
    await visitStates(page, "inline-add-form", theme);
    await expectContrast(page, [
      { sel: "#s-one ~ .cap-inline-add .cap-field-label", what: "label" },
      { sel: "#ia-scene", what: "field edge", part: "border" },
    ]);
  });
});
