import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "read-state", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the no-data reasons reach their contrast", async ({ page }) => {
    await visitStates(page, "read-state", theme);
    await expectContrast(page, [
      { sel: "#rs-nothing-yet .cap-read-state", what: "the reason nothing is read yet" },
      { sel: "#rs-sources [data-state='empty']", what: "a read that found nothing" },
    ]);
  });

  test("behavior: each state says what it is, and Read again says it is reading", async ({
    page,
  }) => {
    await visitStates(page, "read-state", theme);
    await expect(page.locator("#rs-reading").getByRole("status")).toContainText(
      "Reading the queue",
    );
    await expect(page.locator("#rs-failed").getByRole("alert")).toContainText(
      "Could not read the queue",
    );
    await expect(page.locator("#rs-stale").getByRole("status")).toContainText(
      "Showing the last answer",
    );
    await expect(page.locator("#rs-stale")).toContainText("Four jobs waiting");
    await expect(page.locator("#rs-reading-again section")).toHaveAttribute("aria-busy", "true");
    const again = page.locator("#rs-read-again").getByRole("button", { name: "Read again" });
    await again.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.locator("#rs-read-again").getByRole("button", { name: "Reading again" }),
    ).toBeDisabled();
    await expect(page.locator("#rs-table-panel .cap-table-wrap")).toHaveAccessibleName(
      "Operator actions",
    );
    await expect(page.locator("#rs-table-empty table")).toHaveCount(0);
  });
});
