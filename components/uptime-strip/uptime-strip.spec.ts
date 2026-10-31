import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// Enarratio tests its strip, sentence and table; these cover what the component adds: the
// percent, the legend, the inline form, and that its parts reach their contrast.
const section = (id: string) => `section[aria-labelledby='${id}']`;

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "uptime-strip", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the title, window, finding, legend and inline percent reach their contrast", async ({ page }) => {
    await visitStates(page, "uptime-strip", theme);
    await expectContrast(page, [
      { sel: "#up-2 .enarratio-title", what: "the strip's title" },
      { sel: "#up-2 .enarratio-subtitle", what: "the uptime and its window" },
      { sel: "#up-2 .enarratio-finding", what: "the finding" },
      { sel: ".cap-uptime-legend li", what: "the legend" },
      { sel: `${section("s-line")} .cap-uptime-pct`, what: "the percent beside an inline strip" },
      { sel: `${section("s-line")} .cap-status`, what: "no data in a cell" },
    ]);
  });

  test("accessibility: the figure is named, its strip is a named image, and the key follows it", { tag: "@markup" }, async ({ page }) => {
    await visitStates(page, "uptime-strip", theme);
    const outage = page.locator(section("s-outage"));
    await expect(outage.getByRole("figure", { name: /foxhound\.app/ })).toBeVisible();
    await expect(outage.getByRole("img", { name: /down on Tuesday, September 29/ })).toBeVisible();
    await expect(outage.getByRole("list", { name: "Key" }).getByRole("listitem")).toHaveText(["Up", "Degraded", "Down", "No data"]);
    await expect(page.locator(section("s-line")).getByRole("img", { name: /Uptime of foxhound\.app, 7 days/ })).toBeVisible();
  });

  test("behavior: no data is a slot with its reason, never a zero", async ({ page }) => {
    await visitStates(page, "uptime-strip", theme);
    const nodata = page.locator(section("s-no-data"));
    await expect(nodata.locator(".enarratio-subtitle")).toHaveText("100% up over the 6 of 7 days with data");
    await nodata.getByText("Show data").click();
    await expect(nodata.getByRole("row", { name: /Sat, Sep 26/ })).toContainText("no data");
  });

  test("behavior: the legend draws each kind of slot by shape as well as color", async ({ page }) => {
    await visitStates(page, "uptime-strip", theme);
    const keys = page.locator(section("s-all-up")).locator(".cap-uptime-key");
    const shapes = await keys.evaluateAll((els) => els.map((el) => [getComputedStyle(el).backgroundImage, getComputedStyle(el).outlineStyle]));
    // Up, degraded and down are ticks of three heights; no data is a dashed outline.
    expect(new Set(shapes.slice(0, 3).map(([bg]) => bg)).size).toBe(3);
    expect(shapes[3]).toEqual(["none", "dashed"]);
  });
});
