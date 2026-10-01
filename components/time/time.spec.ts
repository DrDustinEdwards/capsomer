import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { DAY, HOUR, MIN, exact, parse, relative, utc } from "./time.ts";

// Times depend on the viewer's zone: check them in one, with summer time in force.
test.use({ timezoneId: "Europe/London", locale: "en-GB" });

const NOW = Date.parse("2026-09-30T14:00:00Z");
const LONDON = "Europe/London";

test("behaviour: relative times are spelled out, never abbreviated", () => {
  expect(relative(NOW - 3_000, NOW, LONDON)).toBe("just now");
  expect(relative(NOW - 30_000, NOW, LONDON)).toBe("less than a minute ago");
  expect(relative(NOW - MIN, NOW, LONDON)).toBe("1 minute ago");
  expect(relative(NOW - 5 * MIN, NOW, LONDON)).toBe("5 minutes ago");
  expect(relative(NOW - 3 * HOUR - 20 * MIN, NOW, LONDON)).toBe("3 hours ago");
  expect(relative(Date.parse("2026-09-29T09:00:00Z"), NOW, LONDON)).toBe("yesterday");
  expect(relative(NOW - 4 * DAY, NOW, LONDON)).toBe("4 days ago");
  expect(relative(Date.parse("2026-09-12T08:30:00Z"), NOW, LONDON)).toBe("12 September");
  expect(relative(Date.parse("2025-12-02T08:30:00Z"), NOW, LONDON)).toBe("2 December 2025");
  expect(relative(NOW + 3 * HOUR, NOW, LONDON)).toBe("in 3 hours");
  expect(relative(NOW + 30_000, NOW, LONDON)).toBe("in less than a minute");
  expect(relative(Date.parse("2026-10-01T09:00:00Z"), NOW, LONDON)).toBe("in 19 hours");
  expect(relative(Date.parse("2026-10-01T16:00:00Z"), NOW, LONDON)).toBe("tomorrow");
  for (const t of [NOW - 5 * MIN, NOW - 3 * HOUR, NOW - 2 * DAY]) expect(relative(t, NOW, LONDON)).not.toMatch(/\d[smhd]\b/);
});

test("behaviour: exact times give the viewer's zone and UTC", () => {
  const t = Date.parse("2026-09-30T13:02:00Z");
  expect(exact(t, LONDON)).toBe("30 September 2026, 14:02 BST (13:02 UTC)");
  expect(exact(t, "UTC")).toBe("30 September 2026, 13:02 UTC");
  // UTC's date is given when it is a different day from the viewer's.
  expect(exact(Date.parse("2026-09-30T20:30:00Z"), "Australia/Sydney")).toMatch(/^1 October 2026, 06:30 .+ \(30 September 2026, 20:30 UTC\)$/);
});

test("behaviour: the Portal's UTC form and its zoneless server timestamps are kept", () => {
  expect(utc(Date.parse("2026-09-30T13:02:41Z"))).toBe("2026-09-30 13:02Z");
  expect(parse("2026-09-28 11:00:00")).toBe(Date.parse("2026-09-28T11:00:00Z"));
  expect(parse("2026-09-28T11:00:00+01:00")).toBe(Date.parse("2026-09-28T10:00:00Z"));
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
    ]);
  });

  test("accessibility: rows read as words", async ({ page }) => {
    await visitStates(page, "time", theme);
    await expect(page.locator("#sample-rows")).toHaveAccessibleName("Deploys");
    await expect(page.locator("#sample-rows > li")).toHaveText([
      /dustinedwards\.info deployed\s+less than a minute ago/,
      /carrel\.app deployed\s+5 minutes ago/,
      /capsid deployed\s+3 hours ago/,
      /foxhound\.app deployed\s+yesterday/,
      /recova deployed\s+12 September/,
      /The next uptime pass runs in\s+3 hours/,
    ]);
  });

  test("behaviour: the exact time, with its zone, is shown without hover and with no title", async ({ page }) => {
    await visitStates(page, "time", theme);
    const t = page.locator("#sample-exact .cap-time");
    await expect(t).toBeVisible();
    await expect(t).toHaveText("30 September 2026, 14:02 BST (13:02 UTC)");
    await expect(page.locator(".cap-time[title]")).toHaveCount(0);
    for (const el of await page.locator(".cap-time").all()) await expect(el).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}T/);
  });

  test("behaviour: relative times redraw every 30 seconds", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-09-30T14:00:00Z") });
    await visitStates(page, "time", theme);
    const live = page.locator("#sample-live .cap-time");
    await expect(live).toHaveText("1 minute ago");
    await page.clock.fastForward(61_000);
    await expect(live).toHaveText("2 minutes ago");
  });
});
