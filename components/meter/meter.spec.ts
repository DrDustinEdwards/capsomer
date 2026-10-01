import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// The fill's drawn share of the bar: the x scale of its transform.
function drawn(page: Page, id: string): Promise<number> {
  return page.evaluate((sel) => {
    const fill = document.querySelector(`${sel} .cap-meter-fill`);
    if (!fill) return NaN;
    return new DOMMatrixReadOnly(getComputedStyle(fill).transform).a;
  }, `#${id}`);
}

// The fill against its track, as a boundary (3:1).
function fillContrast(page: Page, id: string): Promise<number> {
  return page.evaluate((sel) => {
    const rgb = (s: string) => (s.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
    const lum = ([r = 0, g = 0, b = 0]: number[]) => {
      const f = (v: number) => {
        const x = v / 255;
        return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const a = lum(rgb(getComputedStyle(document.querySelector(`${sel} .cap-meter-fill`)!).backgroundColor));
    const b = lum(rgb(getComputedStyle(document.querySelector(`${sel} .cap-meter-bar`)!).backgroundColor));
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, `#${id}`);
}

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "meter", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the label, the number and the note reach their contrast", async ({ page }) => {
    await visitStates(page, "meter", theme);
    await expectContrast(page, [
      { sel: "#sample-warn .cap-meter-label", what: "meter label" },
      { sel: "#sample-warn .cap-meter-value", what: "meter number" },
      { sel: "#sample-warn .cap-meter-note .cap-status", what: "warning word" },
      { sel: "#sample-crit .cap-meter-note .cap-status", what: "critical word" },
      { sel: "#sample-crit .cap-meter-note", what: "the note" },
      { sel: "#sample-nodata .cap-status", what: "no data word" },
    ]);
    for (const id of ["sample-low", "sample-warn", "sample-crit"]) {
      expect(await fillContrast(page, id), `${id} fill against its track`).toBeGreaterThanOrEqual(3);
    }
  });

  test("accessibility: the meters' roles, names and values", async ({ page }) => {
    await visitStates(page, "meter", theme);
    await expect(page.locator("#sample-warn")).toMatchAriaSnapshot(`
      - meter "Worker requests"
    `);
    const warn = page.getByRole("meter", { name: "Worker requests" });
    await expect(warn).toHaveAttribute("aria-valuenow", "78000");
    await expect(warn).toHaveAttribute("aria-valuetext", /78,000 of 100,000 requests today\. Warning/);
    // No data is not a meter at zero: it has no meter role at all.
    await expect(page.locator("#sample-nodata")).not.toHaveAttribute("role", "meter");
    await expect(page.getByRole("meter")).toHaveCount(5);
  });

  test("behaviour: the fill's length follows the value", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "meter", theme);
    expect(await drawn(page, "sample-low")).toBeCloseTo(0.12, 2);
    expect(await drawn(page, "sample-warn")).toBeCloseTo(0.78, 2);
    expect(await drawn(page, "sample-full")).toBeCloseTo(1, 2);
    await page.locator("#sample-warn").evaluate((m) => m.setAttribute("data-value", "50000"));
    await expect.poll(() => drawn(page, "sample-warn")).toBeCloseTo(0.5, 2);
  });

  test("behaviour: tones colour the fill, and each tone has a word beside it", async ({ page }) => {
    await visitStates(page, "meter", theme);
    const colours = await page.evaluate(() =>
      ["#sample-low", "#sample-warn", "#sample-crit"].map((s) => getComputedStyle(document.querySelector(`${s} .cap-meter-fill`)!).backgroundColor),
    );
    expect(new Set(colours).size).toBe(3);
    await expect(page.locator("#sample-warn .cap-meter-note")).toContainText("Near the limit");
    await expect(page.locator("#sample-crit .cap-meter-note")).toContainText("Almost out");
  });
});
