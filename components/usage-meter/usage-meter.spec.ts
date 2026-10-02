import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { assess, duration, widths } from "./usage-meter.ts";

// Every specimen is read at 17:00 UTC, 7 hours before a 00:00 UTC reset, with a week of
// history unless the state says otherwise.
const NOW = Date.UTC(2026, 8, 30, 17, 0);
const RESET = Date.UTC(2026, 9, 1, 0, 0);
const WEEK = [52_000, 58_000, 61_000, 49_000, 66_000, 70_000, 63_000];

const section = (id: string) => `section[aria-labelledby='${id}']`;

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "usage-meter", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: text in every tone and the legend keys reach their contrast", async ({ page }) => {
    await visitStates(page, "usage-meter", theme);
    await expectContrast(page, [
      { sel: ".cap-usage-item .cap-meter-label", what: "a usage name" },
      { sel: ".cap-usage-item .cap-meter-value", what: "an amount" },
      { sel: ".cap-usage-why", what: "the why line" },
      { sel: ".cap-usage-item[data-tone='ok'] .cap-usage-lead", what: "an on-track lead" },
      { sel: ".cap-usage-item[data-tone='warn'] .cap-usage-lead", what: "a warning lead" },
      { sel: ".cap-usage-item[data-tone='crit'] .cap-usage-lead", what: "a critical lead" },
      { sel: ".cap-usage-legend li", what: "the legend" },
      { sel: ".cap-usage-fresh[data-stale] > span:last-child", what: "a stale reading's line" },
      { sel: ".cap-usage-key", what: "a legend key's edge", part: "border" },
    ]);
  });

  test("accessibility: each bar is a named meter whose value text includes the projection", async ({ page }) => {
    await visitStates(page, "usage-meter", theme);
    const onTrack = page.locator(section("s-on-track")).locator("[data-cap='usage-meter']");
    await expect(onTrack.getByRole("meter", { name: "Worker requests" })).toHaveCount(1);
    await expect(onTrack.getByRole("paragraph").filter({ hasText: "On track" })).toHaveCount(1);
    await expect(onTrack.getByRole("list", { name: "Key" }).getByRole("listitem")).toHaveText([/Solid:\s*used/, /Hatched:\s*where the day ends at the current rate/]);
    const meter = page.getByRole("meter", { name: "D1 rows read" });
    await expect(meter).toHaveAttribute("aria-valuenow", "3700000");
    await expect(meter).toHaveAttribute("aria-valuetext", /projected to run out in about 6 hours, before the reset/);
    await expect(page.getByRole("meter", { name: "D1 rows written" })).toHaveAttribute("aria-valuetext", /no projection yet/);
  });

  test("accessibility: a warning or critical row says so in words beside its colour", async ({ page }) => {
    await visitStates(page, "usage-meter", theme);
    await expect(page.locator(section("s-runs-out")).locator(".cap-status")).toHaveText("Runs out before the reset");
    await expect(page.locator(section("s-nearly-out")).locator(".cap-status")).toHaveText("Nearly out");
    await expect(page.locator(section("s-stale")).locator(".cap-usage-fresh .cap-status")).toHaveText("Stale");
  });

  test("keyboard: the meters are not controls and take no tab stop", async ({ page }) => {
    await visitStates(page, "usage-meter", theme);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      const onBar = await page.evaluate(() => !!document.activeElement?.closest(".cap-usage"));
      expect(onBar).toBe(false);
    }
  });

  test("behaviour: the bars are drawn by the shared meter from their values, the projection never shorter than the use", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "usage-meter", theme);
    const read = (id: string) =>
      page.locator(section(id)).locator(".cap-meter-bar").first().evaluate((el) => {
        const cs = getComputedStyle(el);
        const fill = getComputedStyle(el.querySelector(".cap-meter-fill")!);
        return {
          used: Number(cs.getPropertyValue("--cap-meter-ratio")),
          projected: cs.getPropertyValue("--cap-meter-projected").trim(),
          drawn: new DOMMatrixReadOnly(fill.transform).a,
        };
      });
    const onTrack = await read("s-on-track");
    expect(onTrack.used).toBeCloseTo(0.614, 3);
    expect(Number(onTrack.projected)).toBeCloseTo(0.86682, 4);
    expect(onTrack.drawn).toBeCloseTo(0.614, 3);
    const nearly = await read("s-nearly-out");
    expect(nearly.used).toBeCloseTo(0.962, 3);
    expect(Number(nearly.projected)).toBe(1);
    const none = await read("s-no-projection");
    expect(none.used).toBeCloseTo(0.182, 3);
    expect(none.projected).toBe("");
  });

  test("behaviour: every row is the shared meter and draws no bar of its own", async ({ page }) => {
    await visitStates(page, "usage-meter", theme);
    const rows = page.locator(".cap-usage-item");
    expect(await rows.count()).toBeGreaterThan(3);
    for (const row of await rows.all()) {
      await expect(row).toHaveClass(/\bcap-meter\b/);
      await expect(row.locator(".cap-meter-bar[role='meter']")).toHaveCount(1);
    }
    await expect(page.locator(".cap-usage-bar, .cap-usage-used, .cap-usage-projected")).toHaveCount(0);
  });

  test("accessibility: the rows' roles and names, the why line outside the meter role", async ({ page }) => {
    await visitStates(page, "usage-meter", theme);
    await expect(page.locator(section("s-runs-out"))).toMatchAriaSnapshot(`
      - meter "D1 rows read"
    `);
    // The why line is read as text beside the meter, not swallowed by its role.
    const why = page.locator(section("s-runs-out")).locator(".cap-usage-why");
    expect(await why.evaluate((el) => !el.closest("[role='meter']"))).toBe(true);
  });

  test("behaviour: each specimen's why line is the one assess() writes", async ({ page }) => {
    await visitStates(page, "usage-meter", theme);
    const cases: Array<[string, Parameters<typeof assess>[0]]> = [
      ["s-on-track", { used: 61_400, limit: 100_000, history: WEEK, resetsAt: RESET, now: NOW }],
      ["s-runs-out", { used: 3_700_000, limit: 5_000_000, history: WEEK, resetsAt: RESET, now: NOW, atLimit: "reads fail" }],
      ["s-nearly-out", { used: 962, limit: 1_000, history: WEEK, resetsAt: RESET, now: NOW, unit: "writes", atLimit: "the watcher cannot save its pass" }],
      ["s-no-projection", { used: 18_200, limit: 100_000, history: [9_000, 11_000], resetsAt: RESET, now: NOW }],
    ];
    for (const [id, input] of cases) {
      const a = assess(input);
      const item = page.locator(section(id)).locator(".cap-usage-item");
      await expect(item.locator(".cap-usage-why")).toHaveText(a.text);
      await expect(item.locator(".cap-usage-lead")).toHaveText(a.lead);
      await expect(item).toHaveAttribute("data-tone", a.tone);
    }
  });
});

