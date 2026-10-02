import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "chart-frame", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations with the data open, in a narrow column", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await visitStates(page, "chart-frame", theme);
    await page.locator("#cf-narrow details > summary").click();
    await expectNoAxeViolations(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "the page does not scroll sideways").toBeLessThanOrEqual(0);
  });

  test("accessibility: the title, summary, figure and disclosure reach their contrast", async ({ page }) => {
    await visitStates(page, "chart-frame", theme);
    await expectContrast(page, [
      { sel: "#cf-spark .cap-chart-title", what: "the title" },
      { sel: "#cf-spark .cap-chart-summary", what: "the summary sentence" },
      { sel: "#cf-spark .cap-chart-meta", what: "the figure beside the title" },
      { sel: "#cf-spark .cap-chart-data > summary", what: "the Show data label" },
      { sel: "#cf-up .cap-table td", what: "a table cell" },
      { sel: "#cf-nodata .cap-chart-summary", what: "the no-data reason" },
    ]);
  });

  test("accessibility: the figure is named by its title and described by its summary", async ({ page }) => {
    await visitStates(page, "chart-frame", theme);
    const fig = page.locator("#cf-spark");
    await expect(fig).toHaveAttribute("aria-labelledby", "cf-spark-title");
    await expect(fig).toHaveAttribute("aria-describedby", "cf-spark-summary");
    await expect(page.getByRole("figure", { name: "Actions minutes per day", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("img", { name: /Actions minutes per day, last 7 days: 7 values/ }).first()).toBeVisible();
    await expect(page.locator("#cf-spark .cap-table-wrap")).toHaveAttribute("aria-label", "Actions minutes per day, last 7 days");
  });

  test("keyboard: Show data opens the table with Enter, closes it with Space, and the words swap", async ({ page }) => {
    await visitStates(page, "chart-frame", theme);
    const details = page.locator("#cf-spark details");
    const summary = details.locator("summary");
    await summary.focus();
    await expect(summary).toBeFocused();
    await expect(details).not.toHaveAttribute("open", "");
    await expect(page.locator("#cf-spark").getByText("Show data")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(details).toHaveAttribute("open", "");
    await expect(page.locator("#cf-spark").getByText("Hide data")).toBeVisible();
    await expect(page.locator("#cf-spark").getByText("Show data")).toBeHidden();
    await page.keyboard.press("Tab");
    await expect(page.locator("#cf-spark .cap-table-wrap")).toBeFocused();
    await summary.focus();
    await page.keyboard.press("Space");
    await expect(details).not.toHaveAttribute("open", "");
  });

  test("behaviour: the table is in the delivered HTML while the disclosure is closed", async ({ page }) => {
    const html = await (await page.request.get("components/chart-frame/states.html")).text();
    const closed = html.slice(html.indexOf('id="cf-spark-title"'), html.indexOf('id="cf-up-title"'));
    expect(closed).toContain("<details");
    expect(closed).not.toContain("<details class=\"cap-disclosure cap-chart-data\" data-variant=\"accordion\" open");
    expect(closed).toContain('<th scope="row">1</th>');
    expect(closed).toContain("260");
    // The sentence is text in the page, not only an attribute of the image.
    expect(closed).toContain('<p class="cap-chart-summary"');
  });

  test("behaviour: closed by default, open by option", async ({ page }) => {
    await visitStates(page, "chart-frame", theme);
    await expect(page.locator("#cf-spark details")).not.toHaveAttribute("open", "");
    await expect(page.locator("#cf-up details")).toHaveAttribute("open", "");
    await expect(page.locator("#cf-up .cap-table")).toBeVisible();
  });

  test("behaviour: no data is a reason, with no chart and no table", async ({ page }) => {
    await visitStates(page, "chart-frame", theme);
    const frame = page.locator("#cf-nodata");
    await expect(frame).toContainText("No data");
    await expect(frame).toContainText("has not reported yet");
    await expect(frame.locator("details, table, svg.enarratio")).toHaveCount(0);
  });

  test("behaviour: a summary kept for screen readers is in the page but not drawn", async ({ page }) => {
    await visitStates(page, "chart-frame", theme);
    const summary = page.locator("#cf-hid .cap-chart-summary");
    await expect(summary).toHaveText("Sites up, last 7 days: 6 of 6 every day.");
    const box = await summary.boundingBox();
    expect((box?.width ?? 99) <= 1 && (box?.height ?? 99) <= 1).toBe(true);
  });

  test("behaviour: the chart reads its colour from Capsomer's tokens, so a token change reaches it", async ({ page }) => {
    await visitStates(page, "chart-frame", theme);
    const stroke = () => page.evaluate(() => getComputedStyle(document.querySelector("#cf-spark svg path[stroke^=\"var\"]")!).stroke);
    const series1 = await page.evaluate(() => {
      const probe = document.createElement("i");
      probe.style.color = "var(--series-1)";
      document.body.append(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    expect(await stroke()).toBe(series1);
    await page.evaluate(() => document.documentElement.style.setProperty("--series-1", "rgb(255, 0, 0)"));
    expect(await stroke()).toBe("rgb(255, 0, 0)");
  });

  test("behaviour: a family on a wrapper re-resolves the ramp the heat strip reads", async ({ page }) => {
    await visitStates(page, "chart-frame", theme);
    const cell = "#cf-heat svg rect[fill*='sequential']";
    const read = () => page.evaluate((sel) => getComputedStyle(document.querySelector(sel)!).fill, cell);
    const before = await read();
    // A wrapper that sets a family (or density) re-resolves the mapping where it is declared.
    await page.evaluate(() => {
      const el = document.querySelector("#cf-heat")!;
      el.setAttribute("data-family", "fox");
      (el as HTMLElement).style.setProperty("--ramp-1", "rgb(1, 2, 3)");
    });
    expect(await read()).toBe("rgb(1, 2, 3)");
    expect(before).not.toBe("rgb(1, 2, 3)");
  });
});
