import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "share-preview", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: every text tone reaches its contrast", async ({ page }) => {
    await visitStates(page, "share-preview", theme);
    await expectContrast(page, [
      { sel: "#sp-serp .cap-serp-url", what: "the result's address" },
      { sel: "#sp-serp .cap-serp-title", what: "the result's title" },
      { sel: "#sp-serp .cap-serp-description", what: "the result's description" },
      { sel: "#sp-serp-cut .cap-serp-note", what: "the result's note" },
      { sel: "#sp-og .cap-og-card-host", what: "the card's host" },
      { sel: "#sp-og .cap-og-card-title", what: "the card's title" },
      { sel: "#sp-og .cap-og-card-description", what: "the card's description" },
      { sel: "#sp-og-note .cap-og-card-note", what: "the card's note" },
    ]);
  });

  test("accessibility: roles and names: each preview is a named group, and nothing in it takes focus", async ({ page }) => {
    await visitStates(page, "share-preview", theme);
    await expect(page.getByRole("group", { name: "Search result preview" })).toHaveCount(2);
    await expect(page.getByRole("group", { name: "Social card preview" })).toHaveCount(2);
    await expect(page.getByRole("img", { name: "The post's cover: a rising line over a grid" })).toBeVisible();
    const focusable = await page.locator(".cap-serp, .cap-og-card").evaluateAll((els) => els.flatMap((el) => [...el.querySelectorAll("a, button, input, [tabindex]")]).length);
    expect(focusable).toBe(0);
  });

  test("behaviour: the card's image box keeps the 1200 x 630 shape, and the card stays inside a narrow space", async ({ page }) => {
    await visitStates(page, "share-preview", theme);
    const box = await page.locator("#sp-og-note .cap-og-card-image").evaluate((el) => {
      const r = el.getBoundingClientRect();
      const card = el.closest(".cap-og-card")!;
      return { ratio: r.width / r.height, fits: card.scrollWidth <= card.clientWidth };
    });
    expect(box.ratio).toBeCloseTo(1200 / 630, 1);
    expect(box.fits).toBe(true);
  });

  test("behaviour: a long title wraps inside the card and the result", async ({ page }) => {
    await visitStates(page, "share-preview", theme);
    for (const sel of ["#sp-serp-cut", "#sp-og-note"]) {
      const fits = await page.locator(sel).evaluate((el) => el.scrollWidth <= el.clientWidth);
      expect(fits, sel).toBe(true);
    }
  });
});
