import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const SUMMARY = "35% you, 40% AI, 25% quoted by words";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the narrow specimen has no axe violations", async ({ page }) => {
    await page.setViewportSize({ width: 340, height: 800 });
    await visitStates(page, "authorship", theme, "narrow");
    await expectNoAxeViolations(page);
  });

  test("accessibility: labels and the summary reach their contrast, and each rule reaches 3:1", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    await expectContrast(page, [
      { sel: "#au-on .cap-run[data-kind='you'] > .cap-run-label", what: "the You label" },
      { sel: "#au-on .cap-run[data-kind='ai'] > .cap-run-label", what: "the AI label" },
      { sel: "#au-on .cap-run[data-kind='quoted'] > .cap-run-label", what: "the Quoted label" },
      { sel: "#au-on .cap-meter-value", what: "the summary line" },
      { sel: "#au-on .cap-meter-label", what: "the summary's name" },
      { sel: "#au-on .cap-meter-note", what: "the word counts" },
      { sel: "#au-on .cap-authorship-text", what: "the prose" },
      { sel: "#au-on div.cap-run[data-kind='you']", what: "the rule for your writing", part: "border", min: 3 },
      { sel: "#au-on div.cap-run[data-kind='ai']", what: "the rule for AI", part: "border", min: 3 },
      { sel: "#au-on div.cap-run[data-kind='quoted']", what: "the rule for quoted text", part: "border", min: 3 },
    ]);
  });

  test("accessibility: each kind has its own pattern as well as its own colour", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    const read = (kind: string) =>
      page.locator(`#au-on div.cap-run[data-kind='${kind}']`).evaluate((el) => {
        const cs = getComputedStyle(el);
        return { style: cs.borderLeftStyle, colour: cs.borderLeftColor, width: cs.borderLeftWidth };
      });
    const you = await read("you");
    const ai = await read("ai");
    const quoted = await read("quoted");
    expect(you.style).toBe("solid");
    expect(ai.style).toBe("dashed");
    expect(quoted.style).toBe("dotted");
    expect(new Set([you.colour, ai.colour, quoted.colour]).size).toBe(3);
    expect(parseFloat(you.width)).toBeGreaterThan(0);
  });

  test("accessibility: shown, the labels are read; hidden, the prose is plain with no extra words", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    const on = await page.locator("#au-on").ariaSnapshot();
    expect(on).toContain("You");
    expect(on).toContain("AI");
    expect(on).toContain("Quoted");
    expect(on).toContain(SUMMARY);
    const off = await page.locator("#au-off").ariaSnapshot();
    expect(off).not.toMatch(/\b(You|AI|Quoted)\b/);
    expect(off).not.toContain("by words");
    // The prose is still there.
    expect(off).toContain("I wrote the queue first and the rest second.");
    await expect(page.locator("#au-off .cap-run-label").first()).toBeHidden();
    await expect(page.locator("#au-off .cap-authorship-summary")).toBeHidden();
  });

  test("accessibility: the switch and the shown specimen have roles and names", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    await expect(page.locator("#au-on")).toMatchAriaSnapshot(`
      - /children: contain
      - switch "Show authorship" [checked]
      - text: /Authorship 35% you, 40% AI, 25% quoted by words/
      - paragraph: /^I wrote the queue first and the rest second/
      - paragraph: /^You I ask the agent for a suggested order, AI and it explains/
    `);
    await expect(page.locator("#au-off").getByRole("switch", { name: "Show authorship" })).not.toBeChecked();
  });

  test("accessibility: an avatar in a label is not read a second time", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    const label = page.locator("#au-avatar div.cap-run[data-kind='ai'] > .cap-run-label");
    await expect(label).toBeVisible();
    await expect(label.getByRole("img")).toHaveCount(0);
    expect((await label.textContent())?.replace(/\s+/g, "")).toBe("AIAI");
    const tree = await page.locator("#au-avatar").ariaSnapshot();
    expect(tree.match(/\bAI\b/g)?.length).toBeGreaterThan(0);
    expect(tree).not.toContain('img "AI"');
  });

  test("keyboard: the switch is reached by Tab and Space turns the marks off and on", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    const sw = page.locator("#au-on").getByRole("switch", { name: "Show authorship" });
    await sw.focus();
    await expect(sw).toBeFocused();
    await expect(page.locator("#au-on")).toHaveAttribute("data-authorship", "on");
    await page.keyboard.press("Space");
    await expect(sw).not.toBeChecked();
    await expect(page.locator("#au-on")).toHaveAttribute("data-authorship", "off");
    await expect(page.locator("#au-on .cap-run-label").first()).toBeHidden();
    await expect(page.locator("#au-on .cap-switch-state")).toHaveText("Off");
    await page.keyboard.press("Space");
    await expect(sw).toBeChecked();
    await expect(page.locator("#au-on")).toHaveAttribute("data-authorship", "on");
    await expect(page.locator("#au-on .cap-run-label").first()).toBeVisible();
    await expect(page.locator("#au-on .cap-switch-state")).toHaveText("On");
  });

  test("keyboard: Tab does not stop on a run, a label or the bar: the switch is the one stop", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    await page.locator("#au-on").getByRole("switch").focus();
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => document.activeElement?.closest("#au-on") !== null);
    expect(inside).toBe(false);
  });

  test("behaviour: the summary says the percentages and the words, and matches what the html said", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    await expect(page.locator("#au-on [data-cap-part='text']")).toHaveText(SUMMARY);
    const notes = await page.locator("#au-on [data-cap-part='notes'] span").allTextContents();
    expect(notes).toEqual(["You: 37 words", "AI: 42 words", "Quoted: 26 words"]);
  });

  test("behaviour: the bar's three segments take their share of the width, each in its own pattern", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    const m = await page.locator("#au-on .cap-meter-bar").evaluate((bar) => {
      const total = bar.getBoundingClientRect().width;
      const segs = [...bar.querySelectorAll<HTMLElement>(".cap-authorship-seg")].map((s) => ({ kind: s.dataset.kind, w: s.getBoundingClientRect().width / total, bg: getComputedStyle(s).backgroundImage }));
      return segs;
    });
    const share = Object.fromEntries(m.map((s) => [s.kind, s.w]));
    expect(share.you).toBeGreaterThan(0.3);
    expect(share.you).toBeLessThan(0.4);
    expect(share.ai).toBeGreaterThan(0.35);
    expect(share.ai).toBeLessThan(0.45);
    expect(share.quoted).toBeGreaterThan(0.2);
    expect(share.quoted).toBeLessThan(0.3);
    expect(new Set(m.map((s) => s.bg)).size).toBe(3);
  });

  test("behaviour: the choice is remembered", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    const box = page.locator("#au-remember");
    await box.getByRole("switch", { name: "Show authorship" }).uncheck();
    await expect(box).toHaveAttribute("data-authorship", "off");
    await page.reload();
    await expect(page.locator("#au-remember").getByRole("switch", { name: "Show authorship" })).not.toBeChecked();
    await expect(page.locator("#au-remember")).toHaveAttribute("data-authorship", "off");
    await expect(page.locator("#au-remember .cap-run-label").first()).toBeHidden();
    // The specimens that do not remember are untouched.
    await expect(page.locator("#au-on")).toHaveAttribute("data-authorship", "on");
  });

  test("behaviour: storage that throws does not break the switch", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("blocked");
        },
      });
    });
    await visitStates(page, "authorship", theme);
    const box = page.locator("#au-remember");
    await box.getByRole("switch").uncheck();
    await expect(box.locator(".cap-run-label").first()).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("behaviour: on a wide container the labels sit in the margin, left of the rule; on a narrow one above the text", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    const wide = await page.locator("#au-on div.cap-run[data-kind='ai']").evaluate((run) => {
      const l = run.querySelector(".cap-run-label")?.getBoundingClientRect();
      const r = run.getBoundingClientRect();
      return l ? { labelRight: l.right, runLeft: r.left, labelTop: l.top, runTop: r.top } : null;
    });
    expect(wide).not.toBeNull();
    expect((wide?.labelRight ?? 0) <= (wide?.runLeft ?? 0)).toBe(true);

    await page.setViewportSize({ width: 340, height: 800 });
    await visitStates(page, "authorship", theme, "narrow");
    const narrow = await page.locator("div.cap-run[data-kind='ai']").evaluate((run) => {
      const l = run.querySelector(".cap-run-label")?.getBoundingClientRect();
      const p = run.querySelector("p")?.getBoundingClientRect();
      const r = run.getBoundingClientRect();
      return l && p ? { labelBottom: l.bottom, textTop: p.top, labelLeft: l.left, runLeft: r.left } : null;
    });
    expect(narrow).not.toBeNull();
    expect((narrow?.labelBottom ?? 0) <= (narrow?.textTop ?? 0) + 1).toBe(true);
    expect((narrow?.labelLeft ?? 0) >= (narrow?.runLeft ?? 0)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test("behaviour: a run inside a paragraph is a span with a label at its start", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    const inline = page.locator("#au-on p > span.cap-run");
    await expect(inline).toHaveCount(3);
    await expect(inline.nth(1).locator(".cap-run-label")).toHaveText("AI");
    const text = await inline.nth(1).innerText();
    expect(text).toContain("A suggestion is a note beside the mention");
  });

  test("behaviour: the React Authorship counts its Runs and the switch hides them", async ({ page }) => {
    await visitStates(page, "authorship", theme);
    const box = page.locator("[data-mount='react'] .cap-authorship");
    await expect(box.locator("[data-cap-part='text']")).toHaveText("55% you, 20% AI, 25% quoted by words");
    await expect(box.locator(".cap-run-label").first()).toBeVisible();
    await box.getByRole("switch", { name: "Show authorship" }).uncheck();
    await expect(box).toHaveAttribute("data-authorship", "off");
    await expect(box.locator(".cap-run-label").first()).toBeHidden();
    await expect(box.locator(".cap-authorship-summary")).toBeHidden();
  });
});

test("behaviour: the delivered html has the labels, the summary and the prose with no script", async ({ page }) => {
  const html = await (await page.request.get("components/authorship/states.html")).text();
  expect(html).toContain('<span class="cap-run-label">AI</span>');
  expect(html).toContain('<span class="cap-run-label">Quoted</span>');
  expect(html).toContain(SUMMARY);
  expect(html).toContain("I wrote the queue first and the rest second.");
});

test.describe("without script", () => {
  test.use({ javaScriptEnabled: false });

  test("behaviour: the switch itself hides the marks and leaves the prose", async ({ page }) => {
    await page.goto("components/authorship/states.html?theme=light");
    const box = page.locator("#au-on");
    await expect(box.locator(".cap-run-label").first()).toBeVisible();
    await expect(box.locator("[data-cap-part='text']")).toHaveText(SUMMARY);
    await box.getByRole("switch", { name: "Show authorship" }).uncheck();
    await expect(box.locator(".cap-run-label").first()).toBeHidden();
    await expect(box.locator(".cap-authorship-summary")).toBeHidden();
    await expect(box.getByText("I wrote the queue first and the rest second.")).toBeVisible();
  });
});
