import { expect, test } from "@playwright/test";
import { eachTheme, visitStates } from "../../test/helpers.ts";

// The bar's horizontal scale, from its computed transform matrix.
const scale = (page: import("@playwright/test").Page) =>
  page
    .locator(".cap-reading-progress")
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);

eachTheme((theme) => {
  test("behavior: the bar is empty at the article's top and full at its end, with no script", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 420 });
    await visitStates(page, "reading-progress", theme, "article");
    // Drawn (an empty bar has no width, so it is not "visible" yet).
    await expect(page.locator(".cap-reading-progress")).toHaveCSS("display", "block");
    expect(await scale(page)).toBeLessThan(0.05);
    await page.locator("#rp-article").evaluate((el) => {
      const end = el.getBoundingClientRect().bottom + scrollY - innerHeight;
      scrollTo({ top: end, behavior: "instant" });
    });
    await expect.poll(() => scale(page)).toBeGreaterThan(0.95);
    expect(await page.locator(".cap-reading-progress").getAttribute("aria-hidden")).toBe("true");
  });

  test("behavior: with less motion asked for there is no bar", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "reading-progress", theme, "article");
    await expect(page.locator(".cap-reading-progress")).toHaveCSS("display", "none");
  });
});
