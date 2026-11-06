import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "picture", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the pause control reaches its contrast", async ({ page }) => {
    await visitStates(page, "picture", theme);
    await expectContrast(page, [{ sel: "#motion-playing .cap-motion-toggle", what: "the pause control" }]);
  });

  // WCAG 2.2.2: anything moving for more than five seconds can be stopped, with no script.
  test("keyboard: Space on Pause shows the still, and reduced motion shows it with no control", async ({ page }) => {
    await visitStates(page, "picture", theme);
    const motion = page.locator("#motion-playing");
    const moving = motion.locator("picture img");
    const still = motion.locator(".cap-motion-still");
    await expect(moving).toBeVisible();
    await expect(still).toBeHidden();
    await motion.getByRole("checkbox", { name: "Pause" }).focus();
    await page.keyboard.press("Space");
    await expect(moving).toBeHidden();
    await expect(still).toBeVisible();
    await page.keyboard.press("Space");
    await expect(moving).toBeVisible();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(moving).toBeHidden();
    await expect(still).toBeVisible();
    await expect(motion.getByRole("checkbox", { name: "Pause" })).toBeHidden();
  });
});
