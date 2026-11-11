import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "schedule", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the times, track names and day links reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "schedule", theme);
    await expectContrast(page, [
      { sel: ".cap-schedule-zone", what: "the zone line" },
      { sel: ".cap-schedule-time", what: "a slot's time" },
      { sel: ".cap-schedule-count", what: "the parallel tracks count" },
      { sel: ".cap-schedule-track-name", what: "a track's name" },
      { sel: ".cap-schedule-session-meta", what: "a session's facts" },
      { sel: ".cap-schedule-day-link:not([aria-current])", what: "a day link" },
      { sel: ".cap-schedule-day-link[aria-current]", what: "the current day" },
    ]);
  });

  test("accessibility: a slot reads as its time, then its named tracks", async ({ page }) => {
    await visitStates(page, "schedule", theme);
    const slot = page.locator("#s-program ~ * .cap-schedule-slot[data-parallel]").first();
    await expect(slot).toMatchAriaSnapshot(`
      - listitem:
        - heading "2:45 PM to 4:00 PM" [level=4]
        - paragraph: 3 parallel tracks
        - list:
          - listitem:
            - paragraph: Room A
            - article:
              - heading "Field notes" [level=5]
              - paragraph: Chaired by Sam Lee
              - list:
                - listitem: Notes from the spring survey
                - listitem: What the logs showed
          - listitem:
            - paragraph: Room B
            - article:
              - heading "Release notes" [level=5]
              - paragraph: Chaired by Jordan Park
              - list:
                - listitem: Version 4 in practice
                - listitem: Moving off the old importer
          - listitem:
            - paragraph: Room C
            - article:
              - heading "Annual report" [level=5]
              - list:
                - listitem: The year in numbers
    `);
  });

  test("keyboard: Tab moves through the days, and Enter shows the focused day", async ({
    page,
  }) => {
    await visitStates(page, "schedule", theme);
    const nav = page.getByRole("navigation", { name: "Meeting days", exact: true });
    const current = nav.locator("[aria-current='page']");
    await expect(current).toHaveText("Friday, March 5");
    await current.focus();
    await page.keyboard.press("Tab");
    const saturday = nav.getByRole("link", { name: "Saturday, March 6" });
    await expect(saturday).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(saturday).toHaveAttribute("aria-current", "page");
    await expect(page.locator("#s-day ~ * .cap-schedule-session-title")).toHaveText([
      "Spring update",
    ]);
  });
});
