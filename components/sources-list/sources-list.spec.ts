import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the kind, title and details reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "sources-list", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#sl-mixed .cap-source-kind", what: "a kind tag" },
      { sel: "#sl-mixed a.cap-source-title", what: "a linked title" },
      { sel: "#sl-mixed .cap-source-license", what: "a license" },
    ]);
  });
});
