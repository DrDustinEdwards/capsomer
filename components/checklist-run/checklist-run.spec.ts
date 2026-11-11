import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations while a run is open", async ({ page }) => {
    await visitStates(page, "checklist-run", theme);
    await page.getByRole("button", { name: "Run this checklist" }).click();
    await expect(page.getByRole("region", { name: "Run", exact: true })).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

test("behavior: a run checks steps, survives a reload, shows one step at a time and finishes with a record", async ({
  page,
}) => {
  await visitStates(page, "checklist-run", "light");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Run this checklist" }).click();
  const bar = page.getByRole("region", { name: "Run", exact: true });
  await expect(bar).toContainText("0 of 4 steps done");
  // Two steps numbered 1, in two sections, are two steps.
  await page.locator("#before-1").getByLabel("Step 1 done").check();
  await expect(bar).toContainText("1 of 4 steps done");
  await expect(page.locator("#plot-1").getByLabel("Step 1 done")).not.toBeChecked();
  await expect(page.locator("#before-2")).toHaveAttribute("aria-current", "step");

  await page.reload();
  await page.getByRole("button", { name: "Resume your run (1 of 4 done)" }).click();
  await expect(page.locator("#before-1").getByLabel("Step 1 done")).toBeChecked();

  await bar.getByRole("button", { name: "One step at a time" }).click();
  await expect(page.locator("#before-2")).toBeVisible();
  await expect(page.locator("#plot-2")).toBeHidden();
  await bar.getByRole("button", { name: "Next step" }).click();
  await expect(page.locator("#plot-1")).toBeVisible();
  await expect(page.locator("#before-2")).toBeHidden();
  await bar.getByRole("button", { name: "Show every step" }).click();

  await bar.getByRole("button", { name: "Finish run" }).click();
  const summary = page.getByRole("region", { name: "Run record" });
  await expect(summary).toContainText("1 of 4 steps done");
  const download = page.waitForEvent("download");
  await summary.getByRole("button", { name: "Download as JSON" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^field-day-\d{4}-\d{2}-\d{2}\.json$/);
});

test("behavior: a timer starts, pauses and resets, and its button names its step", async ({
  page,
}) => {
  await visitStates(page, "checklist-run", "light");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Run this checklist" }).click();
  const timer = page.locator("#before-2 .cap-run-timer");
  await expect(timer.getByRole("timer")).toHaveText("2:00");
  await timer.getByRole("button", { name: "Start Charge, 2 minutes (step 2)" }).click();
  await expect(timer).toHaveAttribute("data-state", "running");
  await timer.getByRole("button", { name: "Pause (step 2)" }).click();
  await expect(timer).toHaveAttribute("data-state", "paused");
  await timer.getByRole("button", { name: "Reset" }).click();
  await expect(timer).toHaveAttribute("data-state", "idle");
});