// assess() is pure: these run in Node, once.
test.describe("assess()", () => {
  test("behaviour: on track projects the day at today's rate", () => {
    const a = assess({ used: 61_400, limit: 100_000, history: WEEK, resetsAt: RESET, now: NOW });
    expect(a.tone).toBe("ok");
    expect(a.percent).toBe(61);
    expect(Math.round(a.projectedAtReset ?? 0)).toBe(86_682);
    expect(a.fullAt).toBeNull();
    expect(a.text).toBe("On track: about 87% by the reset at 00:00 UTC, in 7 hours.");
    expect(a.projection).toBe("projected 87 percent by the reset");
  });

  test("behaviour: a projection that ends before the reset warns below 75%", () => {
    const a = assess({ used: 3_700_000, limit: 5_000_000, history: WEEK, resetsAt: RESET, now: NOW, atLimit: "reads fail" });
    expect(a.percent).toBe(74);
    expect(a.tone).toBe("warn");
    expect(a.label).toBe("Runs out before the reset");
    expect(a.fullAt).not.toBeNull();
    expect(a.fullAt ?? 0).toBeLessThan(RESET);
    expect(a.text).toBe("Full in about 6 hours, 1 hour before the reset. At the limit, reads fail until 00:00 UTC.");
    expect(a.lead).toBe("Full in about 6 hours");
  });

  test("behaviour: 75% used warns even when the day ends under the limit", () => {
    const a = assess({ used: 75, limit: 100, history: WEEK, resetsAt: RESET, now: RESET - 3_600_000 });
    expect(a.tone).toBe("warn");
    expect(a.fullAt).toBeNull();
    expect(a.text).toBe("75% used: about 78% by the reset at 00:00 UTC, in 1 hour.");
  });

  test("behaviour: 90% used is critical and says what is left", () => {
    const a = assess({ used: 962, limit: 1_000, history: WEEK, resetsAt: RESET, now: NOW, unit: "writes", atLimit: "the watcher cannot save its pass" });
    expect(a.tone).toBe("crit");
    expect(a.label).toBe("Nearly out");
    expect(a.text).toBe("38 writes left. Full in about 40 minutes. At the limit, the watcher cannot save its pass until 00:00 UTC.");
  });

  test("behaviour: no projection until 7 days of history", () => {
    const six = assess({ used: 18_200, limit: 100_000, history: WEEK.slice(0, 6), resetsAt: RESET, now: NOW });
    expect(six.projectedAtReset).toBeNull();
    expect(six.fullAt).toBeNull();
    expect(six.tone).toBe("ok");
    expect(six.text).toBe("No projection: 6 days of history, 7 needed.");
    expect(six.projection).toBe("no projection yet");
    const one = assess({ used: 80, limit: 100, history: [70], resetsAt: RESET, now: NOW });
    expect(one.tone).toBe("warn");
    expect(one.text).toBe("No projection: 1 day of history, 7 needed.");
    expect(assess({ used: 18_200, limit: 100_000, history: WEEK, resetsAt: RESET, now: NOW }).projectedAtReset).not.toBeNull();
  });

  test("behaviour: at the limit is critical, with what happens", () => {
    const a = assess({ used: 1_000, limit: 1_000, history: WEEK, resetsAt: RESET, now: NOW, atLimit: "writes fail" });
    expect(a.tone).toBe("crit");
    expect(a.text).toBe("At the limit: writes fail until 00:00 UTC.");
    expect(a.projection).toBe("at the limit");
  });

  test("behaviour: a total that does not reset has no projection", () => {
    const a = assess({ used: 1.2, limit: 10, history: [1.1, 1.2], resetsAt: null, now: NOW });
    expect(a.projectedAtReset).toBeNull();
    expect(a.text).toBe("No projection: 2 days of history, 7 needed. This total does not reset.");
  });

  test("behaviour: the first hour of a day uses the week's typical rate", () => {
    const start = RESET - 24 * 3_600_000;
    const a = assess({ used: 100, limit: 100_000, history: WEEK, resetsAt: RESET, now: start + 30 * 60_000 });
    const typicalPerMs = WEEK.reduce((x, y) => x + y, 0) / 7 / (24 * 3_600_000);
    expect(Math.round(a.projectedAtReset ?? 0)).toBe(Math.round(100 + typicalPerMs * (RESET - (start + 30 * 60_000))));
  });

  test("behaviour: durations and widths read as a person would say them", () => {
    expect(duration(40 * 60_000)).toBe("40 minutes");
    expect(duration(60 * 60_000)).toBe("1 hour");
    expect(duration(3 * 24 * 3_600_000)).toBe("3 days");
    expect(duration(10_000)).toBe("less than a minute");
    expect(widths(50, 100, 140)).toEqual({ used: 50, projected: 100 });
    expect(widths(50, 100, null)).toEqual({ used: 50, projected: 50 });
  });
});
