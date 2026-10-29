import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { DAY, HOUR, MIN, UNREADABLE, exact, exactParts, parse, relative, serverNow, text, utc } from "./time.ts";

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
  for (const t of [NOW - 5 * MIN, NOW - 3 * HOUR, NOW - 2 * DAY]) expect(relative(t, NOW, LONDON)).not.toMatch(/\d[smhd]\b/);
});

test("behavior: exact times give the viewer's zone and UTC", () => {
  const t = Date.parse("2026-09-30T13:02:00Z");
  expect(exact(t, LONDON)).toBe("September 30, 2026, 14:02 BST (13:02 UTC)");
  expect(exact(t, "UTC")).toBe("September 30, 2026, 13:02 UTC");
  // UTC's date is given when it is a different day from the viewer's.
  expect(exact(Date.parse("2026-09-30T20:30:00Z"), "Australia/Sydney")).toMatch(/^October 1, 2026, 06:30 .+ \(September 30, 2026, 20:30 UTC\)$/);
  // An American zone has its American name, not "GMT-6"; a zone with none in either has its offset.
  expect(exact(Date.parse("2026-11-03T14:00:00Z"), "America/Chicago")).toBe("November 3, 2026, 08:00 CST (14:00 UTC)");
  expect(exact(Date.parse("2026-10-29T10:37:00Z"), "America/Chicago")).toBe("October 29, 2026, 05:37 CDT (10:37 UTC)");
  expect(exact(Date.parse("2026-11-03T14:00:00Z"), "Asia/Tokyo")).toBe("November 3, 2026, 23:00 GMT+9 (14:00 UTC)");
});

test("behavior: the Portal's UTC form and its zoneless server timestamps are kept", () => {
  expect(utc(Date.parse("2026-09-30T13:02:41Z"))).toBe("2026-09-30 13:02Z");
  expect(parse("2026-09-28 11:00:00")).toBe(Date.parse("2026-09-28T11:00:00Z"));
  expect(parse("2026-09-28T11:00:00+01:00")).toBe(Date.parse("2026-09-28T10:00:00Z"));
});

test("behavior: the UTC part of an exact time is its own part, absent for a viewer in UTC", () => {
  const t = Date.parse("2026-09-30T13:02:00Z");
  expect(exactParts(t, LONDON)).toEqual({ local: "September 30, 2026, 14:02 BST", utc: "(13:02 UTC)" });
  expect(exactParts(t, "UTC")).toEqual({ local: "September 30, 2026, 13:02 UTC", utc: null });
});

test("behavior: a time that cannot be read says so in words, not blank or NaN", () => {
  expect(text(Number.NaN, "exact")).toBe(UNREADABLE);
  expect(text(Number.NaN, "relative")).toBe(UNREADABLE);
  expect(exact(parse("garbage"), LONDON)).toBe("an unreadable time");
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
      /dustinedwards\.info deployed\s+less than a minute ago/,
      /carrel\.app deployed\s+5 minutes ago/,
      /capsid deployed\s+3 hours ago/,
      /foxhound\.app deployed\s+yesterday/,
      /recova deployed\s+September 12/,
      /The next uptime pass runs in\s+3 hours/,
      /Last edited\s+5 minutes ago/,
    ]);
  });

  test("behavior: the exact time, with its zone, is shown without hover and with no title", async ({ page }) => {
    await visitStates(page, "time", theme);
    const t = page.locator("#sample-exact time.cap-time");
    await expect(t).toBeVisible();
    await expect(t).toHaveText("September 30, 2026, 14:02 BST (13:02 UTC)");
    await expect(page.locator(".cap-time[title]")).toHaveCount(0);
    // Every real time carries its machine value; the unreadable one is a plain span.
    for (const el of await page.locator("time.cap-time").all()) await expect(el).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}T/);
  });

  test("behavior: the UTC part of an exact time stays whole on a line, and an unreadable time is words", async ({ page }) => {
    await visitStates(page, "time", theme);
    await expect(page.locator("#sample-exact .cap-time-utc")).toHaveText("(13:02 UTC)");
    await expect(page.locator("#sample-exact .cap-time-utc")).toHaveCSS("white-space", "nowrap");
    await expect(page.locator("#sample-unreadable")).toHaveText("an unreadable time");
    await expect(page.locator("#sample-unreadable")).not.toHaveAttribute("datetime", /.*/);
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
