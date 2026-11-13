import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "setup-checklist", theme);
    await expectNoAxeViolations(page);
  });

  test("behavior: each step says Done or To do, only undone steps have a way to do them, and the count is beside the heading", async ({
    page,
  }) => {
    await visitStates(page, "setup-checklist", theme);
    const started = page.locator("#sc-started");
    await expect(started.getByRole("list", { name: "Getting started" })).toBeVisible();
    await expect(started).toContainText("1 of 3 done");
    await expect(started.getByRole("link", { name: "Connect" })).toHaveCount(0);
    await expect(started.getByRole("link", { name: "Go to settings" })).toHaveCount(2);
    await expect(started.getByRole("button")).toHaveCount(0);
    await expect(page.locator("#sc-done").getByText("To do")).toHaveCount(0);
  });
});
