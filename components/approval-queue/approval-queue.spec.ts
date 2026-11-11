import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "approval-queue", theme);
    await expect(page.locator("[data-mount='queue'] .cap-mq-row").first()).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: the live line, the context, the findings and the text reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "approval-queue", theme);
    const q = "[data-mount='queue']";
    await expectContrast(page, [
      { sel: `${q} .cap-mq-summary`, what: "live line" },
      { sel: `${q} .cap-row-detail`, what: "context" },
      { sel: `${q} .cap-mq-findings .cap-status`, what: "finding" },
      { sel: `${q} .cap-mq-row .cap-row-status .cap-status`, what: "status word" },
      { sel: `${q} textarea`, what: "edit box text" },
      { sel: `${q} textarea`, what: "edit box edge", part: "border" },
    ]);
  });

  test("keyboard: j moves between items, a approves the focused one and focus goes to the next", async ({
    page,
  }) => {
    await visitStates(page, "approval-queue", theme);
    const q = page.locator("[data-mount='queue']");
    await q.getByRole("button", { name: "Example Co on Bluesky", exact: true }).focus();
    await page.keyboard.press("j");
    await expect(q.getByRole("button", { name: "Example Co on X", exact: true })).toBeFocused();
    await page.keyboard.press("k");
    await page.keyboard.press("a");
    await expect(q.locator(".cap-mq-row")).toHaveCount(2);
    await expect(q.getByRole("button", { name: "Example Co on X", exact: true })).toBeFocused();
    await expect(q.locator(".cap-mq-summary")).toHaveText(
      "2 waiting: 1 held by the check, 1 awaiting approval",
    );
  });

  test("keyboard: a key typed in the edit box is text, and r asks first with focus on Cancel", async ({
    page,
  }) => {
    await visitStates(page, "approval-queue", theme);
    const q = page.locator("[data-mount='queue']");
    const box = q.getByRole("textbox", { name: "Text for Example Co on Bluesky" });
    await box.focus();
    await page.keyboard.press("End");
    await page.keyboard.type(" ar");
    await expect(q.locator(".cap-mq-row")).toHaveCount(3);
    await q.getByRole("button", { name: "Example Co on Bluesky", exact: true }).focus();
    await page.keyboard.press("r");
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(q.locator(".cap-mq-row")).toHaveCount(3);
    await q.getByRole("button", { name: "Reject for Example Co on Bluesky" }).click();
    await page.getByRole("button", { name: "Reject post" }).click();
    await expect(q.locator(".cap-mq-row")).toHaveCount(2);
  });

  test("keyboard: Enter on a title closes the item and opens it again", async ({ page }) => {
    await visitStates(page, "approval-queue", theme);
    const title = page
      .locator("[data-mount='readonly']")
      .getByRole("button", { name: "Example Co on Bluesky", exact: true });
    await title.focus();
    await expect(title).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Enter");
    await expect(title).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("[data-mount='readonly'] .cap-mq-quote")).toBeHidden();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-mount='readonly'] .cap-mq-quote")).toBeVisible();
  });
});
