import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, focused, visitStates } from "../../test/helpers.ts";
import { revisionPair } from "./draft-compare.ts";

test("behaviour: revisionPair reads id@v1 against id@v2 as one thing at two revisions, and nothing else", () => {
  expect(revisionPair("post-8f3a@v1", "post-8f3a@v2")).toEqual({ name: "post-8f3a", from: "v1", to: "v2" });
  expect(revisionPair("app/page@2026-10-01", "app/page@2026-10-02")).toEqual({ name: "app/page", from: "2026-10-01", to: "2026-10-02" });
  expect(revisionPair("a@v1", "b@v1")).toBeNull();
  expect(revisionPair("a@v1", "a@v1")).toBeNull();
  expect(revisionPair("a", "b")).toBeNull();
  expect(revisionPair("a@v1", "a")).toBeNull();
});

const sel = (id: string, rest: string) => `#${id} ${rest}`;
const view = (id: string, v: string) => `#${id} .cap-compare-view[data-view='${v}']`;

// The element that has focus, as its change number (or "none").
const focusedChange = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.change ?? "none");

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the narrow specimen has no axe violations", async ({ page }) => {
    await visitStates(page, "draft-compare", theme, "narrow");
    await expectNoAxeViolations(page);
  });

  test("accessibility: ins and del text, the legend and every label reach their contrast", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    await expectContrast(page, [
      { sel: sel("cmp-default", ".cap-ins"), what: "inserted text on its tint" },
      { sel: sel("cmp-default", ".cap-del"), what: "deleted text on its tint" },
      { sel: sel("cmp-default", ".cap-compare-key-mark[data-kind='ins']"), what: "the legend's Added" },
      { sel: sel("cmp-default", ".cap-compare-key-mark[data-kind='del']"), what: "the legend's Removed" },
      { sel: sel("cmp-default", ".cap-compare-side-role"), what: "a side's Before or After" },
      { sel: sel("cmp-default", ".cap-compare-side-title"), what: "a side's title" },
      { sel: sel("cmp-default", ".cap-compare-side-meta"), what: "a side's who and time" },
      { sel: sel("cmp-default", ".cap-compare-counts"), what: "the counts" },
      { sel: sel("cmp-default", ".cap-compare-views-help dd"), what: "the views explained" },
      { sel: sel("cmp-default", ".cap-compare-change-label"), what: "a change's label" },
      { sel: sel("cmp-default", ".cap-compare-jump-link"), what: "a jump link" },
      { sel: sel("cmp-default", ".cap-compare-jump-link"), what: "a jump link's edge", part: "border" },
      { sel: sel("cmp-default", ".cap-compare-gap > summary"), what: "a folded passage's summary" },
      { sel: sel("cmp-default", ".cap-compare-text"), what: "the text" },
      { sel: sel("cmp-changes", ".cap-compare-skip"), what: "the count of skipped sentences", min: 4.5 },
    ]);
  });

  test("accessibility: a marked change is more than colour: a line, a glyph and hidden words", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const marks = await page.evaluate(() => {
      const ins = document.querySelector("#cmp-single .cap-ins") as HTMLElement;
      const del = document.querySelector("#cmp-single .cap-del") as HTMLElement;
      const read = (el: HTMLElement) => ({
        line: getComputedStyle(el).textDecorationLine,
        glyph: getComputedStyle(el, "::before").content,
        text: el.textContent,
      });
      return { ins: read(ins), del: read(del) };
    });
    expect(marks.ins.line).toContain("underline");
    expect(marks.del.line).toContain("line-through");
    expect(marks.ins.glyph).toContain("+");
    expect(marks.del.glyph).toContain("−");
    expect(marks.ins.text).toContain("insertion start");
    expect(marks.ins.text).toContain("insertion end");
    expect(marks.del.text).toContain("deletion start");
    expect(marks.del.text).toContain("deletion end");
  });

  test("accessibility: the compare, its sides, switch and jump list have roles and names", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    await expect(page.locator("#cmp-single")).toMatchAriaSnapshot(`
      - region "Compare Draft 1 with Draft 2":
        - group "View":
          - radio "Side by side" [checked]
          - radio "Inline"
          - radio "Changes only"
        - navigation "Changes":
          - button "Previous change p"
          - button "Next change n"
          - list:
            - listitem:
              - link "Change 1 of 1"
        - region "Side by side, Compare Draft 1 with Draft 2"
    `);
  });

  test("accessibility: each side is named, with its title, who and when", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const head = page.locator("#cmp-default .cap-compare-head");
    await expect(head.locator("[data-side='before']")).toContainText("Before");
    await expect(head.locator("[data-side='before']")).toContainText("Draft 3");
    await expect(head.locator("[data-side='before']")).toContainText("Dustin Edwards");
    await expect(head.locator("[data-side='before'] time")).toHaveAttribute("datetime", "2026-09-28T18:05:00.000Z");
    await expect(head.locator("[data-side='after']")).toContainText("After");
    await expect(head.locator("[data-side='after']")).toContainText("Draft 4");
    await expect(head.locator("[data-side='after'] time")).toHaveAttribute("datetime", "2026-09-29T07:42:00.000Z");
  });

  test("accessibility: the scroll regions are focusable and named", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const region = page.locator("#cmp-default").getByRole("region", { name: "Side by side, Compare Draft 3 with Draft 4" });
    await expect(region).toHaveAttribute("tabindex", "0");
    await region.focus();
    await expect(region).toBeFocused();
    // The views that are not shown are out of the accessibility tree.
    await expect(page.locator("#cmp-default").getByRole("region", { name: /^Inline,/ })).toHaveCount(0);
  });

  test("accessibility: the legend is always on the page, with the marks, the counts and the views explained", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const legend = page.locator("#cmp-default .cap-compare-legend");
    await expect(legend).toBeVisible();
    await expect(legend.getByText("Added", { exact: true })).toBeVisible();
    await expect(legend.getByText("Removed", { exact: true })).toBeVisible();
    await expect(legend.locator(".cap-compare-counts")).toHaveText("15 words added, 12 removed, 4 changes");
    for (const name of ["Side by side", "Inline", "Changes only"]) await expect(legend.locator("dt", { hasText: name })).toBeVisible();
  });

  test("accessibility: the no differences state is a status with both titles and times", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const status = page.locator("#cmp-none").getByRole("status").first();
    await expect(status).toContainText("No differences");
    await expect(status).toContainText("“Draft 3”");
    await expect(status).toContainText("“Draft 3, saved again”");
    await expect(status.locator("time")).toHaveCount(2);
    await expect(page.locator("#cmp-none").getByRole("radio")).toHaveCount(0);
  });

  test("keyboard: the arrow keys on the view switch choose the view", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const id = "cmp-default";
    await page.locator(`#${id}`).getByRole("radio", { name: "Side by side" }).focus();
    await expect(page.locator(view(id, "side"))).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(`#${id}`).getByRole("radio", { name: "Inline" })).toBeChecked();
    await expect(page.locator(view(id, "inline"))).toBeVisible();
    await expect(page.locator(view(id, "side"))).toBeHidden();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(view(id, "changes"))).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(view(id, "inline"))).toBeVisible();
  });

  test("keyboard: n and p move focus to the next and previous change and say which", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const id = "cmp-default";
    await page.locator(`#${id}`).getByRole("radio", { name: "Side by side" }).focus();
    await page.keyboard.press("n");
    expect(await focusedChange(page)).toBe("1");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("cmp-default-c1");
    await expect(page.locator(`#${id} [data-cap-part='live']`)).toHaveText(/^Change 1 of 4: \d+ words added, \d+ removed\.$/);
    await page.keyboard.press("n");
    expect(await focusedChange(page)).toBe("2");
    await page.keyboard.press("p");
    expect(await focusedChange(page)).toBe("1");
    await page.keyboard.press("p");
    expect(await focusedChange(page)).toBe("4");
    await page.keyboard.press("n");
    expect(await focusedChange(page)).toBe("1");
    await expect(page.locator(`${view(id, "side")} [data-change='1'][data-current]`)).toHaveCount(1);
    await expect(page.locator(`${view(id, "side")} [data-current]`)).toHaveCount(1);
    await expect(page.locator(`#${id} [data-jump='1']`)).toHaveAttribute("aria-current", "true");
  });

  test("keyboard: n and p follow the change into the view that is shown", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const id = "cmp-default";
    await page.locator(`#${id}`).getByRole("radio", { name: "Inline" }).check();
    await page.locator(`#${id}`).getByRole("radio", { name: "Inline" }).focus();
    await page.keyboard.press("n");
    await page.keyboard.press("n");
    const inside = await page.evaluate(() => document.activeElement?.closest(".cap-compare-view")?.getAttribute("data-view"));
    expect(inside).toBe("inline");
    expect(await focusedChange(page)).toBe("2");
  });

  test("keyboard: n and p do nothing while single-key shortcuts are off", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    await page.evaluate(() => {
      document.documentElement.dataset.capSingleKeys = "off";
    });
    await page.locator("#cmp-default").getByRole("radio", { name: "Side by side" }).focus();
    await page.keyboard.press("n");
    expect(await focusedChange(page)).toBe("none");
    await page.keyboard.press("p");
    expect(await focusedChange(page)).toBe("none");
  });

  test("keyboard: n and p do nothing when focus is outside the compare", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    await page.locator("h1").evaluate((h) => {
      h.setAttribute("tabindex", "-1");
      (h as HTMLElement).focus();
    });
    await page.keyboard.press("n");
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("H1");
  });

  test("keyboard: Enter on a jump link moves focus to that change", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const link = page.locator("#cmp-default").getByRole("link", { name: "Change 3 of 4" });
    await link.focus();
    await page.keyboard.press("Enter");
    expect(await focusedChange(page)).toBe("3");
    await expect(page.locator("#cmp-default [data-jump='3']")).toHaveAttribute("aria-current", "true");
    await expect(page.locator("#cmp-default [data-cap-part='live']")).toContainText("Change 3 of 4");
  });

  test("keyboard: Enter and Space on Next change and Previous change move between changes", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const next = page.locator("#cmp-default").getByRole("button", { name: /^Next change/ });
    const prev = page.locator("#cmp-default").getByRole("button", { name: /^Previous change/ });
    await next.focus();
    await page.keyboard.press("Enter");
    expect(await focusedChange(page)).toBe("1");
    await next.focus();
    await page.keyboard.press("Space");
    expect(await focusedChange(page)).toBe("2");
    await prev.focus();
    await page.keyboard.press("Enter");
    expect(await focusedChange(page)).toBe("1");
  });

  test("keyboard: Enter and Space on a folded passage's summary open and close it", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const fold = page.locator("#cmp-default .cap-compare-gap").first();
    const summary = fold.locator("summary");
    await summary.focus();
    await expect(fold).not.toHaveAttribute("open", "");
    await page.keyboard.press("Enter");
    await expect(fold).toHaveAttribute("open", "");
    await expect(fold.getByText("The address is shown in full, never shortened.").first()).toBeVisible();
    await page.keyboard.press("Space");
    await expect(fold).not.toHaveAttribute("open", "");
  });

  test("keyboard: Expand all unchanged opens every fold and, pressed again, closes them", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const all = page.locator("#cmp-default").getByRole("button", { name: /unchanged$/ });
    await all.focus();
    await page.keyboard.press("Enter");
    await expect(all).toHaveText("Collapse unchanged");
    await expect(all).toHaveAttribute("aria-pressed", "true");
    const closed = await page.locator("#cmp-default .cap-compare-view[data-view='side'] details.cap-compare-gap:not([open])").count();
    expect(closed).toBe(0);
    await page.keyboard.press("Space");
    await expect(all).toHaveText("Expand all unchanged");
    expect(await page.locator("#cmp-default .cap-compare-view[data-view='side'] details.cap-compare-gap[open]").count()).toBe(0);
  });

  test("keyboard: Tab reaches the view switch, the jump list and the scrolling region in order", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    await page.locator("#cmp-single").getByRole("radio", { name: "Side by side" }).focus();
    const seen: string[] = [];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      seen.push(await focused(page));
    }
    expect(seen[0]).toContain("Previous change");
    expect(seen[1]).toContain("Next change");
    expect(seen[2]).toContain("Change 1 of 1");
    expect(seen[3]).toContain("Side by side, Compare Draft 1 with Draft 2");
  });

  test("keyboard: the arrow keys and Page Down scroll the focused region", async ({ page }) => {
    await page.setViewportSize({ width: 340, height: 600 });
    await visitStates(page, "draft-compare", theme, "narrow");
    const region = page.getByRole("region", { name: /^Side by side,/ });
    const room = await region.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(room).toBeGreaterThan(50);
    await region.focus();
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => region.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    // Chrome drops a key that lands while the last key's smooth scroll is still settling (about
    // 1 run in 12), so wait until the offset has held still for 300ms before the next key.
    await region.evaluate(
      (el) =>
        new Promise<void>((done) => {
          let last = el.scrollTop;
          let since = performance.now();
          const tick = () => {
            if (el.scrollTop !== last) {
              last = el.scrollTop;
              since = performance.now();
            }
            if (performance.now() - since >= 300) done();
            else requestAnimationFrame(tick);
          };
          tick();
        }),
    );
    const after = await region.evaluate((el) => el.scrollTop);
    await page.keyboard.press("PageDown");
    await expect.poll(() => region.evaluate((el) => el.scrollTop)).toBeGreaterThan(after);
  });

  test("behaviour: all three views carry the same changes from the same data", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const count = (v: string, tag: string) => page.locator(`${view("cmp-default", v)} ${tag}`).count();
    const insInline = await count("inline", "ins");
    const delInline = await count("inline", "del");
    expect(insInline).toBeGreaterThan(0);
    expect(delInline).toBeGreaterThan(0);
    expect(await count("changes", "ins")).toBe(insInline);
    expect(await count("changes", "del")).toBe(delInline);
    // Side by side shows each once, on its own side.
    expect(await count("side", "ins")).toBe(insInline);
    expect(await count("side", "del")).toBe(delInline);
    for (const v of ["side", "inline", "changes"]) expect(await page.locator(`${view("cmp-default", v)} [data-change]`).count()).toBe(4);
  });

  test("behaviour: ids are unique, and the jump links point at the ones that exist", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const dup = await page.evaluate(() => {
      const seen = new Map<string, number>();
      for (const el of document.querySelectorAll("[id]")) seen.set(el.id, (seen.get(el.id) ?? 0) + 1);
      return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
    });
    expect(dup).toEqual([]);
    const hrefs = await page.locator("#cmp-default [data-jump]").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    for (const h of hrefs) expect(await page.locator(h as string).count()).toBe(1);
  });

  test("behaviour: unchanged passages are folded, with one sentence of context either side", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const side = view("cmp-default", "side");
    const fold = page.locator(`${side} details.cap-compare-gap`).first();
    await expect(fold.locator("summary")).toHaveText("7 unchanged sentences");
    // The sentence before the fold and the one after it stay in view.
    await expect(page.locator(side).getByText("Every mention keeps the address of the page that sent it.").first()).toBeVisible();
    await expect(page.locator(side).getByText("This draft covers the queue.").first()).toBeVisible();
    // What is inside is not shown until it is opened.
    await expect(page.locator(side).getByText("A mention from a new site is marked as new.").first()).toBeHidden();
    await fold.locator("summary").click();
    await expect(page.locator(side).getByText("A mention from a new site is marked as new.").first()).toBeVisible();
  });

  test("behaviour: the sides line up in rows, and each row's before and after share a top", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const rows = await page.locator(`${view("cmp-default", "side")} > .cap-compare-rows > .cap-compare-row`).evaluateAll((lis) =>
      lis.map((li) => {
        const b = li.querySelector("[data-side='before']")?.getBoundingClientRect();
        const a = li.querySelector("[data-side='after']")?.getBoundingClientRect();
        return b && a ? { sameTop: Math.abs(b.top - a.top) < 1, leftOf: b.left < a.left } : null;
      }),
    );
    expect(rows.length).toBeGreaterThan(5);
    for (const r of rows) {
      expect(r?.sameTop).toBe(true);
      expect(r?.leftOf).toBe(true);
    }
  });

  test("behaviour: a narrow container stacks the sides, before above after, each labelled", async ({ page }) => {
    await page.setViewportSize({ width: 340, height: 800 });
    await visitStates(page, "draft-compare", theme, "narrow");
    const row = page.locator(".cap-compare-row[data-op='change']").first();
    const before = row.locator("[data-side='before']");
    const after = row.locator("[data-side='after']");
    const b = await before.boundingBox();
    const a = await after.boundingBox();
    expect(b && a && a.y > b.y + b.height - 1).toBe(true);
    await expect(before.locator(".cap-compare-cell-label")).toBeVisible();
    await expect(before.locator(".cap-compare-cell-label")).toHaveText("Before");
    await expect(after.locator(".cap-compare-cell-label")).toHaveText("After");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test("behaviour: a wide container shows the sides beside each other with no cell labels", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    await expect(page.locator("#cmp-default .cap-compare-cell-label").first()).toBeHidden();
  });

  test("behaviour: an added or removed whole sentence leaves the other side empty, not blank text", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const row = page.locator(`${view("cmp-default", "side")} .cap-compare-row[data-op='ins']`).first();
    await expect(row.locator("[data-side='before']")).toHaveAttribute("data-empty", "");
    await expect(row.locator("[data-side='after'] ins")).toContainText("Every decision is written to the audit log.");
    const gone = page.locator(`${view("cmp-default", "side")} .cap-compare-row[data-op='del']`).first();
    await expect(gone.locator("[data-side='before'] del")).toContainText("A later post will cover the agent's notes.");
  });

  test("behaviour: the changes only view lists the changed sentences and says how many it left out", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const cards = page.locator("#cmp-changes .cap-compare-view[data-view='changes'] .cap-compare-card");
    await expect(cards).toHaveCount(4);
    await expect(page.locator("#cmp-changes .cap-compare-skip").first()).toContainText("unchanged sentence");
    await expect(page.locator("#cmp-changes .cap-compare-view[data-view='changes']")).toBeVisible();
    await expect(page.locator("#cmp-changes .cap-compare-view[data-view='side']")).toBeHidden();
  });

  test("behaviour: a single change reads as one change, singular", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    await expect(page.locator("#cmp-single .cap-compare-counts")).toHaveText("1 word added, 1 removed, 1 change");
    await expect(page.locator("#cmp-single").getByRole("link", { name: "Change 1 of 1" })).toBeVisible();
    // Nothing to fold when nothing is long enough to hide.
    await expect(page.locator("#cmp-single details")).toHaveCount(0);
    await expect(page.locator("#cmp-single").getByRole("button", { name: /unchanged$/ })).toBeHidden();
  });

  test("behaviour: authorship runs mark the sentences, and the authorship switch hides them", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const run = page.locator("#cmp-runs .cap-run[data-kind='ai']").first();
    await expect(run).toBeVisible();
    await expect(run.locator(".cap-run-label")).toHaveText("AI");
    await page.getByRole("switch", { name: "Show authorship" }).first().uncheck();
    await expect(run.locator(".cap-run-label")).toBeHidden();
  });

  test("behaviour: the chosen view is remembered", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const box = page.locator("#cmp-remember");
    await box.getByRole("radio", { name: "Changes only" }).check();
    await expect(box.locator(".cap-compare-view[data-view='changes']")).toBeVisible();
    await page.reload();
    await expect(box.getByRole("radio", { name: "Changes only" })).toBeChecked();
    await expect(box.locator(".cap-compare-view[data-view='changes']")).toBeVisible();
    await expect(box.locator(".cap-compare-view[data-view='side']")).toBeHidden();
  });

  test("behaviour: storage that throws does not break the compare", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("blocked");
        },
      });
    });
    await visitStates(page, "draft-compare", theme);
    const box = page.locator("#cmp-remember");
    await box.getByRole("radio", { name: "Inline" }).check();
    await expect(box.locator(".cap-compare-view[data-view='inline']")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("behaviour: the React wrapper keeps the view in the app's state", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const box = page.locator("#cmp-react");
    await expect(box.getByRole("radio", { name: "Inline" })).toBeChecked();
    await expect(box.locator(".cap-compare-view[data-view='inline']")).toBeVisible();
    await box.getByRole("radio", { name: "Changes only" }).check();
    await expect(page.locator("[data-view-chosen]")).toHaveAttribute("data-view-chosen", "changes");
    await expect(box.locator(".cap-compare-view[data-view='changes']")).toBeVisible();
    await box.getByRole("button", { name: /^Next change/ }).click();
    expect(await focusedChange(page)).toBe("1");
  });
});

