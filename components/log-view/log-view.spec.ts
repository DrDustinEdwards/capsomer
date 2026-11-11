import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the lines and notes reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "log-view", theme);
    await expect(page.locator("#lv-lines table")).toBeVisible();
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#lv-lines .cap-log-mono", what: "a raw line" },
      { sel: "#lv-lines .cap-log-note", what: "a note" },
    ]);
  });
});

test("behavior: a long path wraps inside its cell, a cut list says so, and no lines is a stated None", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await visitStates(page, "log-view", "light");
  // The path breaks inside its cell: its box is several lines tall, not one line pushed wide.
  const path = page.locator("#lv-lines .cap-log-mono").first();
  const box = (await path.boundingBox())!;
  expect(box.height).toBeGreaterThan(40);
  expect(box.width).toBeLessThan(300);
  await expect(page.locator("#lv-lines")).toContainText("The top lines only; more may exist.");
  await expect(page.locator("#lv-none table")).toHaveCount(0);
  await expect(page.locator("#lv-none")).toContainText("None No request failed with a 5xx.");
});
