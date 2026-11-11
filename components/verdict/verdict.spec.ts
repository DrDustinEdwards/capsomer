import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the words reach their contrast", async ({ page }) => {
    await visitStates(page, "verdict", theme);
    await expect(page.locator("#v-problems .cap-verdict")).toBeVisible();
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#v-ok .cap-status", what: "all good" },
      { sel: "#v-ok .cap-verdict-note", what: "what all good covers" },
      { sel: "#v-problems .cap-status", what: "the count of problems" },
      { sel: "#v-problems .cap-verdict-list a", what: "a named problem" },
    ]);
  });
});

test("behavior: the worst tone leads, three are named and the rest are one link; no data is never all good", async ({
  page,
}) => {
  await visitStates(page, "verdict", "light");
  const v = page.locator("#v-problems .cap-verdict");
  await expect(v.locator(".cap-status")).toHaveAttribute("data-tone", "crit");
  await expect(v).toContainText("5 problems:");
  await expect(v.locator(".cap-verdict-list > span > a")).toHaveCount(3);
  await expect(v.getByRole("link", { name: "2 more" })).toBeVisible();
  await expect(page.locator("#v-one")).toContainText("1 problem:");
  await expect(page.locator("#v-unknown .cap-status")).toHaveText("Not known");
});
