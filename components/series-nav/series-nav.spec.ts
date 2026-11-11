import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "series-nav", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the title, the parts and the signs reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "series-nav", theme);
    await expectContrast(page, [
      { sel: "#sample-middle .cap-series-title", what: "part count" },
      { sel: "#sample-middle .cap-series-title a", what: "series link" },
      { sel: "#sample-middle .cap-series-parts a", what: "another part" },
      { sel: "#sample-middle [aria-current] span", what: "this part" },
      { sel: "#sample-middle .cap-sign", what: "a sign" },
    ]);
  });
});
