import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and every move reaches its contrast", async ({
    page,
  }) => {
    await visitStates(page, "delta", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#d-moves [data-tone='good']", what: "a better move" },
      { sel: "#d-moves [data-tone='bad']", what: "a worse move" },
      { sel: "#d-moves [data-kind='unchanged']", what: "no change" },
    ]);
  });
});
