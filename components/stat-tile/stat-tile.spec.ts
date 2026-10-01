import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const grid = "section[aria-labelledby='s-grid']";

function columns(page: Page, sel: string): Promise<number> {
  return page.locator(sel).evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean).length);
}

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "stat-tile", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "stat-tile", theme, "phone");
    await expectNoAxeViolations(page);
  });

  test("accessibility: every text tone a tile paints reaches its contrast", async ({ page }) => {
    await visitStates(page, "stat-tile", theme);
    await expectContrast(page, [
      { sel: `${grid} .cap-tile-label`, what: "a tile's label" },
      { sel: "section[aria-labelledby='s-ok'] .cap-tile-figure", what: "an ok figure" },
      { sel: "section[aria-labelledby='s-ok'] .cap-tile-word", what: "an ok word" },
      { sel: `${grid} .cap-tile-figure small`, what: "a figure's unit" },
      { sel: "section[aria-labelledby='s-warn'] .cap-tile-figure", what: "a warning figure" },
      { sel: "section[aria-labelledby='s-warn'] .cap-tile-word", what: "a warning word" },
      { sel: "section[aria-labelledby='s-crit'] .cap-tile-figure", what: "a critical figure" },
      { sel: "section[aria-labelledby='s-crit'] .cap-tile-word", what: "a critical word" },
      { sel: "section[aria-labelledby='s-nodata'] .cap-tile-figure", what: "a no-data figure" },
      { sel: "section[aria-labelledby='s-nodata'] .cap-tile-detail", what: "a detail line" },
      { sel: "section[aria-labelledby='s-force'] [data-force='hover'] .cap-tile-detail", what: "a detail line on a hovered tile" },
      { sel: "section[aria-labelledby='s-force'] [data-force='hover'] .cap-tile-label", what: "a label on a hovered tile" },
      { sel: "section[aria-labelledby='s-force'] [data-force='pressed'] .cap-tile-detail", what: "a detail line on a pressed tile" },
    ]);
  });

  test("accessibility: the focus ring reaches its contrast", async ({ page }) => {
    await visitStates(page, "stat-tile", theme);
    await page.locator(grid).getByRole("link", { name: /Sites up/ }).focus();
    await expectContrast(page, [{ sel: `${grid} .cap-tile:focus-visible`, what: "a focused tile's ring", part: "outline" }]);
  });

  test("accessibility: the tiles' roles and names", async ({ page }) => {
    await visitStates(page, "stat-tile", theme);
    await expect(page.locator(`${grid} .cap-tiles`)).toMatchAriaSnapshot(`
      - list "Overview figures":
        - listitem:
          - link /^Sites up 6 of 6 All up/
        - listitem:
          - button /^Blocked on you 2 jobs Waiting on you/
        - listitem:
          - link /^Actions minutes 2,140 of 2,000 Over limit/
        - listitem:
          - link /^Primary backup No data The health route has not been read yet/
        - listitem:
          - button /^D1 rows read 78% of today's limit Near limit/
        - listitem:
          - link /^Open findings 0 None open/
    `);
    await expect(page.locator(grid).getByRole("link", { name: /Actions minutes/ })).toHaveAccessibleDescription("Actions minutes per day, last 7 days, rising: 260, 280, 310, 300, 330, 320, 340.");
  });

  test("keyboard: Tab reaches every tile in order", async ({ page }) => {
    await visitStates(page, "stat-tile", theme);
    const tiles = page.locator(`${grid} .cap-tile`);
    await tiles.first().focus();
    const count = await tiles.count();
    for (let i = 1; i < count; i++) {
      await page.keyboard.press("Tab");
      await expect(tiles.nth(i)).toBeFocused();
    }
  });

  test("keyboard: Enter on a link tile follows it", async ({ page }) => {
    await visitStates(page, "stat-tile", theme);
    await page.locator(grid).getByRole("link", { name: /Actions minutes/ }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#budget$/);
  });

  test("keyboard: Enter on a button tile activates it", async ({ page }) => {
    await visitStates(page, "stat-tile", theme);
    const button = page.locator(grid).getByRole("button", { name: /Blocked on you/ });
    await button.evaluate((el) => el.addEventListener("click", () => el.setAttribute("data-clicked", "yes")));
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("data-clicked", "yes");
  });

  test("behaviour: six across when wide, two across on a phone", async ({ page }) => {
    await visitStates(page, "stat-tile", theme);
    expect(await columns(page, `${grid} .cap-tiles-list`)).toBe(6);
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "stat-tile", theme, "phone");
    expect(await columns(page, ".cap-tiles-list")).toBe(2);
  });

  test("behaviour: three across in a middling space", async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 900 });
    await visitStates(page, "stat-tile", theme);
    expect(await columns(page, `${grid} .cap-tiles-list`)).toBe(3);
  });

  test("behaviour: no data says so with its reason, never a zero", async ({ page }) => {
    await visitStates(page, "stat-tile", theme);
    for (const tile of await page.locator(".cap-tile[data-tone='nodata']").all()) {
      await expect(tile.locator(".cap-tile-figure")).toHaveText("No data");
      await expect(tile.locator(".cap-tile-detail")).not.toBeEmpty();
    }
  });
});
