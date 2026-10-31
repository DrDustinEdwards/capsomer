import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// The specimens are Prelum's own output (examples.html), so these check what the stylesheet adds:
// contrast in both themes, the heading link on focus, and nothing wider than a phone.
eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "prose-blocks", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the callout titles, bookmark, button and code title reach their contrast", async ({ page }) => {
    await visitStates(page, "prose-blocks", theme);
    await expectContrast(page, [
      ...["note", "tip", "important", "warning", "caution"].map((kind) => ({ sel: `.callout-${kind} .callout-title`, what: `the ${kind} title` })),
      { sel: ".bookmark-title", what: "the bookmark title" },
      { sel: ".bookmark-host", what: "the bookmark host" },
      { sel: ".button", what: "the button" },
      { sel: ".code-title", what: "the code title" },
      { sel: ".embed-link", what: "the embed card" },
    ]);
  });

  test("keyboard: a heading's own link shows when it takes focus", async ({ page }) => {
    await visitStates(page, "prose-blocks", theme);
    const anchor = page.locator("#pb-text .heading-anchor").first();
    await anchor.focus();
    await expect(anchor).toHaveCSS("opacity", "1");
  });

  test("accessibility: at 320 px wide nothing scrolls the page sideways", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await visitStates(page, "prose-blocks", theme);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "the page does not scroll sideways").toBeLessThanOrEqual(0);
  });
});