test("behaviour: the delivered html holds every view, the legend and the counts, with no script", async ({ page }) => {
  const html = await (await page.request.get("components/draft-compare/states.html")).text();
  for (const v of ["side", "inline", "changes"]) expect(html).toContain(`data-view="${v}"`);
  expect(html).toContain("insertion start");
  expect(html).toContain("deletion end");
  expect(html).toContain("15 words added, 12 removed, 4 changes");
  expect(html).toContain("<strong>No differences.</strong>");
  expect(html).toContain("7 unchanged sentences");
  // A word changed inside a sentence: the after word is inserted and the before word deleted.
  expect(html).toMatch(/insertion start <\/span>newest/);
  expect(html).toMatch(/deletion start <\/span>oldest/);
  expect(html).toContain("Webmentions arrive as small notes from other sites.");
});

test.describe("without script", () => {
  test.use({ javaScriptEnabled: false });

  test("behaviour: the default view reads in full and the radios switch the view in CSS", async ({ page }) => {
    await page.goto("components/draft-compare/states.html?theme=light");
    const box = page.locator("#cmp-default");
    await expect(box.locator(".cap-compare-counts")).toHaveText("15 words added, 12 removed, 4 changes");
    await expect(box.locator(".cap-compare-view[data-view='side']")).toBeVisible();
    await expect(box.locator(".cap-compare-view[data-view='side']").getByText("Webmentions arrive as small notes from other sites.").first()).toBeVisible();
    await expect(box.locator(".cap-compare-view[data-view='inline']")).toBeHidden();
    await box.getByText("Inline", { exact: true }).first().click();
    await expect(box.locator(".cap-compare-view[data-view='inline']")).toBeVisible();
    await expect(box.locator(".cap-compare-view[data-view='side']")).toBeHidden();
    // The buttons that need script stay hidden; the links work as plain anchors.
    await expect(box.getByRole("button", { name: /^Next change/ })).toBeHidden();
    await expect(box.getByRole("link", { name: "Change 2 of 4" })).toHaveAttribute("href", "#cmp-default-c2");
  });
});

