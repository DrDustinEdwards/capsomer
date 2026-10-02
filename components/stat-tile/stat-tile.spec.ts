import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const grid = "section[aria-labelledby='s-grid']";

// The distinct vertical positions of the tiles in a list: how many rows they sit on.
function rowTops(page: Page, sel: string): Promise<number[]> {
  return page.locator(sel).evaluate((list) => Array.from(list.querySelectorAll(".cap-tile")).map((t) => Math.round(t.getBoundingClientRect().top)));
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
          - link /^6 of 6 Sites up All up/
        - listitem:
          - button /^2 jobs Blocked on you Waiting on you/
        - listitem:
          - link /^2,140 of 2,000 Actions minutes Over limit/
        - listitem:
          - link /^No data Primary backup The health route has not been read yet/
        - listitem:
          - button /^78% of today's limit D1 rows read Near limit/
        - listitem:
          - link /^0 Open findings None open/
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
      // A tile with its numbers has one more stop after it: the chart frame's "Show data".
      if (await page.locator(".cap-chart-data > summary:focus").count()) await page.keyboard.press("Tab");
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

  test("behaviour: the row wraps onto more rows at phone width, and no tile runs out of its row", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "stat-tile", theme, "phone");
    const rows = await rowTops(page, ".cap-tiles-list");
    expect(new Set(rows).size, "tiles on more than one row").toBeGreaterThan(1);
    const spill = await page.locator(".cap-tiles-list").evaluate((list) => {
      const edge = list.getBoundingClientRect().right + 1;
      return Array.from(list.querySelectorAll(".cap-tile")).filter((t) => t.getBoundingClientRect().right > edge).length;
    });
    expect(spill).toBe(0);
  });

  test("behaviour: a tile is never narrower than its text, at any width", async ({ page }) => {
    for (const width of [390, 760, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await visitStates(page, "stat-tile", theme);
      const cut = await page.locator(`${grid} .cap-tile`).evaluateAll((tiles) =>
        tiles.filter((t) => Array.from(t.querySelectorAll<HTMLElement>(".cap-tile-line, .cap-tile-detail")).some((el) => el.scrollWidth > el.clientWidth + 1)).length,
      );
      expect(cut, `tiles with cut text at ${width} px`).toBe(0);
    }
  });

  test("behaviour: no data says so with its reason, never a zero", async ({ page }) => {
    await visitStates(page, "stat-tile", theme);
    for (const tile of await page.locator(".cap-tile[data-tone='nodata']").all()) {
      await expect(tile.locator(".cap-tile-figure")).toHaveText("No data");
      await expect(tile.locator(".cap-tile-detail")).not.toBeEmpty();
    }
  });

  test("behaviour: a tile with its numbers sits in a chart frame, Show data outside the link", async ({ page }) => {
    await visitStates(page, "stat-tile", theme);
    const frame = page.locator("#grid-sites-chart-frame");
    await expect(frame.locator("a.cap-tile")).toHaveCount(1);
    await expect(frame.locator("a.cap-tile details, a.cap-tile summary")).toHaveCount(0);
    await expect(frame.getByText("Show data")).toBeVisible();
    // The sentence is text in the page, still hidden from the eye, and the tile is described by it.
    await expect(frame.locator(".cap-chart-summary")).toContainText("Sites up, last 7 days");
    await expect(frame.locator("a.cap-tile")).toHaveAttribute("aria-describedby", "grid-sites-chart");
    await frame.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(frame.getByRole("table")).toBeVisible();
    await expect(frame.getByRole("row", { name: /Tue 29 Sep/ })).toBeVisible();
  });
});
