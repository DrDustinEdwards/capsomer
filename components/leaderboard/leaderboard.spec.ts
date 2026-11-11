import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and names, scores and ranks reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "leaderboard", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      {
        sel: "#lb-board .cap-leaderboard-row[aria-current] .cap-leaderboard-name",
        what: "the reader's own name",
      },
      { sel: "#lb-board .cap-leaderboard-score", what: "a score" },
      { sel: "#lb-empty", what: "the empty line" },
    ]);
  });

  test("behavior: a long name is cut and the score stays on the row", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await visitStates(page, "leaderboard", theme);
    const row = page.locator("#lb-board .cap-leaderboard-row").nth(2);
    const fits = await row.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const s = el.querySelector(".cap-leaderboard-score")!.getBoundingClientRect();
      return s.right <= r.right && r.height < 60;
    });
    expect(fits).toBe(true);
  });
});
