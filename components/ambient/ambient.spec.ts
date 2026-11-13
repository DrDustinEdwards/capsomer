import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and every layer is hidden and inert", async ({
    page,
  }) => {
    await visitStates(page, "ambient", theme);
    await expectNoAxeViolations(page);
    for (const id of ["#am-hex .cap-ambient", "#am-blobs .cap-ambient", "#am-eq"]) {
      await expect(page.locator(id)).toHaveAttribute("aria-hidden", "true");
      await expect(page.locator(id)).toHaveCSS("pointer-events", "none");
    }
  });

  test("behavior: the module draws 24 hexagons at the size its random source gives", async ({
    page,
  }) => {
    await visitStates(page, "ambient", theme);
    const hexes = page.locator("#am-hex .cap-ambient > span");
    await expect(hexes).toHaveCount(24);
    await expect(hexes.first()).toHaveCSS("width", "67px");
  });

  test("behavior: each equalizer bar takes its own height", async ({ page }) => {
    await visitStates(page, "ambient", theme);
    const heights = await page
      .locator("#am-eq > span")
      .evaluateAll((els) => new Set(els.map((e) => getComputedStyle(e).height)).size);
    expect(heights).toBeGreaterThan(10);
  });

  test("behavior: reduced motion holds every layer still", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "ambient", theme);
    const names = await page
      .locator(".cap-ambient > span")
      .evaluateAll((els) => [...new Set(els.map((e) => getComputedStyle(e).animationName))]);
    expect(names).toEqual(["none"]);
  });
});
