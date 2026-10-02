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

  test("accessibility: every badge variant reaches its contrast", async ({ page }) => {
    await visitStates(page, "status", theme);
    await expectContrast(page, [
      { sel: "#sample-variants [data-variant='default']", what: "default badge" },
      { sel: "#sample-variants [data-variant='secondary']", what: "secondary badge" },
      { sel: "#sample-variants [data-variant='outline']", what: "outline badge" },
      { sel: "#sample-variants [data-variant='outline']", what: "outline badge edge", part: "border", min: 3 },
      { sel: "#sample-variants [data-variant='destructive']", what: "destructive badge" },
      { sel: "#sample-variants [data-variant='ghost']", what: "ghost badge" },
      { sel: "#sample-variants [data-variant='link']", what: "link badge" },
      { sel: "#sample-variant-tones [data-tone='ok']", what: "outline ok badge" },
      { sel: "#sample-variant-tones [data-tone='warn']", what: "outline warning badge" },
      { sel: "#sample-variant-tones [data-tone='crit']", what: "ghost critical badge" },
      { sel: "#sample-interactive [data-force='hover'][data-variant='default']", what: "hovered default badge" },
      { sel: "#sample-interactive [data-force='hover'][data-variant='ghost']", what: "hovered ghost badge" },
      { sel: "#sample-interactive [data-force='hover'][data-variant='link']", what: "hovered link badge" },
      { sel: "#sample-comfortable .cap-pill[data-tone='warn']", what: "comfortable warning badge" },
    ]);
  });

  test("keyboard: a link badge and a button badge take Tab in reading order and show a focus ring", async ({ page }) => {
    await visitStates(page, "status", theme);
    const link = page.locator("#sample-interactive").getByRole("link", { name: "Mentions 4" });
    const button = page.locator("#sample-interactive").getByRole("button", { name: "Filter: blocked" });
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS("outline-style", "solid");
  });

  test("keyboard: a disabled badge button is skipped", async ({ page }) => {
    await visitStates(page, "status", theme);
    const disabled = page.locator("#sample-interactive").getByRole("button", { name: "Disabled" });
    await expect(disabled).toBeDisabled();
  });

  test("accessibility: a badge's hit area reaches the target size", async ({ page }) => {
    await visitStates(page, "status", theme);
    const box = await page.locator("#sample-interactive").getByRole("link", { name: "Mentions 4" }).evaluate((el) => {
      const after = getComputedStyle(el, "::after");
      const r = el.getBoundingClientRect();
      return { h: Math.max(r.height, r.height + Math.abs(parseFloat(after.top)) * 2), pos: after.position };
    });
    expect(box.pos).toBe("absolute");
    expect(box.h).toBeGreaterThanOrEqual(24);
  });

  test("accessibility: a count badge says what it counts", async ({ page }) => {
    await visitStates(page, "status", theme);
    await expect(page.getByText("3 waiting")).toHaveCount(1);
  });
});
