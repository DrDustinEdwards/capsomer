import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "player", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the embed's words reach their contrast", async ({ page }) => {
    await visitStates(page, "player", theme);
    await expectContrast(page, [
      { sel: "#embed-poster .cap-player-label", what: "the embed over a poster" },
      { sel: "#embed-plain .cap-player-label", what: "the embed with no poster" },
    ]);
  });

  // No request to the service before the reader asks; a keyboard reader lands in the player.
  test("keyboard: Enter on an embed puts the named player in its place and moves focus into it", async ({ page }) => {
    await visitStates(page, "player", theme);
    const host = page.locator("[data-mount='embed']");
    const link = host.getByRole("link", { name: "Watch on YouTube: A keynote on publishing with Prelum" });
    await expect(host.locator("iframe")).toHaveCount(0);
    await link.focus();
    await page.keyboard.press("Enter");
    const frame = host.locator("iframe[title='A keynote on publishing with Prelum']");
    await expect(frame).toBeFocused();
    await expect(frame).toHaveAttribute("src", "about:blank");
  });
});
