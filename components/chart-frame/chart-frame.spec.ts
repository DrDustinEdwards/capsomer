import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// Enarratio tests its own figure (the head, the table, the CSV link, the keys); these cover what
// the frame adds: its type and colors, the no-data state, the layout at a phone's width, the
// token mapping, and the React frame's redraw.
eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "chart-frame", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the title, finding, Show data and the no-data reason reach their contrast", async ({ page }) => {
    await visitStates(page, "chart-frame", theme);
    await expectContrast(page, [
      { sel: "#cf-bar .enarratio-title", what: "the title" },
      { sel: "#cf-bar .enarratio-finding", what: "the finding" },
      { sel: "#cf-bar .enarratio-data > summary", what: "the Show data label" },
      { sel: "#cf-open .enarratio-data td", what: "a table cell" },
      { sel: "[data-state='nodata'] .cap-chart-reason", what: "the no-data reason" },
    ]);
  });

  test("accessibility: at 320 px wide nothing scrolls the page sideways, with the data open", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await visitStates(page, "chart-frame", theme);
    await page.locator("#cf-narrow .enarratio-data > summary").click();
    await expectNoAxeViolations(page, "section[aria-labelledby='s-narrow']");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "the page does not scroll sideways").toBeLessThanOrEqual(0);
  });

  test("behavior: the numbers are in the delivered HTML while Show data is closed, and no data has no table", async ({ page }) => {
    const html = await (await page.request.get("components/chart-frame/states.html")).text();
    const bar = html.slice(html.indexOf('id="cf-bar"'), html.indexOf("</figure>", html.indexOf('id="cf-bar"')));
    expect(bar).toMatch(/<details class="enarratio-data">/);
    expect(bar).toContain('<th scope="row">Wed</th>');
    await visitStates(page, "chart-frame", theme);
    const nodata = page.locator("[data-state='nodata']");
    await expect(nodata).toContainText("No data");
    await expect(nodata.locator("details, table, svg.enarratio")).toHaveCount(0);
  });

  test("behavior: the chart reads its colors from Capsomer's tokens, and a family on a wrapper re-resolves them", async ({ page }) => {
    await visitStates(page, "chart-frame", theme);
    const fill = (sel: string) => page.evaluate((s) => getComputedStyle(document.querySelector(s)!).fill, sel);
    const cell = "#cf-heat svg rect[fill*='sequential']";
    const before = await fill(cell);
    await page.evaluate(() => {
      const el = document.querySelector("#cf-heat")!.closest(".cap-chart") as HTMLElement;
      el.setAttribute("data-family", "fox");
      el.style.setProperty("--ramp-1", "rgb(1, 2, 3)");
      document.documentElement.style.setProperty("--series-1", "rgb(255, 0, 0)");
    });
    expect(await fill(cell)).toBe("rgb(1, 2, 3)");
    expect(before).not.toBe("rgb(1, 2, 3)");
    expect(await page.evaluate(() => getComputedStyle(document.querySelector("#cf-spark svg path[stroke^='var']")!).stroke)).toBe("rgb(255, 0, 0)");
  });

  test("behavior: the React frame redraws to its column's width and shows a refusal in the chart's place", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await visitStates(page, "chart-frame", theme);
    const svg = page.locator("[data-mount='redraw'] svg[viewBox]").first();
    await expect.poll(async () => Number(await svg.getAttribute("width"))).toBeLessThan(400);
    await expect(page.locator("[data-mount='refused']")).toContainText("This chart could not be drawn");
  });
});
