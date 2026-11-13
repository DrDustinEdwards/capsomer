import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "dictionary-entry", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the entry's words and the speaker reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "dictionary-entry", theme);
    await expectContrast(page, [
      { sel: "#de-default .cap-dictionary-entry-word", what: "the headword" },
      { sel: "#de-default .cap-dictionary-entry-respell", what: "the respelling" },
      { sel: "#de-default .cap-dictionary-entry-label", what: "a sense's subject label" },
      { sel: "#de-default .cap-dictionary-entry-ety", what: "the etymology" },
      { sel: "#de-default button.cap-dictionary-entry-listen", what: "the speaker icon" },
      { sel: "#de-playing", what: "a playing speaker's icon" },
      { sel: "#de-hover", what: "a hovered speaker's icon" },
      {
        sel: "#de-default button.cap-dictionary-entry-listen",
        what: "the speaker's edge",
        part: "border",
      },
    ]);
  });

  test("keyboard: Tab reaches the speaker, named for the word, with its ring", async ({ page }) => {
    await visitStates(page, "dictionary-entry", theme);
    await page.keyboard.press("Tab");
    const speaker = page.getByRole("button", {
      name: "Listen to the pronunciation of Almanac",
    });
    await expect(speaker).toBeFocused();
    await expect(speaker).toHaveAttribute("aria-pressed", "false");
    await expectContrast(page, [
      {
        sel: "#de-default button.cap-dictionary-entry-listen",
        what: "the focus ring",
        part: "outline",
        min: 3,
      },
    ]);
  });

  test("keyboard: Enter plays the clip and a second Enter stops it", async ({ page }) => {
    // The clip is stubbed: the test is the button's state, not the browser's decoder.
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = function () {
        this.dispatchEvent(new Event("play"));
        return Promise.resolve();
      };
      HTMLMediaElement.prototype.pause = function () {
        this.dispatchEvent(new Event("pause"));
      };
    });
    await visitStates(page, "dictionary-entry", theme);
    const speaker = page.getByRole("button", { name: "Listen to the pronunciation of Almanac" });
    await speaker.focus();
    await page.keyboard.press("Enter");
    await expect(speaker).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Enter");
    await expect(speaker).toHaveAttribute("aria-pressed", "false");
  });

  test("behavior: a clip that cannot play brings the link back, with focus on it", async ({
    page,
  }) => {
    await visitStates(page, "dictionary-entry", theme);
    const entry = page.locator("#de-default");
    await entry.getByRole("button", { name: "Listen to the pronunciation of Almanac" }).focus();
    await page.keyboard.press("Space");
    const link = entry.getByRole("link", { name: "Listen to the pronunciation of Almanac" });
    await expect(link).toBeVisible();
    await expect(link).toBeFocused();
    await expect(entry.getByRole("button")).toBeHidden();
  });
});
