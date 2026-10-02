import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const words = "ul[aria-label='Statuses as words']";
const pills = "ul[aria-label='Statuses as pills']";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "status", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: every tone reaches its contrast as a word and as a pill", async ({ page }) => {
    await visitStates(page, "status", theme);
    await expectContrast(page, [
      { sel: `${words} li:nth-child(1) .cap-status`, what: "critical word" },
      { sel: `${words} li:nth-child(2) .cap-status`, what: "warning word" },
      { sel: `${words} li:nth-child(3) .cap-status`, what: "notice word" },
      { sel: `${words} li:nth-child(4) .cap-status`, what: "ok word" },
      { sel: `${words} li:nth-child(5) .cap-status`, what: "running word" },
      { sel: `${words} li:nth-child(6) .cap-status`, what: "no data word" },
      { sel: `${pills} li:nth-child(1) .cap-pill`, what: "critical pill" },
      { sel: `${pills} li:nth-child(2) .cap-pill`, what: "warning pill" },
      { sel: `${pills} li:nth-child(3) .cap-pill`, what: "notice pill" },
      { sel: `${pills} li:nth-child(4) .cap-pill`, what: "ok pill" },
      { sel: `${pills} li:nth-child(5) .cap-pill`, what: "running pill" },
      { sel: `${pills} li:nth-child(6) .cap-pill`, what: "no data pill" },
      { sel: "#sample-selected .cap-pill", what: "a pill on a selected row" },
      { sel: "#sample-selected .cap-status", what: "a word on a selected row" },
      { sel: "#sample-reason .cap-status-reason", what: "the no data reason" },
    ]);
  });

  test("accessibility: the words' roles and names, glyphs hidden", async ({ page }) => {
    await visitStates(page, "status", theme);
    await expect(page.locator(words)).toMatchAriaSnapshot(`
      - list "Statuses as words":
        - listitem: Critical
        - listitem: Warning
        - listitem: Notice
        - listitem: Healthy
        - listitem: Running
        - listitem: No data
    `);
  });

  test("behaviour: each meaning has its own glyph shape, so colour is never alone", async ({ page }) => {
    await visitStates(page, "status", theme);
    const shapes = await page.locator(`${words} .cap-status-glyph`).evaluateAll((svgs) => svgs.map((s) => s.innerHTML));
    expect(shapes).toHaveLength(6);
    expect(new Set(shapes).size).toBe(6);
    const hidden = await page.locator(".cap-status-glyph").evaluateAll((svgs) => svgs.every((s) => s.getAttribute("aria-hidden") === "true"));
    expect(hidden).toBe(true);
  });

  test("accessibility: a brief no data says two words to the eye and its reason to a screen reader", async ({ page }) => {
    await visitStates(page, "status", theme);
    await expectContrast(page, [{ sel: "#sample-brief .cap-status", what: "the brief no data word" }]);
    await expect(page.locator("#sample-brief")).toMatchAriaSnapshot(`
      - paragraph: /No data\\s*:\\s*no Cloudflare token for this site/
    `);
    await expect(page.locator("#sample-brief .cap-status")).toHaveAttribute("title", "No Cloudflare token for this site");
    // What the eye reads: the text with the screen-reader-only reason left out.
    const shown = await page.locator("#sample-brief .cap-status").evaluate((el) => {
      const copy = el.cloneNode(true) as HTMLElement;
      copy.querySelectorAll(".cap-sr-only").forEach((n) => n.remove());
      return (copy.textContent ?? "").trim();
    });
    expect(shown).toBe("No data");
  });

  test("behaviour: a pill keeps its own tint on a selected row", async ({ page }) => {
    await visitStates(page, "status", theme);
    const [pillBg, rowBg] = await page.evaluate(() => [
      getComputedStyle(document.querySelector("#sample-selected .cap-pill")!).backgroundColor,
      getComputedStyle(document.querySelector("#sample-selected")!).backgroundColor,
    ]);
    expect(pillBg).not.toBe(rowBg);
  });
});
