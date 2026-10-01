import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: every kind's words reach their contrast", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await expectContrast(page, [
      { sel: "#sample-nothing .cap-empty-title", what: "nothing yet title" },
      { sel: "#sample-nothing .cap-empty-text", what: "nothing yet text" },
      { sel: "#sample-nomatch .cap-empty-text", what: "no match text" },
      { sel: "#sample-clear .cap-status", what: "all clear status" },
      { sel: "#sample-clear .cap-empty-text", what: "all clear text" },
      { sel: "#sample-failed .cap-empty-title", what: "failed title" },
      { sel: "#sample-failed .cap-empty-text", what: "failed text" },
      { sel: "#sample-spinner .cap-spinner-label", what: "spinner word" },
      { sel: "#sample-wait .cap-empty-text", what: "how long it takes" },
    ]);
  });

  test("accessibility: the kinds' roles and names", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await expect(page.locator("#sample-nomatch")).toMatchAriaSnapshot(`
      - paragraph: No jobs match “Blocked”
      - paragraph: 14 jobs are hidden by this filter.
      - button "Clear filter"
    `);
    await expect(page.locator("#sample-failed")).toMatchAriaSnapshot(`
      - alert:
        - paragraph: Could not load the queue
        - paragraph: The server answered with an error (502). Nothing changed on your side.
        - button "Try again"
    `);
  });

  test("accessibility: a skeleton is busy and says Loading to a screen reader", async ({ page }) => {
    await visitStates(page, "empty", theme);
    const skel = page.locator("#sample-skeleton");
    await expect(skel).toHaveAttribute("aria-busy", "true");
    await expect(skel.locator(".cap-sr-only")).toHaveText("Loading");
    const hidden = await skel.locator(".cap-skeleton-line").evaluateAll((ls) => ls.every((l) => l.getAttribute("aria-hidden") === "true"));
    expect(hidden).toBe(true);
  });

  test("keyboard: each kind's one action is reachable with Tab", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await page.getByRole("button", { name: "Add a site" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Clear filter" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Try again" })).toBeFocused();
    await expect(page.locator("#sample-clear").getByRole("button")).toHaveCount(0);
  });

  test("behaviour: the skeleton pulses and the spinner turns when motion is welcome", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await visitStates(page, "empty", theme);
    await expect(page.locator("#sample-skeleton .cap-skeleton-line").first()).toHaveCSS("animation-name", "cap-skeleton-pulse");
    await expect(page.locator("#sample-spinner .cap-spinner-arc")).toHaveCSS("animation-name", "cap-spinner-turn");
    await expect(page.locator("#sample-spinner .cap-spinner-arc")).toBeVisible();
  });

  test("behaviour: under reduced motion nothing moves, and the word Loading shows alone", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "empty", theme);
    await expect(page.locator("#sample-skeleton .cap-skeleton-line").first()).toHaveCSS("animation-name", "none");
    await expect(page.locator("#sample-spinner .cap-spinner-arc")).toBeHidden();
    await expect(page.locator("#sample-spinner .cap-spinner-label")).toBeVisible();
    await expect(page.locator("#sample-spinner")).toHaveText("Loading");
  });
});
