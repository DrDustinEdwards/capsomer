import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and every tone reaches its contrast", async ({
    page,
  }) => {
    await visitStates(page, "eyebrow", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#eb-muted", what: "the muted eyebrow" },
      { sel: "#eb-accent", what: "the accent eyebrow" },
      { sel: "#eb-mono", what: "the mono eyebrow" },
      { sel: "#eb-mono-accent", what: "the mono accent eyebrow" },
    ]);
  });
});
