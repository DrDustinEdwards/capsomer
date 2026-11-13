import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the copy is hidden and inert", async ({ page }) => {
    await visitStates(page, "marquee", theme);
    await expectNoAxeViolations(page);
    const copy = page.locator("#mq-group .cap-marquee-list[aria-hidden='true']").first();
    await expect(copy).toHaveJSProperty("inert", true);
    await expect(page.getByRole("list", { name: "Clients" })).toHaveCount(3);
  });

  test("behavior: the Pause control stops every marquee in its group", async ({ page }) => {
    await visitStates(page, "marquee", theme);
    const track = page.locator("#mq-group .cap-marquee-track").first();
    await expect(track).toHaveCSS("animation-play-state", "running");
    await page.locator("#mq-pause").focus();
    await page.keyboard.press("Space");
    for (const t of await page.locator("#mq-group .cap-marquee-track").all())
      await expect(t).toHaveCSS("animation-play-state", "paused");
  });

  test("behavior: with less motion asked for, nothing moves and the Pause control is hidden", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "marquee", theme);
    await expect(page.locator("#mq-group .cap-marquee-track").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(page.locator("#mq-pause")).toBeHidden();
  });
});
