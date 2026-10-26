import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { patchSvg } from "./manual.ts";

test("behavior: a patch escapes its words and draws one dot per thing counted, at most 24", () => {
  const svg = patchSvg({ id: "a&b", name: "<Carrel>", foot: "dustinedwards.info", count: 6, unit: "sites" });
  expect(svg).not.toContain("<Carrel>");
  expect(svg).toContain("&lt;CARREL&gt;");
  expect(svg.match(/cap-patch-dot/g)).toHaveLength(6);
  expect(patchSvg({ id: "x", name: "x", foot: "x", count: 80, unit: "x" }).match(/cap-patch-dot/g)).toHaveLength(24);
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "manual", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: labels, values and the light type on dark panels reach their contrast", async ({ page }) => {
    await visitStates(page, "manual", theme);
    await expectContrast(page, [
      { sel: "#m-sign-head .cap-running-head-name", what: "a sign head's name" },
      { sel: "#m-sign-head .cap-running-head-no", what: "a sign head's number plate" },
      { sel: "#m-title-block dt", what: "a form box's label" },
      { sel: "#m-tones .cap-form-boxes-box:nth-child(3) dd", what: "a reading on a dark tone" },
      { sel: "#m-tones .cap-form-boxes-box:nth-child(2) dd", what: "a reading on a light tone" },
      { sel: "#m-checklist .cap-checklist-strip", what: "the checklist's strip" },
      { sel: "#m-checklist .cap-checklist-note", what: "a checklist note" },
      { sel: "#m-signs .cap-sign", what: "a sign" },
      { sel: "#m-plate .cap-plate-fig", what: "a plate's figure number" },
      { sel: "#m-direction a:not([aria-current])", what: "a way on the direction strip" },
      { sel: "#m-direction [aria-current]", what: "the lit page on the direction strip" },
      { sel: "#m-cue .cap-cue-strip", what: "the cue card's strip" },
      { sel: "#m-cue .cap-cue-value", what: "a cue line's value" },
    ]);
  });
});
