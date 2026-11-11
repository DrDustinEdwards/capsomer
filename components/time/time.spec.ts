import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";
import {
  DAY,
  HOUR,
  MIN,
  SEC,
  UNREADABLE,
  dateRange,
  duration,
  exact,
  exactParts,
  formatDate,
  fromUtcInputValue,
  parse,
  relative,
  serverNow,
  span,
  text,
  timecode,
  toMs,
  until,
  utc,
  utcInputValue,
} from "./time.ts";

// Times depend on the viewer's zone: check them in one, with summer time in force.
test.use({ timezoneId: "Europe/London", locale: "en-GB" });

const NOW = Date.parse("2026-09-30T14:00:00Z");
const LONDON = "Europe/London";

test("behavior: relative times are spelled out, never abbreviated", () => {
  expect(relative(NOW - 3_000, NOW, LONDON)).toBe("just now");
  expect(relative(NOW - 30_000, NOW, LONDON)).toBe("less than a minute ago");
  expect(relative(NOW - MIN, NOW, LONDON)).toBe("1 minute ago");
  expect(relative(NOW - 5 * MIN, NOW, LONDON)).toBe("5 minutes ago");
  expect(relative(NOW - 3 * HOUR - 20 * MIN, NOW, LONDON)).toBe("3 hours ago");
  expect(relative(Date.parse("2026-09-29T09:00:00Z"), NOW, LONDON)).toBe("yesterday");
  expect(relative(NOW - 4 * DAY, NOW, LONDON)).toBe("4 days ago");
  expect(relative(Date.parse("2026-09-12T08:30:00Z"), NOW, LONDON)).toBe("September 12");
  expect(relative(Date.parse("2025-12-02T08:30:00Z"), NOW, LONDON)).toBe("December 2, 2025");
  expect(relative(NOW + 3 * HOUR, NOW, LONDON)).toBe("in 3 hours");
  expect(relative(NOW + 30_000, NOW, LONDON)).toBe("in less than a minute");
  expect(relative(Date.parse("2026-10-01T09:00:00Z"), NOW, LONDON)).toBe("in 19 hours");
  expect(relative(Date.parse("2026-10-01T16:00:00Z"), NOW, LONDON)).toBe("tomorrow");
  for (const t of [NOW - 5 * MIN, NOW - 3 * HOUR, NOW - 2 * DAY])
    expect(relative(t, NOW, LONDON)).not.toMatch(/\d[smhd]\b/);
});

test("behavior: exact times give the viewer's zone and UTC", () => {
  const t = Date.parse("2026-09-30T13:02:00Z");
  expect(exact(t, LONDON)).toBe("September 30, 2026, 2:02 PM BST (1:02 PM UTC)");
  expect(exact(t, "UTC")).toBe("September 30, 2026, 1:02 PM UTC");
  // UTC's date is given when it is a different day from the viewer's.
  expect(exact(Date.parse("2026-09-30T20:30:00Z"), "Australia/Sydney")).toMatch(
    /^October 1, 2026, 6:30 AM .+ \(September 30, 2026, 8:30 PM UTC\)$/,
  );
  // An American zone has its American name, not "GMT-6"; a zone with none in either has its offset.
  expect(exact(Date.parse("2026-11-03T14:00:00Z"), "America/Chicago")).toBe(
    "November 3, 2026, 8:00 AM CST (2:00 PM UTC)",
  );
  expect(exact(Date.parse("2026-10-29T10:37:00Z"), "America/Chicago")).toBe(
    "October 29, 2026, 5:37 AM CDT (10:37 AM UTC)",
  );
  expect(exact(Date.parse("2026-11-03T14:00:00Z"), "Asia/Tokyo")).toBe(
    "November 3, 2026, 11:00 PM GMT+9 (2:00 PM UTC)",
  );
});

test("behavior: the Portal's UTC form and its zoneless server timestamps are kept", () => {
  expect(utc(Date.parse("2026-09-30T13:02:41Z"))).toBe("2026-09-30 13:02Z");
  expect(parse("2026-09-28 11:00:00")).toBe(Date.parse("2026-09-28T11:00:00Z"));
  expect(parse("2026-09-28T11:00:00+01:00")).toBe(Date.parse("2026-09-28T10:00:00Z"));
});

test("behavior: the UTC part of an exact time is its own part, absent for a viewer in UTC", () => {
  const t = Date.parse("2026-09-30T13:02:00Z");
  expect(exactParts(t, LONDON)).toEqual({
    local: "September 30, 2026, 2:02 PM BST",
    utc: "(1:02 PM UTC)",
  });
  expect(exactParts(t, "UTC")).toEqual({ local: "September 30, 2026, 1:02 PM UTC", utc: null });
});

test("behavior: a time that cannot be read says so in words, not blank or NaN", () => {
  expect(text(Number.NaN, "exact")).toBe(UNREADABLE);
  expect(text(Number.NaN, "relative")).toBe(UNREADABLE);
  expect(exact(parse("garbage"), LONDON)).toBe("an unreadable time");
});

