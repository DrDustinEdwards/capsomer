import { expect, test, type Page } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";
import { ratio, toneFor } from "./meter.ts";

// The fill's drawn share of the bar: the x scale of its transform.
function drawn(page: Page, id: string): Promise<number> {
  return page.evaluate((sel) => {
    const fill = document.querySelector(`${sel} .cap-meter-fill`);
    if (!fill) return NaN;
    return new DOMMatrixReadOnly(getComputedStyle(fill).transform).a;
  }, `#${id}`);
}

// A custom property the behavior module set on a bar.
function barVar(page: Page, id: string, name: string): Promise<string> {
  return page.evaluate(
    ([sel, prop]) =>
      getComputedStyle(document.querySelector(`${sel} .cap-meter-bar`)!)
        .getPropertyValue(prop as string)
        .trim(),
    [`#${id}`, name],
  );
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
    const a = lum(
      rgb(getComputedStyle(document.querySelector(`${sel} .cap-meter-fill`)!).backgroundColor),
    );
    const b = lum(
      rgb(getComputedStyle(document.querySelector(`${sel} .cap-meter-bar`)!).backgroundColor),
    );
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, `#${id}`);
}

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "meter", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the label, the number and the note reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "meter", theme);
    await expectContrast(page, [
      { sel: "#sample-warn .cap-meter-label", what: "meter label" },
      { sel: "#sample-warn .cap-meter-value", what: "meter number" },
      { sel: "#sample-warn .cap-status", what: "warning word" },
      { sel: "#sample-crit .cap-status", what: "critical word" },
      { sel: "#sample-crit .cap-meter-note", what: "the note" },
      { sel: "#sample-nodata .cap-status", what: "no data word" },
      { sel: "#sample-indeterminate .cap-status", what: "measuring word" },
    ]);
    for (const id of ["sample-low", "sample-warn", "sample-crit"]) {
      expect(await fillContrast(page, id), `${id} fill against its track`).toBeGreaterThanOrEqual(
        3,
      );
    }
  });

  test("accessibility: nothing moves under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "meter", theme);
    const motion = await page.evaluate(() => {
      const fill = getComputedStyle(document.querySelector("#sample-warn .cap-meter-fill")!);
      const sweep = getComputedStyle(
        document.querySelector("#sample-indeterminate .cap-meter-fill")!,
      );
      return { fill: fill.transitionDuration, sweep: sweep.animationName };
    });
    // base.css shortens every duration to 0.01 ms under reduced motion: that is no motion.
    expect(parseFloat(motion.fill)).toBeLessThanOrEqual(0.001);
    expect(motion.sweep).toBe("none");
  });

  test("behavior: the fill's length follows the value, and redraws when it changes", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "meter", theme);
    expect(await drawn(page, "sample-low")).toBeCloseTo(0.12, 2);
    expect(await drawn(page, "sample-warn")).toBeCloseTo(0.78, 2);
    expect(await drawn(page, "sample-full")).toBeCloseTo(1, 2);
    await page
      .locator("#sample-warn .cap-meter-bar")
      .evaluate((m) => m.setAttribute("aria-valuenow", "50000"));
    await expect.poll(() => drawn(page, "sample-warn")).toBeCloseTo(0.5, 2);
  });

  test("behavior: the threshold tick and the projection are placed from their values", async ({
    page,
  }) => {
    await visitStates(page, "meter", theme);
    expect(Number(await barVar(page, "sample-threshold", "--cap-meter-threshold"))).toBeCloseTo(
      0.8,
      3,
    );
    expect(Number(await barVar(page, "sample-projection", "--cap-meter-projected"))).toBeCloseTo(
      0.86682,
      4,
    );
    expect(Number(await barVar(page, "sample-projection", "--cap-meter-ratio"))).toBeCloseTo(
      0.614,
      3,
    );
    // A bar with neither has no tick and no projection drawn.
    expect(await barVar(page, "sample-low", "--cap-meter-threshold")).toBe("");
    expect(await barVar(page, "sample-low", "--cap-meter-projected")).toBe("");
    const tick = await page
      .locator("#sample-threshold .cap-meter-bar")
      .evaluate((el) => getComputedStyle(el, "::after").content);
    expect(tick).not.toBe("none");
  });
});

// Pure functions: these run in Node, once.
test.describe("ratio() and toneFor()", () => {
  test("behavior: the ratio is the share of the span, clamped; no value is zero", () => {
    expect(ratio(50, 100)).toBe(0.5);
    expect(ratio(150, 100)).toBe(1);
    expect(ratio(-5, 100)).toBe(0);
    expect(ratio(5, 15, 5)).toBe(0);
    expect(ratio(Number.NaN, 100)).toBe(0);
    expect(ratio(5, 0)).toBe(0);
  });

  test("behavior: tone by threshold is warning from 75% and critical from 90% unless told otherwise", () => {
    expect(toneFor(74, 100)).toBe("ok");
    expect(toneFor(75, 100)).toBe("warn");
    expect(toneFor(90, 100)).toBe("crit");
    expect(toneFor(60, 100, { warnAt: 0.5, critAt: 0.8 })).toBe("warn");
    expect(toneFor(15, 25, { min: 5, critAt: 0.5 })).toBe("crit");
  });
});
