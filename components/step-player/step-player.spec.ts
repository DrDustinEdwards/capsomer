import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

test("behavior: plays to the end, offers to play again, and a step link takes over", async ({
  page,
}) => {
  await visitStates(page, "step-player", "light");
  const play = page.locator("#player [data-step-play]");
  await expect(play).toHaveText("Play");
  await play.click();
  await expect(play).toHaveText("Pause");
  await expect(page.locator("#step-3")).toBeVisible();
  await expect(play).toHaveText("Play again");
  await play.click();
  await expect(page.locator("#step-1")).toBeVisible();
  await page.locator('#player [data-step-go="3"]').click();
  await expect(play).toHaveText("Play again");
  await expect(page.locator("#step-3")).toBeVisible();
  await expectNoAxeViolations(page);
});
