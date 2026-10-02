import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

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
      { sel: "#feed-day .cap-feed-row[data-tone='ok'] > .cap-feed-glyph", what: "an ok glyph", min: 3 },
      { sel: "#feed-day .cap-feed-row[data-tone='crit'] > .cap-feed-glyph", what: "a failed glyph", min: 3 },
      { sel: "#feed-condensed .cap-feed-row[data-kind='condensed'] .cap-feed-what", what: "a condensed run" },
      { sel: "#feed-condensed .cap-feed-row[data-kind='condensed'] .cap-feed-when", what: "a condensed run's times" },
      { sel: "#feed-condensed .cap-feed-row[data-kind='condensed'] > .cap-feed-glyph", what: "a condensed run's dot", min: 3 },
      { sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='crit'] .cap-feed-marker-link", what: "a critical marker's link" },
      { sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='crit'] .cap-feed-who", what: "a critical marker's detail" },
      { sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='crit'] .cap-feed-when", what: "a critical marker's time" },
      { sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='crit'] > .cap-feed-glyph", what: "a critical marker's glyph", min: 3 },
      { sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='warn'] .cap-feed-marker-link", what: "a warning marker's link" },
      { sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='warn'] .cap-feed-who", what: "a warning marker's detail" },
      { sel: "#feed-incident .cap-feed-row[data-kind='marker'][data-tone='warn'] > .cap-feed-glyph", what: "a warning marker's glyph", min: 3 },
    ]);
  });

  test("accessibility: day headings name their lists, and the marker names its deploy", async ({ page }) => {
    await visitStates(page, "feed", theme);
    await expect(page.locator("#feed-incident")).toMatchAriaSnapshot(`
      - heading "Today" [level=4]
      - list "Today":
        - listitem:
          - link "Incident began 4 minutes after this deploy"
        - listitem:
          - link "Roll back"
      - heading "Yesterday" [level=4]
      - list "Yesterday":
        - listitem:
          - link "Error rate rose 2 minutes after this deploy"
    `);
    const marker = page.getByRole("link", { name: "Incident began 4 minutes after this deploy" });
    await expect(marker).toHaveAccessibleDescription("foxhound deployed a91c4e0");
    await expect(page.locator("#feed-day").getByRole("list", { name: "Yesterday" }).getByRole("listitem")).toHaveCount(2);
  });

  test("keyboard: Tab moves through the feed's links in reading order", async ({ page }) => {
    await visitStates(page, "feed", theme);
    const feed = page.locator("#feed-incident");
    await feed.getByRole("link", { name: "Incident began 4 minutes after this deploy" }).focus();
    await page.keyboard.press("Tab");
    await expect(feed.getByRole("link", { name: "Roll back" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(feed.getByRole("link", { name: "Error rate rose 2 minutes after this deploy" })).toBeFocused();
  });

  test("keyboard: Enter on the marker follows it to the incident", async ({ page }) => {
    await visitStates(page, "feed", theme);
    await page.locator("#feed-incident").getByRole("link", { name: "Incident began 4 minutes after this deploy" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#incident-foxhound-412$/);
  });

  test("accessibility: at phone width nothing runs out of the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "feed", theme, "narrow");
    const over = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(over).toBe(false);
  });
});
