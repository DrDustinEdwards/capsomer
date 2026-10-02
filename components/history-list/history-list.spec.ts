import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, focused, visitStates } from "../../test/helpers.ts";
import { PICK_BLOCKED, PICK_NONE, compareHref, condense, countWords, deltaOf, deltaSign, deltaText, orderPair, pickTwo, pickedText, rangeText, restoredEntry, stamp, wordDelta, type HistoryEntry } from "./history-list.ts";

const at = (t: string) => `2026-10-02T${t}:00Z`;
const entry = (id: string, kind: HistoryEntry["kind"], t: string, words: number, extra: Partial<HistoryEntry> = {}): HistoryEntry => ({ id, kind, who: "Dustin Edwards", at: at(t), words, summary: `Version ${id}`, ...extra });

// The pure helpers need no browser.
test("behaviour: wordDelta is the signed change in words, from two texts or two counts", () => {
  expect(wordDelta("one two three", "one two three four five")).toBe(2);
  expect(wordDelta(1884, 1854)).toBe(-30);
  expect(wordDelta("same words", "same words")).toBe(0);
  expect(wordDelta("", "a b")).toBe(2);
  expect(countWords("  spaced   out \n words ")).toBe(3);
});

test("behaviour: the size change is said in words with its sign as text, and no change in words", () => {
  expect(deltaText(142)).toBe("+142 words");
  expect(deltaText(-30)).toBe("−30 words");
  expect(deltaText(1)).toBe("+1 word");
  expect(deltaText(-1)).toBe("−1 word");
  expect(deltaText(0)).toBe("no change in length");
  expect([deltaSign(5), deltaSign(-5), deltaSign(0)]).toEqual(["plus", "minus", "zero"]);
});

test("behaviour: condense folds runs of consecutive autosaves and keeps every other line", () => {
  const list: HistoryEntry[] = [
    entry("a", "edit", "15:00", 120),
    entry("b", "autosave", "14:40", 110),
    entry("c", "autosave", "14:20", 100),
    entry("d", "autosave", "14:02", 90),
    entry("e", "named", "13:30", 80, { name: "Before the rewrite" }),
    entry("f", "autosave", "13:00", 78),
    entry("g", "publish", "12:00", 78),
  ];
  const lines = condense(list);
  expect(lines.map((l) => (l.type === "run" ? `run:${l.entries.length}` : l.entry.id))).toEqual(["a", "run:3", "e", "f", "g"]);
  const run = lines[1];
  if (run?.type !== "run") throw new Error("expected a run");
  expect(run.from).toBe(at("14:02"));
  expect(run.to).toBe(at("14:40"));
  // 110 - 80 after the run began from "e": the run's total is the change from the line before it.
  expect(run.delta).toBe(30);
  expect(rangeText(run.from, run.to)).toBe("14:02 to 14:40 UTC");
});

test("behaviour: the current version is never folded into a run, and a single autosave is just a line", () => {
  const list = [entry("a", "autosave", "15:00", 12), entry("b", "autosave", "14:00", 10), entry("c", "autosave", "13:00", 8)];
  const lines = condense(list);
  expect(lines.map((l) => (l.type === "run" ? `run:${l.entries.length}` : l.entry.id))).toEqual(["a", "run:2"]);
  expect(condense([entry("a", "edit", "15:00", 9), entry("b", "autosave", "14:00", 5), entry("c", "edit", "13:00", 3)]).every((l) => l.type === "entry")).toBe(true);
  expect(deltaOf(list, 0)).toBe(2);
});

test("behaviour: pickTwo allows at most two and refuses a third rather than swapping", () => {
  expect(pickTwo([], "a")).toEqual({ picked: ["a"], blocked: false });
  expect(pickTwo(["a"], "b")).toEqual({ picked: ["a", "b"], blocked: false });
  expect(pickTwo(["a", "b"], "c")).toEqual({ picked: ["a", "b"], blocked: true });
  expect(pickTwo(["a", "b"], "a")).toEqual({ picked: ["b"], blocked: false });
});

test("behaviour: the pair is ordered older first whatever the pick order, and the address is built from the two ids", () => {
  const times: Record<string, number> = { a: Date.parse(at("09:00")), b: Date.parse(at("14:00")) };
  expect(orderPair(["b", "a"], (id) => times[id] ?? 0)).toEqual(["a", "b"]);
  expect(orderPair(["a", "b"], (id) => times[id] ?? 0)).toEqual(["a", "b"]);
  expect(orderPair(["a"], (id) => times[id] ?? 0)).toBeNull();
  expect(compareHref("/posts/phage/compare", "a", "b")).toBe("/posts/phage/compare?from=a&to=b");
  expect(pickedText(0)).toBe(PICK_NONE);
  expect(PICK_BLOCKED).toBe("Two versions are picked; untick one first.");
});

