import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the address reaches its contrast", async ({
    page,
  }) => {
    await visitStates(page, "app-frame", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#af-browser .cap-app-frame-address", what: "the address" },
    ]);
  });
});
