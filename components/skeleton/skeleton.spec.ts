import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "skeleton", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations, the centred page spinner", async ({ page }) => {
    await visitStates(page, "skeleton", theme, "page");
    await expectNoAxeViolations(page);
  });

  test("accessibility: the spinner's word and arc reach their contrast", async ({ page }) => {
    await visitStates(page, "skeleton", theme);
    await expectContrast(page, [
      { sel: "#sample-spinner .cap-spinner-label", what: "spinner word" },
      { sel: "#sample-spinner .cap-spinner-arc", what: "spinner arc", min: 3 },
      { sel: "#sample-sizes .cap-spinner-label", what: "small spinner word" },
      { sel: "#sample-comfortable .cap-spinner-label", what: "comfortable spinner word" },
    ]);
  });

  test("accessibility: a skeleton is busy and says Loading to a screen reader", async ({ page }) => {
    await visitStates(page, "skeleton", theme);
    const skel = page.locator("#sample-skeleton");
    await expect(skel).toHaveAttribute("aria-busy", "true");
    await expect(skel.locator(".cap-sr-only")).toHaveText("Loading");
    const hidden = await skel.locator(".cap-skeleton-line").evaluateAll((ls) => ls.every((l) => l.getAttribute("aria-hidden") === "true"));
    expect(hidden).toBe(true);
    const shapes = await page.locator("#sample-shapes [class*='cap-skeleton-block']").evaluateAll((els) => els.every((e) => e.closest("[aria-hidden='true']") !== null));
    expect(shapes).toBe(true);
    await expect(page.locator("#sample-shapes .cap-sr-only")).toHaveText("Loading the mention");
  });

  test("accessibility: the spinner has a name, in words, even when the word is hidden", async ({ page }) => {
    await visitStates(page, "skeleton", theme);
    await expect(page.locator("#sample-spinner")).toHaveText("Loading");
    await expect(page.locator("#sample-hidden-label .cap-spinner-label")).toHaveText("Refreshing the queue");
    await expect(page.getByRole("button", { name: "Saving" }).first()).toBeVisible();
  });

  test("accessibility: the page spinner is a status region with its word", async ({ page }) => {
    await visitStates(page, "skeleton", theme, "page");
    await expect(page.getByRole("status")).toHaveText("Loading the Portal");
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "true");
    await expectContrast(page, [{ sel: "#sample-page .cap-spinner-label", what: "page spinner word" }]);
  });

  test("behaviour: the page spinner is centred in the space it is given", async ({ page }) => {
    await visitStates(page, "skeleton", theme, "page");
    const spinner = page.locator("#sample-page");
    const arc = spinner.locator(".cap-spinner-arc");
    await expect(spinner).toHaveCSS("flex-direction", "column");
    const [s, a, w] = await Promise.all([spinner.boundingBox(), arc.boundingBox(), page.evaluate(() => document.documentElement.clientWidth)]);
    expect(s && a).toBeTruthy();
    expect(Math.abs(a!.x + a!.width / 2 - w / 2)).toBeLessThan(2);
  });

  test("behaviour: the skeleton pulses and the spinner turns when motion is welcome", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await visitStates(page, "skeleton", theme);
    await expect(page.locator("#sample-skeleton .cap-skeleton-line").first()).toHaveCSS("animation-name", "cap-skeleton-pulse");
    await expect(page.locator("#sample-shapes .cap-skeleton-block").first()).toHaveCSS("animation-name", "cap-skeleton-pulse");
    await expect(page.locator("#sample-spinner .cap-spinner-arc")).toHaveCSS("animation-name", "cap-spinner-turn");
    await expect(page.locator("#sample-spinner .cap-spinner-arc")).toBeVisible();
  });

  test("behaviour: under reduced motion nothing moves, and the word Loading shows alone", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "skeleton", theme);
    await expect(page.locator("#sample-skeleton .cap-skeleton-line").first()).toHaveCSS("animation-name", "none");
    await expect(page.locator("#sample-shapes .cap-skeleton-block").first()).toHaveCSS("animation-name", "none");
    await expect(page.locator("#sample-spinner .cap-spinner-arc")).toBeHidden();
    await expect(page.locator("#sample-spinner .cap-spinner-label")).toBeVisible();
    await expect(page.locator("#sample-spinner")).toHaveText("Loading");
    await expect(page.locator("#sample-hidden-label .cap-spinner-label")).toBeVisible();
  });
});
