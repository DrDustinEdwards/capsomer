import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

// A datetime-local value for an instant, in the browser's zone (the page's clock is the test's).
const local = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

eachTheme((theme) => {
  test("accessibility: no axe violations, closed and open", async ({ page }) => {
    await visitStates(page, "schedule-dialog", theme);
    await expect(page.getByRole("button", { name: "Schedule" })).toBeVisible();
    await expectNoAxeViolations(page);
    await page.getByRole("button", { name: "Replace the update" }).click();
    const dialog = page.getByRole("dialog", { name: "Replace the scheduled update" });
    await expect(dialog.getByRole("status")).toContainText("Goes live");
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: ".cap-schedule-dialog-lead", what: "the line that says the time" },
      { sel: "dialog[open] .cap-field-help", what: "the time zone line" },
    ]);
  });

  test("keyboard: Enter opens it on the field, which names the zone; a past time is refused beside it; Esc sends nothing", async ({
    page,
  }) => {
    await visitStates(page, "schedule-dialog", theme);
    const open = page.getByRole("button", { name: "Schedule" });
    await open.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Schedule this post" });
    const field = dialog.getByLabel("Publish at");
    await expect(field).toBeVisible();
    const zone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
    await expect(field).toHaveAccessibleDescription(new RegExp(`In your time zone, ${zone}\\.`));
    const confirm = dialog.getByRole("button", { name: "Schedule" });
    await expect(confirm).toHaveAttribute("aria-disabled", "true");

    await field.fill(local(Date.now() - 3_600_000));
    await expect(dialog.getByText("Choose a time in the future.").first()).toBeVisible();
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
    await expect(page.locator("#sent-new")).toHaveText("Nothing scheduled.");
  });

  test("keyboard: a future time is said in words and sent as an ISO time, focus back on the opener", async ({
    page,
  }) => {
    await visitStates(page, "schedule-dialog", theme);
    const open = page.getByRole("button", { name: "Schedule" });
    await open.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Schedule this post" });
    const when = Date.now() + 2 * 24 * 3_600_000;
    await dialog.getByLabel("Publish at").fill(local(when));
    await expect(dialog.getByRole("status")).toContainText("Goes live");
    await dialog.getByRole("button", { name: "Schedule" }).press("Enter");
    await expect(dialog).toBeHidden();
    const sent = await page.locator("#sent-new").textContent();
    const iso = /Scheduled for (.+)\.$/.exec(sent ?? "")?.[1] ?? "";
    expect(Math.abs(Date.parse(iso) - when)).toBeLessThan(60_000);
    await expect(open).toBeFocused();
  });
});