test.describe("React, rendered on a server", () => {
  test.use({ timezoneId: "America/Chicago" });

  test("behavior: an exact Time hydrates with no error, then shows the viewer's zone", async ({
    page,
  }) => {
    await visitStates(page, "time", "light");
    const t = page.locator("#time-hydrate time.cap-time");
    // The server cannot know the zone: it sends UTC, with no UTC part, and the browser's first
    // render matches it, so React reports no hydration error (#418).
    expect(
      await page.evaluate(
        () => (window as unknown as { timeHydration: { server: string } }).timeHydration.server,
      ),
    ).toBe("Went live October 2, 2026, 9:12 AM UTC");
    await expect(t).toHaveText("October 2, 2026, 4:12 AM CDT (9:12 AM UTC)");
    await expect(t.locator(".cap-time-utc")).toHaveText("(9:12 AM UTC)");
    expect(
      await page.evaluate(
        () => (window as unknown as { timeHydration: { errors: string[] } }).timeHydration.errors,
      ),
    ).toEqual([]);
  });
});

test("behavior: dates are long and in UTC, whatever the viewer's zone, and an unreadable one is null", () => {
  // 11:30 PM on the 12th in UTC is the 13th in Tokyo: the date stays the 12th.
  expect(formatDate("2026-09-12T23:30:00Z")).toBe("September 12, 2026");
  expect(formatDate("2026-09-12T23:30:00Z", { zone: "Asia/Tokyo" })).toBe("September 13, 2026");
  expect(formatDate("2026-09-12T15:04:00Z", { style: "medium", time: true, zoneName: true })).toBe(
    "Sep 12, 2026, 3:04 PM UTC",
  );
  expect(formatDate(NOW, { style: "monthDay" })).toBe("Sep 30");
  expect(formatDate("2026-09-12T15:04:00Z", { style: "weekday" })).toBe("Saturday, September 12");
  expect(formatDate("2026-09-12T15:04:00Z", { style: "time", zoneName: true })).toBe("3:04 PM UTC");
  expect(formatDate(null)).toBeNull();
  expect(formatDate("not a date")).toBeNull();
  expect(text(NOW, "date")).toBe("September 30, 2026");
  expect(dateRange("2026-05-01", "2026-05-02")).toBe("May 1, 2026 to May 2, 2026");
  expect(dateRange("2026-05-01", "2026-05-01")).toBe("May 1, 2026");
  expect(dateRange(null, "2026-05-02")).toBe("May 2, 2026");
  expect(dateRange(null, null)).toBeNull();
  expect(toMs(null)).toBeNaN();
  expect(utcInputValue(NOW)).toBe("2026-09-30T14:00");
  expect(fromUtcInputValue("2026-09-30T14:00")).toBe(NOW);
  expect(fromUtcInputValue("tomorrow")).toBeNaN();
});

test("behavior: durations are a timecode, or words a screen reader can say", () => {
  expect(timecode(245 * SEC)).toBe("4:05");
  expect(timecode(3723 * SEC)).toBe("1:02:03");
  expect(timecode(245 * SEC, { hours: "always" })).toBe("00:04:05");
  expect(timecode(-5)).toBe("0:00");
  expect(timecode(Number.NaN)).toBe("0:00");
  expect(duration(192 * SEC)).toBe("3 minutes, 12 seconds");
  expect(duration(3723 * SEC)).toBe("1 hour, 2 minutes, 3 seconds");
  expect(duration(HOUR)).toBe("1 hour");
  expect(duration(0)).toBe("0 seconds");
  expect(duration(90 * SEC, { style: "short" })).toBe("1 min, 30 sec");
  expect(duration(3723 * SEC, { style: "narrow" })).toBe("1h 2m 3s");
  expect(duration(2 * DAY + 3 * HOUR, { largest: "days" })).toBe("2 days, 3 hours");
  // A rough span, rounded down, spelled out: the words of "waiting 3.2h".
  expect(span(30 * SEC)).toBe("less than a minute");
  expect(span(5 * MIN + 4 * SEC)).toBe("5 minutes");
  expect(span(3.2 * HOUR)).toBe("3 hours");
  expect(span(2.1 * DAY)).toBe("2 days");
});

test("behavior: relative times ahead, by day, and how soon a scheduled step fires", () => {
  expect(relative(NOW + 3 * HOUR, NOW, LONDON)).toBe("in 3 hours");
  expect(relative(NOW + 20 * SEC, NOW, LONDON)).toBe("in less than a minute");
  expect(relative(NOW, NOW, LONDON, { granularity: "day" })).toBe("today");
  expect(relative(NOW - DAY, NOW, LONDON, { granularity: "day" })).toBe("yesterday");
  expect(relative(NOW - 12 * DAY, NOW, LONDON, { granularity: "day" })).toBe("12 days ago");
  expect(relative(NOW - 70 * DAY, NOW, LONDON, { granularity: "day" })).toBe("2 months ago");
  expect(until(NOW - 1, NOW)).toBe("due now");
  expect(until(NOW + 5 * MIN, NOW)).toBe("in 5 minutes");
  expect(until(NOW + 3 * HOUR + 20 * MIN, NOW)).toBe("in 3 hours, 20 minutes");
  // Rounding the minutes up to 60 carries into the hour.
  expect(until(NOW + 3 * HOUR + 59 * MIN + 40 * SEC, NOW)).toBe("in 4 hours");
  expect(until(NOW + 2 * DAY + 5 * HOUR, NOW)).toBe("in 2 days");
});

