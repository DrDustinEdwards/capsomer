import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// The focused row's ring is an inset outline over the row's own --sel tint: its contrast is
// the outline colour against the row's background.
function ringContrast(page: Page, sel: string): Promise<{ ring: string; bg: string; ratio: number } | null> {
  return page.evaluate((s) => {
    const el = document.querySelector<HTMLElement>(s);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const rgb = (v: string) => (v.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const lum = (c: number[]) => {
      const f = (x: number) => {
        const t = x / 255;
        return t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(c[0] ?? 0) + 0.7152 * f(c[1] ?? 0) + 0.0722 * f(c[2] ?? 0);
    };
    const a = lum(rgb(cs.outlineColor));
    const b = lum(rgb(cs.backgroundColor));
    return { ring: cs.outlineColor, bg: cs.backgroundColor, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
  }, sel);
}

const firstColumn = (page: Page, table: string, col: number) =>
  page.locator(`${table} tbody tr`).evaluateAll((rows, c) => rows.map((r) => (r as HTMLTableRowElement).cells[c]?.textContent?.trim() ?? ""), col);

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "table", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations, narrow and reflowed", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await visitStates(page, "table", theme, "narrow");
    await expectNoAxeViolations(page);
    await visitStates(page, "table", theme, "reflow");
    await expectNoAxeViolations(page);
    await page.setViewportSize({ width: 600, height: 400 });
    await visitStates(page, "table", theme, "drop");
    await expectNoAxeViolations(page);
  });

  test("accessibility: a column note, small print and the foot link reach their contrast", async ({ page }) => {
    await visitStates(page, "table", theme);
    await expectContrast(page, [
      { sel: "#t5 thead .cap-table-note", what: "a note under a column's name" },
      { sel: "#t5 .cap-table-aside", what: "small print beside a cell's text" },
      { sel: "[aria-labelledby='s-drop'] .cap-table-foot a", what: "the link under the table" },
    ]);
  });

  test("accessibility: headers, cells, links and the sort glyph reach their contrast", async ({ page }) => {
    await visitStates(page, "table", theme);
    await expectContrast(page, [
      { sel: "#t1 thead th:nth-child(2)", what: "a column header" },
      { sel: "#t1 thead th:first-child .cap-table-sort", what: "a sortable column header (and its glyph, at 4.5:1)" },
      { sel: "#t2 thead th[aria-sort] .cap-table-sort", what: "the sorted column's header" },
      { sel: "#t1 tbody td[data-num]", what: "a number cell" },
      { sel: "#t1 tbody .cap-table-open", what: "a row's link" },
      { sel: "#t1 tbody .cap-muted", what: "a muted cell" },
      { sel: "#t1 caption", what: "the caption" },
      { sel: "#t4 tr[data-force='focus'] .cap-table-open", what: "a focused row's link on --sel" },
      { sel: "#t4 tr[data-force='focus'] td:nth-child(3)", what: "a focused row's cell on --sel" },
    ]);
  });

  test("accessibility: selected rows, the footer and the empty cell reach their contrast", async ({ page }) => {
    await visitStates(page, "table", theme);
    await expectContrast(page, [
      { sel: "#t6 #t6-selected th", what: "a selected row's header cell on --sel" },
      { sel: "#t6 #t6-selected td[data-num]", what: "a selected row's number on --sel" },
      { sel: "#t6 tfoot td", what: "the footer's total" },
      { sel: "#t6 caption", what: "the caption under the table" },
      { sel: "#t8 .cap-table-empty", what: "the empty cell's text" },
    ]);
  });

  test("behaviour: a selected row says so with more than colour", async ({ page }) => {
    await visitStates(page, "table", theme);
    const bar = await page.locator("#t6-selected > :first-child").evaluate((el) => getComputedStyle(el).boxShadow);
    expect(bar).not.toBe("none");
    await expect(page.getByRole("checkbox", { name: "Select INV002" })).toBeChecked();
  });

  test("behaviour: a sticky header stays in view while the region scrolls", async ({ page }) => {
    await visitStates(page, "table", theme);
    const region = page.locator("#t7");
    await region.scrollIntoViewIfNeeded();
    await region.evaluate((el) => (el.scrollTop = 120));
    const th = page.locator("#t7 thead th").first();
    const [r, t] = await Promise.all([region.boundingBox(), th.boundingBox()]);
    expect(r && t).toBeTruthy();
    if (r && t) expect(Math.abs(t.y - r.y)).toBeLessThan(2);
  });

  test("accessibility: the focused row's ring is 3:1 against its tint", async ({ page }) => {
    await visitStates(page, "table", theme);
    const r = await ringContrast(page, "#t4 tr[data-force='focus']");
    expect(r, "the focused specimen row is on the page").not.toBeNull();
    expect(r?.ratio ?? 0, `ring ${r?.ring} on ${r?.bg}`).toBeGreaterThanOrEqual(3);
  });

  test("accessibility: the reflowed column names reach their contrast", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await visitStates(page, "table", theme, "reflow");
    // The column name is a ::before, which the shared helper cannot select: measured here,
    // its colour against the first opaque background behind its cell.
    const label = await page.locator("#t-reflow td[data-label='Status']").first().evaluate((el) => {
      const rgb = (v: string) => (v.match(/[\d.]+/g) ?? []).map(Number);
      const lum = (c: number[]) => {
        const f = (x: number) => {
          const t = x / 255;
          return t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(c[0] ?? 0) + 0.7152 * f(c[1] ?? 0) + 0.0722 * f(c[2] ?? 0);
      };
      let bg = [255, 255, 255];
      for (let n: Element | null = el; n; n = n.parentElement) {
        const c = rgb(getComputedStyle(n).backgroundColor);
        if ((c[3] ?? 1) >= 1 && c.length >= 3) {
          bg = c;
          break;
        }
      }
      const cs = getComputedStyle(el, "::before");
      const a = lum(rgb(cs.color));
      const b = lum(bg);
      return { content: cs.content, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
    });
    expect(label.content).toBe('"Status"');
    expect(label.ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("accessibility: the region, table and headers' roles and names", async ({ page }) => {
    await visitStates(page, "table", theme);
    await expect(page.locator("#t2")).toMatchAriaSnapshot(`
      - region "Worker requests by site, today":
        - table "Worker requests by site, today":
          - rowgroup:
            - row:
              - columnheader "Site":
                - button "Site"
              - columnheader "Requests":
                - button "Requests"
              - columnheader "Errors"
          - rowgroup:
            - row:
              - rowheader "germomics.org"
    `);
    await expect(page.locator("#t2 th[aria-sort='ascending']")).toHaveCount(1);
  });

  test("keyboard: the scroll region is focusable and arrow keys scroll it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await visitStates(page, "table", theme, "narrow");
    const region = page.getByRole("region", { name: "Sites" });
    await page.keyboard.press("Tab");
    await expect(region).toBeFocused();
    await expect(region).toHaveCSS("outline-style", "solid");
    const overflows = await region.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(overflows).toBe(true);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  });

  test("keyboard: Enter on a sort button sorts ascending, then descending", async ({ page }) => {
    await visitStates(page, "table", theme);
    const th = page.locator("#t1 thead th").nth(2);
    await page.getByRole("button", { name: "Components used" }).focus();
    await page.keyboard.press("Enter");
    await expect(th).toHaveAttribute("aria-sort", "ascending");
    expect(await firstColumn(page, "#t1", 2)).toEqual(["0", "6", "9", "14"]);
    await page.keyboard.press("Enter");
    await expect(th).toHaveAttribute("aria-sort", "descending");
    expect(await firstColumn(page, "#t1", 2)).toEqual(["14", "9", "6", "0"]);
    await expect(page.getByRole("button", { name: "Components used" })).toBeFocused();
  });

  test("keyboard: Space on a sort button sorts too", async ({ page }) => {
    await visitStates(page, "table", theme);
    await page.getByRole("button", { name: "App" }).focus();
    await page.keyboard.press("Space");
    await expect(page.locator("#t1 thead th").first()).toHaveAttribute("aria-sort", "ascending");
    expect(await firstColumn(page, "#t1", 0)).toEqual(["Capsid Portal", "Carrel", "dustinedwards.info", "Foxhound"]);
  });

  test("keyboard: a row that opens a detail is one tab stop, and Enter follows it", async ({ page }) => {
    await visitStates(page, "table", theme);
    await page.getByRole("link", { name: "Carrel" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Capsid Portal" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#app-portal$/);
  });

  test("behaviour: one header carries aria-sort at a time", async ({ page }) => {
    await visitStates(page, "table", theme);
    await page.getByRole("button", { name: "Own copies left" }).click();
    await page.getByRole("button", { name: "Reported" }).click();
    await expect(page.locator("#t1 thead th[aria-sort]")).toHaveCount(1);
    await expect(page.locator("#t1 thead th").nth(5)).toHaveAttribute("aria-sort", "ascending");
    expect(await firstColumn(page, "#t1", 0)).toEqual(["Foxhound", "dustinedwards.info", "Carrel", "Capsid Portal"]);
  });

  test("behaviour: data-sort orders a cell whose text does not sort", async ({ page }) => {
    await visitStates(page, "table", theme);
    await page.getByRole("button", { name: "Own copies left" }).click();
    expect(await firstColumn(page, "#t1", 3)).toEqual(["not counted", "0", "2", "4"]);
  });

  test("behaviour: a click anywhere on a row follows its link", async ({ page }) => {
    await visitStates(page, "table", theme);
    // The stretched link covers the row, so a click on the row lands on the link.
    await page.locator("#t1 tbody tr").nth(2).click();
    await expect(page).toHaveURL(/#app-site$/);
  });

  test("behaviour: reflow fits the region without scrolling and keeps the header row", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await visitStates(page, "table", theme, "reflow");
    // The header row stays in the accessibility tree (clipped, not removed).
    await expect(page.locator("#t-reflow thead")).toBeAttached();
    const overflows = await page.locator("#t-reflow").evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(overflows).toBe(false);
  });

  test("behaviour: columns marked to drop are shown in a wide region and go, in order, as it narrows", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await visitStates(page, "table", theme);
    const width = await page.locator("#t5").evaluate((el) => el.clientWidth);
    expect(width, "the specimen's region is wide").toBeGreaterThan(820);
    await expect(page.locator("#t5 .cap-table-aside").first()).toBeVisible();
    await expect(page.locator("#t5 thead th[data-drop='2']").first()).toBeVisible();
    await page.setViewportSize({ width: 600, height: 400 });
    await visitStates(page, "table", theme, "drop");
    await expect(page.locator("#t-drop .cap-table-aside").first()).toBeHidden();
    await expect(page.locator("#t-drop thead th[data-drop='2']").first()).toBeHidden();
    await expect(page.getByRole("columnheader", { name: /^Site/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^Status/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^Uptime/ })).toBeVisible();
    // Dropped, so the table fits its region and does not scroll.
    const scrolls = await page.locator("#t-drop").evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(scrolls).toBe(false);
  });

  test("behaviour: no data in a cell says its reason to a screen reader, in two words to the eye", async ({ page }) => {
    await visitStates(page, "table", theme);
    const cell = page.locator("#t5 tbody tr").nth(2).locator("td").nth(2);
    await expect(cell).toContainText("No data");
    await expect(cell.locator(".cap-sr-only")).toHaveText(": no Cloudflare token for this site");
  });

});
