import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const section = (id: string) => `section[aria-labelledby='${id}']`;

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "uptime-strip", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the caption, figure, legend and summary reach their contrast", async ({ page }) => {
    await visitStates(page, "uptime-strip", theme);
    await expectContrast(page, [
      { sel: ".cap-uptime-title", what: "the strip's title" },
      { sel: ".cap-uptime-pct", what: "the uptime percent" },
      { sel: ".cap-uptime-figure", what: "the window" },
      { sel: ".cap-uptime-legend li", what: "the legend" },
      { sel: ".cap-uptime-summary", what: "the summary" },
    ]);
  });

  test("accessibility: the figure is named by its caption and holds a named chart, a key and a summary", async ({ page }) => {
    await visitStates(page, "uptime-strip", theme);
    await expect(page.locator(section("s-outage")).locator(".cap-uptime")).toMatchAriaSnapshot(`
      - figure "foxhound.app 96.1% up over 7 days":
        - img /down in 1, partly down in 2/
        - list "Key":
          - listitem: Up
          - listitem: Down
          - listitem: Partly down
          - listitem: No data
        - paragraph: /except one outage on Tuesday 29 September/
    `);
  });

  test("keyboard: Tab reaches the numbers by day, Enter opens them, and the table's region is next", async ({ page }) => {
    await visitStates(page, "uptime-strip", theme);
    const outage = page.locator(section("s-outage"));
    const summary = outage.locator("summary");
    await summary.focus();
    await expect(summary).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(outage.locator("details")).toHaveAttribute("open", "");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("region", { name: "Uptime by day, foxhound.app" })).toBeFocused();
    await expect(page.getByRole("row", { name: /Tue 29 Sep 72.9%/ })).toBeVisible();
  });

  test("behaviour: no data is a state with a reason, never a zero", async ({ page }) => {
    await visitStates(page, "uptime-strip", theme);
    const nodata = page.locator(section("s-no-data"));
    await expect(nodata.locator(".cap-uptime-figure")).toHaveText("100% up over the 6 of 7 days with data");
    await expect(nodata.locator(".cap-uptime-summary")).toContainText("no data for Saturday 26 September");
    await nodata.locator("summary").click();
    await expect(nodata.getByRole("row", { name: /Sat 26 Sep/ })).toContainText("No data: the watcher did not run");
    await expect(nodata.getByRole("row", { name: /Sat 26 Sep/ })).not.toContainText("0%");
  });

  test("behaviour: the legend shows each kind of slot by shape as well as colour", async ({ page }) => {
    await visitStates(page, "uptime-strip", theme);
    const keys = page.locator(section("s-all-up")).locator(".cap-uptime-key");
    await expect(keys).toHaveCount(4);
    const images = await keys.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundImage));
    // Up and down are solid; partly down is split; no data is hatched.
    expect(images[0]).toBe("none");
    expect(images[1]).toBe("none");
    expect(images[2]).toContain("linear-gradient");
    expect(images[3]).toContain("repeating-linear-gradient");
  });
});
