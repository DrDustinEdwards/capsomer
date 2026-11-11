import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "player", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: a track's page with the surface, transcript and lists has no axe violations", async ({
    page,
  }) => {
    await visitStates(page, "player", theme, "surface");
    await expect(page.getByRole("region", { name: "Player" })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: the embed's words reach their contrast", async ({ page }) => {
    await visitStates(page, "player", theme);
    await expectContrast(page, [
      { sel: "#embed-poster .cap-player-label", what: "the embed over a poster" },
      { sel: "#embed-plain .cap-player-label", what: "the embed with no poster" },
    ]);
  });

  test("accessibility: the dock's words reach their contrast", async ({ page }) => {
    await visitStates(page, "player", theme, "dock");
    await expect(page.getByRole("region", { name: "Audio player" })).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-player-dock .cap-player-title", what: "the dock's title" },
      { sel: ".cap-player-dock .cap-player-meta", what: "the dock's status line" },
      { sel: ".cap-player-dock .cap-player-time", what: "the dock's time" },
      { sel: ".cap-player-dock [data-part='play']", what: "the play button's icon" },
    ]);
  });

  // No request to the service before the reader asks; a keyboard reader lands in the player.
  test("keyboard: Enter on an embed puts the named player in its place and moves focus into it", async ({
    page,
  }) => {
    await visitStates(page, "player", theme);
    const host = page.locator("[data-mount='embed']");
    const link = host.getByRole("link", {
      name: "Watch on YouTube: A keynote on publishing with Prelum",
    });
    await expect(host.locator("iframe")).toHaveCount(0);
    await link.focus();
    await page.keyboard.press("Enter");
    const frame = host.locator("iframe[title='A keynote on publishing with Prelum']");
    await expect(frame).toBeFocused();
    await expect(frame).toHaveAttribute("src", "about:blank");
  });

  test("keyboard: the scrubber seeks a minute with Page Up, to the end with End and to the start with Home", async ({
    page,
  }) => {
    await visitStates(page, "player", theme, "surface");
    const seek = page.getByRole("region", { name: "Player" }).getByRole("slider", { name: "Seek" });
    await seek.focus();
    await page.keyboard.press("PageUp");
    await expect(seek).toHaveAttribute("aria-valuetext", /^1 minute/);
    await page.keyboard.press("End");
    await expect(seek).toHaveAttribute("aria-valuetext", /^2 minutes of 2 minutes$/);
    await page.keyboard.press("Home");
    await expect(seek).toHaveAttribute("aria-valuetext", /^0 seconds|^1 second /);
  });

  test("behavior: the dock steps aside (inert) while the track's own surface is on screen", async ({
    page,
  }) => {
    await visitStates(page, "player", theme, "surface");
    const surface = page.getByRole("region", { name: "Player" });
    await surface.getByRole("button", { name: "Play", exact: true }).click();
    const dock = page.locator(".cap-player-dock");
    await expect(dock).toHaveAttribute("inert", "");
    await page.locator(".player-sample-tail").scrollIntoViewIfNeeded();
    await expect(dock).not.toHaveAttribute("inert");
    await expect(page.getByRole("region", { name: "Audio player" })).toBeVisible();
  });

  test("behavior: a press on a transcript line plays from there and marks it current", async ({
    page,
  }) => {
    await visitStates(page, "player", theme, "surface");
    const line = page.getByRole("button", { name: /^The first thing we moved was the player/ });
    await line.click();
    const seek = page.getByRole("region", { name: "Player" }).getByRole("slider", { name: "Seek" });
    await expect(seek).toHaveAttribute("aria-valuetext", /^3\d seconds of/);
    await expect(line).toHaveAttribute("aria-current", "true");
  });

  test("behavior: the playback speed is remembered on the next visit", async ({ page }) => {
    await visitStates(page, "player", theme, "dock");
    await page.evaluate(() => localStorage.removeItem("cap-specimen-rate"));
    await page.reload();
    const dock = page.getByRole("region", { name: "Audio player" });
    await dock.getByRole("button", { name: "Playback speed, currently 1.0x" }).click();
    await page.getByRole("radio", { name: "1.5x" }).check();
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(
      page.getByRole("region", { name: "Audio player" }).getByRole("button", {
        name: "Playback speed, currently 1.5x",
      }),
    ).toBeVisible();
    await page.evaluate(() => localStorage.removeItem("cap-specimen-rate"));
  });

  test("keyboard: on a phone, More opens the player's sheet and Esc gives focus back to More", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await visitStates(page, "player", theme, "dock-phone");
    const more = page.getByRole("button", { name: "More player controls" });
    await more.focus();
    await page.keyboard.press("Enter");
    const sheet = page.getByRole("dialog", { name: "Player controls" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("group", { name: "Sleep timer" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(more).toBeFocused();
  });

  test("keyboard: Enter on the inline audio button plays the clip, and again stops it", async ({
    page,
  }) => {
    await visitStates(page, "player", theme);
    const sample = page.locator("#clip-sample");
    await expect(sample.getByRole("link")).toBeHidden();
    const button = sample.getByRole("button", { name: "Hear how Capsomer is pronounced" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-pressed", "false");
  });
});
