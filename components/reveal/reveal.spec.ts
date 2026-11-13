import { expect, test } from "@playwright/test";
import { eachTheme, visitStates } from "../../test/helpers.ts";

const opacity = (page: import("@playwright/test").Page, sel: string) =>
  page.locator(sel).evaluate((el) => Number(getComputedStyle(el).opacity));

eachTheme((theme) => {
  test("behavior: a section below the window is faded, and fully shown once it has entered", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 420 });
    await visitStates(page, "reveal", theme, "page");
    expect(await opacity(page, "#rv-one")).toBeLessThan(0.2);
    await page
      .locator("#rv-one")
      .evaluate((el: HTMLElement) => scrollTo({ top: el.offsetTop - 100, behavior: "instant" }));
    await expect.poll(() => opacity(page, "#rv-one")).toBe(1);
  });

  test("behavior: with less motion asked for, nothing is ever hidden", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "reveal", theme, "page");
    expect(await opacity(page, "#rv-one")).toBe(1);
    expect(await opacity(page, "#rv-stack > p:first-of-type")).toBe(1);
  });
});
