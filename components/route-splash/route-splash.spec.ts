import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, a status, and the label reaches its contrast", async ({
    page,
  }) => {
    await visitStates(page, "route-splash", theme, "loading");
    await expectNoAxeViolations(page);
    await expect(page.getByRole("status")).toContainText("Loading...");
    await expectContrast(page, [{ sel: "#splash .cap-route-splash-label", what: "the label" }]);
  });
});
