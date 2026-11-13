import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "feed", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "feed", theme, "narrow");
    await expectNoAxeViolations(page);
  });

  test("accessibility: every text tone and glyph reaches its contrast", async ({ page }) => {
    await visitStates(page, "feed", theme);
    await expectContrast(page, [
      { sel: "#feed-day .cap-feed-day-title", what: "a day heading" },
      { sel: "#feed-day .cap-feed-what", what: "what happened" },
      { sel: "#feed-day .cap-feed-who", what: "who and the detail" },
      { sel: "#feed-day .cap-feed-when", what: "when" },
      {
        sel: "#feed-day .cap-feed-row[data-tone='ok'] > .cap-feed-glyph",
        what: "an ok glyph",
        min: 3,
      },
      {
        sel: "#feed-day .cap-feed-row[data-tone='crit'] > .cap-feed-glyph",
        what: "a failed glyph",
        min: 3,
      },
      {
        sel: "#feed-condensed .cap-feed-row[data-kind='condensed'] .cap-feed-what",
        what: "a condensed run",
      },
      {
        sel: "#feed-condensed .cap-feed-row[data-kind='condensed'] .cap-feed-when",
        what: "a condensed run's times",
      },
      {
        sel: "#feed-condensed .cap-feed-row[data-kind='condensed'] > .cap-feed-glyph",
        what: "a condensed run's dot",
        min: 3,
      },
      {
        sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='crit'] .cap-feed-marker-link",
        what: "a critical marker's link",
      },
      {
        sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='crit'] .cap-feed-who",
        what: "a critical marker's detail",
      },
      {
        sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='crit'] .cap-feed-when",
        what: "a critical marker's time",
      },
      {
        sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='crit'] > .cap-feed-glyph",
        what: "a critical marker's glyph",
        min: 3,
      },
      {
        sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='warn'] .cap-feed-marker-link",
        what: "a warning marker's link",
      },
      {
        sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='warn'] .cap-feed-who",
        what: "a warning marker's detail",
      },
      {
        sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='warn'] > .cap-feed-glyph",
        what: "a warning marker's glyph",
        min: 3,
      },
    ]);
  });
});
