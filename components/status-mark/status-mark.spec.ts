import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the sentence reaches its contrast", async ({
    page,
  }) => {
    for (const only of ["done", "confirm"]) {
      await visitStates(page, "status-mark", theme, only);
      await expectNoAxeViolations(page);
    }
    await expectContrast(page, [{ sel: ".cap-result-text", what: "the sentence" }]);
  });

  test("behavior: the outcome is the heading and a status, and the mark is hidden", async ({
    page,
  }) => {
    await visitStates(page, "status-mark", theme, "done");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Unsubscribed");
    await expect(page.getByRole("status")).toContainText("You have been unsubscribed");
    await expect(page.locator(".cap-status-mark")).toHaveAttribute("aria-hidden", "true");
    await visitStates(page, "status-mark", theme, "confirm");
    await expect(page.locator(".cap-status-mark")).toHaveCount(0);
  });
});
