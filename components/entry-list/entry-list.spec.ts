import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations and every part reaches its contrast", async ({ page }) => {
    await visitStates(page, "entry-list", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#sample-list .cap-entry-when time", what: "the date" },
      { sel: "#sample-list .cap-entry-more", what: "the second fact" },
      { sel: "#sample-list .cap-entry-mark", what: "the mark" },
      { sel: "#sample-list .cap-entry-kicker", what: "the kicker" },
      { sel: "#sample-list .cap-entry-summary", what: "the summary" },
      { sel: "#sample-list .cap-entry-tags a[data-force]", what: "a tag under the pointer" },
    ]);
  });
});
