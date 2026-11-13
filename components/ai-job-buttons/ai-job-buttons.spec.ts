import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "ai-job-buttons", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the answers reach their contrast", async ({ page }) => {
    await visitStates(page, "ai-job-buttons", theme);
    await expectContrast(page, [
      { sel: "[data-mount='done'] .cap-alert-text", what: "done message" },
      { sel: "[data-mount='error'] .cap-alert-text", what: "error" },
    ]);
  });

  test("keyboard: Enter on a job posts it, and the retry on the other engine follows in Tab order", async ({
    page,
  }) => {
    await visitStates(page, "ai-job-buttons", theme);
    const live = page.locator("[data-mount='live']");
    await live.getByRole("button", { name: "Continue my draft" }).focus();
    await page.keyboard.press("Enter");
    await expect(live.getByRole("alert")).toContainText("Sent to the subscription's routine");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const retry = live.getByRole("button", { name: "Run it on the API" });
    await expect(retry).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(live.getByRole("link", { name: "Open it" })).toBeVisible();
    await expect(live.getByRole("button", { name: "Run it on the subscription" })).toBeVisible();
  });
});