eachTheme((theme) => {
  test("accessibility: the patch's marks, numbers, path and counts reach their contrast", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    await expectContrast(page, [
      { sel: sel("cmp-patch", ".cap-patch-line[data-op='ins'] .cap-patch-code"), what: "an added line" },
      { sel: sel("cmp-patch", ".cap-patch-line[data-op='del'] .cap-patch-code"), what: "a removed line" },
      { sel: sel("cmp-patch", ".cap-patch-line[data-op='ins'] .cap-patch-sign"), what: "the plus" },
      { sel: sel("cmp-patch", ".cap-patch-line[data-op='del'] .cap-patch-sign"), what: "the minus" },
      { sel: sel("cmp-patch", ".cap-patch-line[data-op='same'] .cap-patch-no"), what: "a line number" },
      { sel: sel("cmp-patch", ".cap-patch-hunk-head th"), what: "a hunk header" },
      { sel: sel("cmp-patch", ".cap-patch-file-counts"), what: "a file's counts" },
      { sel: sel("cmp-patch", ".cap-patch-note"), what: "the binary-file note" },
      { sel: sel("cmp-patch", ".cap-compare-counts"), what: "the patch's counts" },
    ]);
  });

  test("keyboard: each file's lines scroll in a focusable, named region", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const region = page.locator("#cmp-patch .cap-patch-scroll").first();
    await expect(region).toHaveAttribute("tabindex", "0");
    await expect(region).toHaveAttribute("role", "region");
    await region.focus();
    await expect(region).toBeFocused();
    await expect(page.getByRole("region", { name: "app/queue.ts → app/queue.ts" }).or(page.getByRole("region", { name: "app/queue.ts" })).first()).toBeVisible();
  });

  test("behaviour: a changed line opens with a literal sign, and the numbers hold their side", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const added = page.locator("#cmp-patch .cap-patch-line[data-op='ins']").first();
    await expect(added.locator(".cap-patch-sign")).toContainText("+");
    const removed = page.locator("#cmp-patch .cap-patch-line[data-op='del']").first();
    await expect(removed.locator(".cap-patch-sign")).toContainText("−");
    // An added line has no old number; a removed line has no new number.
    await expect(added.locator(".cap-patch-no").first()).toHaveText("");
    await expect(removed.locator(".cap-patch-no").nth(1)).toHaveText("");
    await expect(page.locator("#cmp-patch-none")).toContainText("No changes.");
  });

  test("behaviour: a patch of two revisions names the thing once and says the revisions, not a rename", async ({ page }) => {
    await visitStates(page, "draft-compare", theme);
    const head = page.locator("#cmp-patch-rev .cap-patch-path");
    await expect(head.locator("code")).toHaveText("post-8f3a");
    await expect(head.locator(".cap-patch-kind")).toHaveText("v1 to v2");
    await expect(head).not.toContainText("→");
    await expect(page.locator("#cmp-patch-rev caption")).toHaveText("post-8f3a, 1 added, 1 removed");
  });
});