test("behavior: the server's now is the browser's moved by the skew, and never before the newest server read", () => {
  expect(serverNow(1_000_000, 5_000, 0)).toBe(1_005_000);
  // A row written after the page's last tick, on a server clock ahead of the browser's.
  expect(serverNow(1_000_000, 0, 1_016_000)).toBe(1_016_000);
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "time", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: times reach their contrast", async ({ page }) => {
    await visitStates(page, "time", theme);
    await expectContrast(page, [
      { sel: "#sample-rows .cap-time", what: "a relative time" },
      { sel: "#sample-exact .cap-time", what: "an exact time" },
      { sel: "#sample-exact .cap-time-utc", what: "the UTC part of an exact time" },
      { sel: "#sample-text-tone", what: "a relative time in the text color" },
      { sel: "#sample-live .cap-time", what: "a live relative time" },
    ]);
  });

  test("accessibility: rows read as words", { tag: "@markup" }, async ({ page }) => {
    await visitStates(page, "time", theme);
    await expect(page.locator("#sample-rows")).toHaveAccessibleName("Deploys");
    await expect(page.locator("#sample-rows > li")).toHaveText([
      /example\.com deployed\s+less than a minute ago/,
      /docs\.example\.com deployed\s+5 minutes ago/,
      /capsid deployed\s+3 hours ago/,
      /example\.org deployed\s+yesterday/,
      /example\.net deployed\s+September 12/,
      /The next uptime pass runs in\s+3 hours/,
      /Last edited\s+5 minutes ago/,
    ]);
  });

  test("behavior: the exact time, with its zone, is shown without hover and with no title", async ({
    page,
  }) => {
    await visitStates(page, "time", theme);
    const t = page.locator("#sample-exact time.cap-time");
    await expect(t).toBeVisible();
    await expect(t).toHaveText("September 30, 2026, 2:02 PM BST (1:02 PM UTC)");
    await expect(page.locator(".cap-time[title]")).toHaveCount(0);
    // Every real time carries its machine value; the unreadable one is a plain span.
    for (const el of await page.locator("time.cap-time").all())
      await expect(el).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}(T|$)/);
  });

  test("behavior: the UTC part of an exact time stays whole on a line, and an unreadable time is words", async ({
    page,
  }) => {
    await visitStates(page, "time", theme);
    await expect(page.locator("#sample-exact .cap-time-utc")).toHaveText("(1:02 PM UTC)");
    await expect(page.locator("#sample-exact .cap-time-utc")).toHaveCSS("white-space", "nowrap");
    await expect(page.locator("#sample-unreadable")).toHaveText("an unreadable time");
    await expect(page.locator("#sample-unreadable")).not.toHaveAttribute("datetime", /.*/);
  });

  test("behavior: a time with its tip shows the exact time on focus, and a missing time says its words", async ({
    page,
  }) => {
    await visitStates(page, "time", theme);
    const tip = page.locator("#sample-tip");
    await expect(tip.locator("time.cap-time")).toHaveText("5 minutes ago");
    await tip.locator(".cap-time-tip").focus();
    const exactTip = tip.getByRole("tooltip");
    await expect(exactTip).toBeVisible();
    await expect(exactTip).toHaveText("September 30, 2026, 2:55 PM BST (1:55 PM UTC)");
    // Spans only, so the tip is valid inside a paragraph.
    await expect(tip.locator("div")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(exactTip).toBeHidden();
    await expect(page.locator("#sample-empty .cap-time")).toHaveText("never");
    await expect(page.locator("#sample-empty time")).toHaveCount(0);
  });

  test("behavior: durations and long dates are written in words, and a date is a <time> with its day", async ({
    page,
  }) => {
    await visitStates(page, "time", theme);
    await expect(page.locator("#sample-durations")).toContainText(
      "1:02:03, 1 hour, 2 minutes, 3 seconds",
    );
    await expect(page.locator("#sample-durations")).toContainText("00:04:05");
    await expect(page.locator("#sample-durations")).toContainText("in 3 hours, 20 minutes");
    await expect(page.locator("#sample-date time").first()).toHaveText("September 12, 2026");
    await expect(page.locator("#sample-date time").first()).toHaveAttribute(
      "datetime",
      "2026-09-12",
    );
    await expectContrast(page, [{ sel: "#sample-date .cap-time", what: "a long date" }]);
  });

  test("behavior: relative times redraw every 30 seconds", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-09-30T14:00:00Z") });
    await visitStates(page, "time", theme);
    const live = page.locator("#sample-live .cap-time");
    await expect(live).toHaveText("1 minute ago");
    await page.clock.fastForward(61_000);
    await expect(live).toHaveText("2 minutes ago");
  });
});
