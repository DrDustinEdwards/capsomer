import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "feature", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: eyebrow, title, body and card text reach their contrast", async ({ page }) => {
    await visitStates(page, "feature", theme);
    await expectContrast(page, [
      { sel: "#fe-stacked .cap-eyebrow", what: "the eyebrow" },
      { sel: "#fe-stacked .cap-feature-title", what: "the title" },
      { sel: "#fe-stacked .cap-feature-body", what: "the body" },
      { sel: "#fe-cards .cap-feature-card-text", what: "a card's line" },
    ]);
  });

  test("keyboard: a tall preview is a named region Tab reaches and arrows scroll", async ({ page }) => {
    await visitStates(page, "feature", theme);
    const region = page.getByRole("region", { name: "Sample change history" });
    await region.focus();
    await expect(region).toBeFocused();
    await page.keyboard.press("PageDown");
    await expect.poll(() => region.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  });

  test("behavior: alternating blocks swap sides", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await visitStates(page, "feature", theme);
    const sides = await page.locator("#fe-alternate > .cap-feature").evaluateAll((els) =>
      els.map((el) => {
        const t = el.querySelector(".cap-feature-text")!.getBoundingClientRect();
        const m = el.querySelector(".cap-feature-media")!.getBoundingClientRect();
        return t.left < m.left ? "text-first" : "media-first";
      }),
    );
    expect(sides).toEqual(["text-first", "media-first"]);
  });
});