test("behaviour: a restore is a new line with the restored length, never a change to an old line", () => {
  const current = entry("v-9", "edit", "14:00", 1954);
  const source = entry("v-2", "edit", "09:15", 1742);
  const made = restoredEntry(source, current, "Dustin Edwards", "v-2-restored-1", at("15:00"));
  expect(made).toMatchObject({ kind: "restore", words: 1742, delta: -212, restoredFrom: { id: "v-2" } });
  expect(made.summary).toBe(`Restored the version from ${stamp(source.at, Date.parse(at("15:00")))}`);
  expect(source.words).toBe(1742);
});

test("behaviour: the page is delivered with every line, its size change and its state in words", async ({ page }) => {
  const html = await (await page.request.get("components/history-list/states.html")).text();
  expect(html).toContain("12 autosaves");
  expect(html).toContain("+58 words");
  expect(html).toContain("−30 words");
  expect(html).toContain("no change in length");
  expect(html).toContain("Named version: <b>Before the rewrite</b>");
  expect(html).toContain("Failed");
  expect(html).toContain("Current");
  // The folded autosaves are in the HTML, not made by script.
  expect((html.match(/data-kind="autosave"/g) ?? []).length).toBeGreaterThanOrEqual(12);
});

const main = (page: Page) => page.locator("#hist-main");

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations on a phone", async ({ page }) => {
    await visitStates(page, "history-list", theme, "phone");
    await expectNoAxeViolations(page);
  });

  test("accessibility: each text tone and each control boundary reaches its contrast", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    await expectContrast(page, [
      { sel: "#hist-main .cap-row-title a", what: "a line's summary" },
      { sel: "#hist-main .cap-hist-name", what: "who" },
      { sel: "#hist-main .cap-hist-delta span", what: "the size change" },
      { sel: "#hist-main .cap-hist-delta svg", what: "the size change's mark", part: "color", min: 3 },
      { sel: "#hist-main .cap-time", what: "the relative time" },
      { sel: "#hist-main .cap-hist-exact", what: "the exact time" },
      { sel: "#hist-main .cap-row-detail", what: "the kind line" },
      { sel: "#hist-main .cap-hist-picked", what: "the pick bar's line" },
      { sel: "#hist-main [data-cap-part='restore']", what: "Restore" },
      { sel: "#hist-main .cap-row-actions .cap-status", what: "Current" },
      { sel: "#hist-main [data-kind='publish'] .cap-hist-dest .cap-status[data-tone='ok']", what: "Live" },
      { sel: "#hist-main [data-kind='publish'] .cap-hist-dest .cap-status[data-tone='crit']", what: "Failed" },
      { sel: "#hist-main [data-cap-part='pick']", what: "a pick box's edge", part: "border" },
      { sel: "#hist-main .cap-hist-bar", what: "the pick bar's edge", part: "border", min: 1 },
    ]);
  });

  test("accessibility: the roles and names of the pick bar and the first line", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    await expect(page.locator("#hist-two .cap-hist-bar")).toMatchAriaSnapshot(`
      - status: "2 versions picked. Older: 1 Oct, 09:00 UTC. Newer: 2 Oct, 13:30 UTC. The older is always first, whichever you picked first."
      - link "Compare 2 versions"
    `);
    await expect(page.locator("#hist-two")).toMatchAriaSnapshot(`
      - list "History with two picked":
        - listitem:
          - checkbox "Compare this version, 2 Oct, 14:52 UTC, by Dustin Edwards" [disabled]
          - link "Added the 2019 burst size paper and its caveat"
          - text: +42 words
          - time: 8 minutes ago
          - time: 2 Oct, 14:52 UTC
          - text: Current
        - listitem:
          - checkbox "Compare this version, 2 Oct, 13:30 UTC, by Dustin Edwards" [checked]
          - link "Cut the introduction to two paragraphs"
          - paragraph: "Named version: Before the rewrite"
          - text: +58 words
          - button "Restore the version from 2 Oct, 13:30 UTC by Dustin Edwards"
        - listitem:
          - checkbox "Compare this version, 1 Oct, 16:10 UTC, by Rosa Park" [disabled]
          - text: \u221230 words
    `);
  });

  test("accessibility: every pick box and Restore button names its version", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const names = await page.locator("#hist-main [data-cap-part='pick']").evaluateAll((els) => els.map((e) => (e.closest("label")?.textContent ?? "").trim()));
    expect(names.length).toBeGreaterThanOrEqual(15);
    expect(new Set(names).size).toBe(names.length);
    expect(names.every((n) => n.startsWith("Compare this version"))).toBe(true);
    await expect(main(page).getByRole("button", { name: /^Restore the version from/ }).first()).toBeVisible();
  });

  test("accessibility: the size change says its sign in text, and a drawn mark repeats it", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const m = main(page);
    await expect(m.locator("[data-sign='plus']").first()).toContainText(/^\+\d+ words$/);
    await expect(m.locator("[data-sign='minus']").first()).toContainText("−30 words");
    await expect(m.locator("[data-sign='zero']").first()).toContainText("no change in length");
    for (const sign of ["plus", "minus", "zero"]) await expect(m.locator(`[data-sign='${sign}'] svg`).first()).toHaveAttribute("aria-hidden", "true");
  });

  test("accessibility: a status is a word and a shape, and the avatar is hidden because the name is beside it", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const failed = main(page).locator(".cap-hist-dest .cap-status[data-tone='crit']");
    await expect(failed).toHaveText("Failed");
    await expect(failed.locator("svg")).toHaveCount(1);
    await expect(main(page).locator(".cap-hist-who .cap-avatar").first()).toHaveAttribute("aria-hidden", "true");
  });

  test("accessibility: the phone layout does not scroll sideways and keeps the hit areas", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await visitStates(page, "history-list", theme, "phone");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    for (const b of await page.locator("#hist-phone [data-cap-part='restore']").all()) {
      const box = await b.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
    }
  });

  test("keyboard: Tab goes through the pick box, the title and Restore of each line, in order", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const list = page.locator("#hist-comfy");
    await list.locator("[data-id='v-71'] [data-cap-part='pick']").focus();
    for (const next of [list.locator("[data-id='v-71'] .cap-row-title a"), list.locator("[data-id='v-70'] [data-cap-part='pick']"), list.locator("[data-id='v-70'] .cap-row-title a"), list.locator("[data-id='v-70'] [data-cap-part='restore']")]) {
      await page.keyboard.press("Tab");
      await expect(next).toBeFocused();
    }
  });

  test("keyboard: j and k move focus between the lines' titles", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const links = main(page).locator(".cap-hist-list > .cap-hist-row .cap-row-title :is(a, button)");
    await page.locator("#hist-main .cap-row-title a").first().focus();
    await page.keyboard.press("j");
    await expect(links.nth(1)).toBeFocused();
    await page.keyboard.press("j");
    await expect(links.nth(2)).toBeFocused();
    await page.keyboard.press("k");
    await expect(links.nth(1)).toBeFocused();
  });

  test("keyboard: j and k work from a pick box that was just ticked", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const box = page.locator("#hist-main [data-id='v-31'] [data-cap-part='pick']");
    await box.check();
    await expect(box).toBeFocused();
    await page.keyboard.press("j");
    await expect(page.locator("#hist-main [data-id='v-30'] .cap-row-title a")).toBeFocused();
    await page.keyboard.press("k");
    await expect(page.locator("#hist-main [data-id='v-31'] .cap-row-title a")).toBeFocused();
  });

  test("keyboard: j and k stay quiet when single-key shortcuts are off", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    await page.evaluate(() => (document.documentElement.dataset.capSingleKeys = "off"));
    const first = page.locator("#hist-main .cap-row-title a").first();
    await first.focus();
    await page.keyboard.press("j");
    await expect(first).toBeFocused();
  });

  test("keyboard: Enter on a title follows that version's link", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const link = page.locator("#hist-comfy .cap-row-title a").first();
    await expect(link).toHaveAttribute("href", "?version=v-71");
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/version=v-71/);
  });

  test("keyboard: Enter and Space on a run's button open and close the autosaves, and aria-expanded follows", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const button = main(page).getByRole("button", { name: "12 autosaves" });
    const rows = page.locator(`#${(await button.getAttribute("aria-controls")) ?? ""}`);
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(rows).toBeHidden();
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(rows).toBeVisible();
    await expect(rows.getByRole("checkbox")).toHaveCount(12);
    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(rows).toBeHidden();
  });

  test("keyboard: Space on a pick box picks it; two picks enable Compare with an address from the two ids, older first", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const m = main(page);
    const compare = m.getByRole("link", { name: "Compare 2 versions" });
    await expect(compare).toHaveAttribute("aria-disabled", "true");
    // Pick the newer first, then the older: the address still reads older to newer.
    const newer = m.locator("[data-id='v-17'] [data-cap-part='pick']");
    const older = m.locator("[data-id='v-15'] [data-cap-part='pick']");
    await newer.focus();
    await page.keyboard.press("Space");
    await expect(newer).toBeChecked();
    await expect(m.locator("[data-cap-part='picked']")).toHaveText("1 version picked. Pick one more.");
    await older.focus();
    await page.keyboard.press("Space");
    await expect(older).toBeChecked();
    await expect(compare).toHaveAttribute("href", "/posts/phage-lambda/compare?from=v-15&to=v-17");
    await expect(compare).not.toHaveAttribute("aria-disabled", "true");
    await expect(m.locator("[data-cap-part='picked']")).toContainText("2 versions picked. Older: 1 Oct, 09:00 UTC. Newer: 2 Oct, 13:30 UTC.");
  });

  test("keyboard: a third pick is refused and said, and unticking one lets another be picked", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const m = main(page);
    const box = (id: string) => m.locator(`[data-id='${id}'] [data-cap-part='pick']`);
    for (const id of ["v-17", "v-16"]) {
      await box(id).focus();
      await page.keyboard.press("Space");
    }
    await box("v-15").focus();
    await expect(box("v-15")).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Space");
    await expect(box("v-15")).not.toBeChecked();
    await expect(m.locator("[data-cap-part='picked']")).toHaveText(PICK_BLOCKED);
    await box("v-16").focus();
    await page.keyboard.press("Space");
    await expect(m.locator("[data-cap-part='picked']")).toHaveText("1 version picked. Pick one more.");
    await box("v-15").focus();
    await page.keyboard.press("Space");
    await expect(box("v-15")).toBeChecked();
  });

  test("keyboard: Compare does nothing, and says what is missing, until two are picked", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const compare = main(page).getByRole("link", { name: "Compare 2 versions" });
    await compare.focus();
    await page.keyboard.press("Enter");
    await expect(page).not.toHaveURL(/from=/);
    await expect(main(page).locator("[data-cap-part='picked']")).toHaveText(PICK_NONE);
  });

  test("keyboard: Enter on Restore adds a new line on top, marks it Current, and says so with Undo; focus stays", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const m = main(page);
    const restore = m.locator("[data-id='v-16'] [data-cap-part='restore']");
    const before = await m.locator(".cap-hist-list > .cap-hist-row[data-id]").count();
    await restore.focus();
    await page.keyboard.press("Enter");
    const top = m.locator(".cap-hist-list > .cap-hist-row").first();
    await expect(top).toHaveAttribute("data-kind", "restore");
    await expect(top).toHaveAttribute("data-current", "");
    await expect(top).toContainText("Restored the version from 1 Oct, 16:10 UTC");
    await expect(top.locator(".cap-status")).toHaveText("Current");
    // The earlier current line is a plain line again, with Restore, and every old line is still there.
    await expect(m.locator("[data-id='v-31']")).not.toHaveAttribute("data-current", "");
    await expect(m.locator("[data-id='v-31'] [data-cap-part='restore']")).toBeVisible();
    await expect(m.locator(".cap-hist-list > .cap-hist-row[data-id]")).toHaveCount(before + 1);
    await expect(m.locator("[data-id='v-16']")).toHaveCount(1);
    await expect(page.locator("#hist-results")).toContainText("Restored version from 1 Oct as a new version.");
    await expect(page.locator("#hist-results").getByRole("button", { name: /^Undo/ })).toBeVisible();
    await expect(restore).toBeFocused();
  });

  test("keyboard: z undoes the restore, removes the new line and makes the earlier version current again", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const m = main(page);
    const restore = m.locator("[data-id='v-16'] [data-cap-part='restore']");
    await restore.focus();
    await page.keyboard.press("Enter");
    await expect(m.locator("[data-kind='restore']")).toHaveCount(1);
    await page.keyboard.press("z");
    await expect(m.locator("[data-kind='restore']")).toHaveCount(0);
    await expect(m.locator("[data-id='v-31']")).toHaveAttribute("data-current", "");
    await expect(m.locator("[data-id='v-31'] .cap-status")).toHaveText("Current");
    await expect(restore).toBeFocused();
    await expect(page.locator("#hist-results")).toContainText("Undone.");
  });

  test("behaviour: the restored line's size change is the difference from the version it replaced", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const m = main(page);
    await m.locator("[data-id='v-15'] [data-cap-part='restore']").click();
    // Current was 1954 words; v-15 has 1884.
    await expect(m.locator(".cap-hist-list > .cap-hist-row").first().locator(".cap-hist-delta")).toContainText("−70 words");
  });

  test("behaviour: a restore tells the app, and an Undo tells it again", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    await page.evaluate(() => {
      const w = window as unknown as { __events: string[] };
      w.__events = [];
      for (const name of ["cap:history-restored", "cap:history-unrestored"]) document.addEventListener(name, (e) => w.__events.push(`${name}:${(e as CustomEvent).detail.source.id}`));
    });
    await main(page).locator("[data-id='v-16'] [data-cap-part='restore']").click();
    await page.locator("#hist-results").getByRole("button", { name: /^Undo/ }).click();
    expect(await page.evaluate(() => (window as unknown as { __events: string[] }).__events)).toEqual(["cap:history-restored:v-16", "cap:history-unrestored:v-16"]);
  });

  test("behaviour: Load older is a link that works as delivered", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const older = main(page).getByRole("link", { name: "Load older versions" });
    await expect(older).toHaveAttribute("href", "?before=v-15");
    await older.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/before=v-15/);
  });

  test("keyboard: Enter on Load older lets the app take over: the next page joins the list, folded, and the control goes", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const list = page.locator("#hist-pages");
    const older = list.getByRole("link", { name: "Load older versions" });
    await older.focus();
    await page.keyboard.press("Enter");
    await expect(page).not.toHaveURL(/before=/);
    await expect(list.locator("[data-id='v-85']")).toHaveCount(1);
    // Three autosaves in a row came as one line that opens, and the lines work like the others.
    const run = list.getByRole("button", { name: "3 autosaves" });
    await expect(run).toHaveAttribute("aria-expanded", "false");
    await run.click();
    await expect(list.locator("[data-id='v-87']")).toBeVisible();
    await expect(list.locator("[data-id='v-85'] .cap-hist-delta")).toContainText("+120 words");
    await expect(older).toHaveCount(0);
    // A line that came late can be picked and restored like any other.
    await list.locator("[data-id='v-85'] [data-cap-part='pick']").check();
    await expect(list.locator("[data-cap-part='picked']")).toHaveText("1 version picked. Pick one more.");
  });

  test("behaviour: the empty state says what the first save does", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    await expect(page.locator("#hist-empty")).toContainText("No versions yet");
    await expect(page.locator("#hist-empty")).toContainText("The first save of this post makes the first version.");
  });

  test("behaviour: the React wrapper renders the same contract: lines, a run that opens, and the pick bar", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const r = page.locator("#react-history");
    await expect(r.getByRole("checkbox", { name: /^Compare this version/ })).toHaveCount(3);
    await expect(r.getByRole("link", { name: "Added the 2019 burst size paper and its caveat" })).toBeVisible();
    await expect(r.getByText("+42 words")).toBeVisible();
    const run = r.getByRole("button", { name: "2 autosaves" });
    await expect(run).toHaveAttribute("aria-expanded", "false");
    await run.click();
    await expect(run).toHaveAttribute("aria-expanded", "true");
    await expect(r.getByRole("checkbox", { name: /^Compare this version/ })).toHaveCount(5);
    const box = (id: string) => r.locator(`li[data-id='${id}'] input[type=checkbox]`);
    await box("r-5").check();
    await box("r-1").check();
    await expect(r.getByRole("link", { name: "Compare 2 versions" })).toHaveAttribute("href", "/posts/phage-lambda/compare?from=r-1&to=r-5");
    await box("r-4").click({ force: true });
    await expect(r.locator("[data-cap-part='picked']")).toHaveText("Two versions are picked; untick one first.");
    await expect(box("r-4")).not.toBeChecked();
  });

  test("behaviour: the React wrapper restores as a new line with Undo, and z takes it back", async ({ page }) => {
    await visitStates(page, "history-list", theme);
    const r = page.locator("#react-history");
    await r.locator("li[data-id='r-1'] [data-cap-part='restore']").click();
    const top = r.locator(".cap-hist-list > li.cap-hist-row").first();
    await expect(top).toHaveAttribute("data-kind", "restore");
    await expect(top).toContainText("Restored the version from 1 Oct, 16:10 UTC");
    await expect(r.locator("li[data-id='r-5']")).not.toHaveAttribute("data-current", "");
    await expect(r.locator(".cap-message")).toContainText("Restored version from 1 Oct as a new version.");
    await page.keyboard.press("z");
    await expect(r.locator("li[data-kind='restore']")).toHaveCount(0);
    await expect(r.locator("li[data-id='r-5']")).toHaveAttribute("data-current", "");
  });
});
