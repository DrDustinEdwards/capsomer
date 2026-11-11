import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

// The specimens are Prelum's own output (examples.html), so these check what the stylesheet adds:
// contrast in both themes, the heading link on focus, and nothing wider than a phone.
eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "prose-blocks", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the callout titles, bookmark, button and code title reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "prose-blocks", theme);
    await expectContrast(page, [
      ...["note", "tip", "important", "warning", "caution"].map((kind) => ({
        sel: `.callout-${kind} .callout-title`,
        what: `the ${kind} title`,
      })),
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
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "the page does not scroll sideways").toBeLessThanOrEqual(0);
  });
  test("behavior: a site's tokens set its reading look", async ({ page }) => {
    await visitStates(page, "prose-blocks", theme);
    const look = page.locator("#pb-site-look");
    const color = (sel: string) =>
      look
        .locator(sel)
        .first()
        .evaluate((el) => getComputedStyle(el).color);
    const muted = await look.evaluate((el) => {
      const probe = document.createElement("span");
      probe.style.color = "var(--muted)";
      el.append(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    expect(await color("p")).toBe(muted);
    expect(await color("strong")).not.toBe(muted);
    await expect(look.locator("blockquote")).toHaveCSS("font-style", "italic");
    await expect(look.locator("h2")).toHaveCSS("font-weight", "600");
  });

  test("behavior: only a highlighted code block keeps room for its language and Copy", async ({
    page,
  }) => {
    await visitStates(page, "prose-blocks", theme);
    const top = (sel: string) =>
      page.locator(sel).evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
    expect(await top("#pb-pre-lang")).toBeGreaterThan(await top("#pb-pre-plain"));
    expect(await top("#pb-pre-enhanced")).toBe(await top("#pb-pre-lang"));
  });

  test("behavior: the details marker is drawn, a plus that turns to a minus when it opens", async ({
    page,
  }) => {
    await visitStates(page, "prose-blocks", theme);
    const mark = () =>
      page
        .locator("#pb-details-plus-1 > summary")
        .evaluate((el) => getComputedStyle(el, "::before").content);
    expect(await mark()).toBe('"+"');
    await page.locator("#pb-details-plus-1 > summary").click();
    expect(await mark()).toBe('"\u2212"');
    await expect(page.locator("#pb-details > summary")).toHaveCSS("list-style-type", "none");
  });

  test("behavior: on paper every details is open and an outside link prints its address", async ({
    page,
  }) => {
    await visitStates(page, "prose-blocks", theme);
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("#pb-details > p")).toBeVisible();
    const after = await page
      .locator('#pb-text a[href="https://example.com/network"]')
      .evaluate((el) => getComputedStyle(el, "::after").content);
    expect(after).toContain("https://example.com/network");
  });
});
