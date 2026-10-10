import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// The ids are the examples' own (examples.html): #binder the movable binder, #export the
// multi-select tree, #st-* the forced row states; the React tree is named "Series".
const row = (page: Page, tree: string, name: string | RegExp) => page.getByRole("tree", { name: tree }).getByRole("treeitem", { name });
const focusedText = (page: Page) => page.evaluate(() => document.activeElement?.querySelector(".cap-tree-label")?.textContent ?? "");
const labels = (page: Page, list: string) => page.locator(`${list} > li > .cap-tree-row .cap-tree-label`).allTextContents();
const announce = (page: Page, tree: string) => page.locator(`${tree} ~ [data-cap-part='announce'], ${tree} + [data-cap-part='announce']`).first();

// Records the events a tree emits.
async function record(page: Page, sel: string, type: string) {
  await page.locator(sel).evaluate((el, t) => {
    const w = window as unknown as Record<string, unknown[]>;
    w[t] = [];
    el.addEventListener(t, (e) => w[t]!.push((e as CustomEvent).detail));
  }, type);
  return () => page.evaluate((t) => (window as unknown as Record<string, unknown[]>)[t], type);
}

eachTheme((theme) => {
  test.beforeEach(async ({ page }) => {
    await visitStates(page, "tree", theme);
  });

  test("accessibility: no axe violations", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("accessibility: a row, its note, a status, a chosen row, a row not available and the focus ring reach their contrast", async ({ page }) => {
    await expectContrast(page, [
      { sel: "#binder [data-value='notes'] .cap-tree-label", what: "a row" },
      { sel: "#binder [data-value='book'] .cap-tree-meta", what: "the note at the end" },
      { sel: "#binder [data-value='ch-01/01'] .cap-status", what: "a status in the note, on the chosen tint" },
      { sel: "#st-chosen .cap-tree-label", what: "a chosen row" },
      { sel: "#st-hover .cap-tree-label", what: "a row under the pointer" },
      { sel: "#st-inside .cap-tree-label", what: "a branch a drop lands in" },
      { sel: "#st-disabled .cap-tree-label", what: "a row not available", min: 3 },
      { sel: "#st-focus", what: "the focus ring", part: "outline" },
      { sel: "#st-inside .cap-tree-toggle", what: "the chevron", min: 3 },
    ]);
  });

  test("accessibility: chosen is marked by more than its colour, and a drop by a line or a ring", async ({ page }) => {
    const css = (sel: string, prop: string, pseudo?: string) => page.locator(sel).evaluate((el, [p, ps]) => getComputedStyle(el, ps ?? null).getPropertyValue(p!), [prop, pseudo] as const);
    expect(await css("#st-chosen", "box-shadow")).not.toBe("none");
    expect(await css("#st-hover", "box-shadow")).toBe("none");
    expect(await css("#st-before", "height", "::after")).toBe("2px");
    expect(await css("#st-after", "height", "::after")).toBe("2px");
    expect(await css("#st-inside", "border-top-width", "::after")).toBe("2px");
  });

  test("accessibility: roles, levels, names and states", async ({ page }) => {
    await expect(page.getByRole("tree", { name: "Paluxy Portal binder" })).toMatchAriaSnapshot(`
      - tree "Paluxy Portal binder":
        - treeitem "Paluxy Portal 18,420 words"
        - treeitem /01 The riverbed/ [expanded]:
          - group:
            - treeitem /01 Low water/ [selected]
            - treeitem /02 Tracks in the limestone/
            - treeitem /03 The ranger's notebook/
        - treeitem /02 Flood stage/ [expanded]:
          - group:
            - treeitem /01 Rain at Glen Rose/
            - treeitem /02 The second set/
        - treeitem /03 Untitled chapter/ [expanded]
        - treeitem "Bible"
        - treeitem "Notes"
    `);
    await expect(row(page, "Paluxy Portal binder", /Low water/)).toHaveAttribute("aria-level", "2");
    await expect(row(page, "Paluxy Portal binder", /Low water/)).toHaveAttribute("aria-posinset", "1");
    await expect(row(page, "Paluxy Portal binder", /Low water/)).toHaveAttribute("aria-setsize", "3");
    await expect(row(page, "Paluxy Portal binder", "Bible")).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("tree", { name: "Sections to export" })).toHaveAttribute("aria-multiselectable", "true");
    await expect(row(page, "Sections to export", /01 The riverbed/)).toHaveAttribute("aria-disabled", "true");
    // With no script there is no tree at all: lists and links.
    const plain = page.getByRole("navigation", { name: "Binder, no script" });
    await expect(plain.getByRole("tree")).toHaveCount(0);
    await expect(plain.getByRole("link")).toHaveCount(4);
    await expect(plain.getByRole("listitem")).toHaveCount(4);
  });

  test("keyboard: one tab stop, on the chosen row", async ({ page }) => {
    await page.getByRole("heading", { name: /A book's binder/ }).click();
    await page.keyboard.press("Tab");
    expect(await focusedText(page)).toBe("01 Low water");
    await expect(page.locator("#binder [tabindex='0']")).toHaveCount(1);
  });

  test("keyboard: Down and Up move between visible rows, Home and End go to the ends", async ({ page }) => {
    await row(page, "Paluxy Portal binder", /Low water/).focus();
    await page.keyboard.press("ArrowDown");
    expect(await focusedText(page)).toBe("02 Tracks in the limestone");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    expect(await focusedText(page)).toBe("01 The riverbed");
    await page.keyboard.press("End");
    expect(await focusedText(page), "the closed Bible's children are skipped").toBe("Notes");
    await page.keyboard.press("Home");
    expect(await focusedText(page)).toBe("Paluxy Portal");
  });

  test("keyboard: Right opens a closed branch then goes to its first child; Left closes it then goes to the parent", async ({ page }) => {
    const bible = row(page, "Paluxy Portal binder", "Bible");
    await bible.focus();
    await page.keyboard.press("ArrowRight");
    await expect(bible).toHaveAttribute("aria-expanded", "true");
    expect(await focusedText(page)).toBe("Bible");
    await page.keyboard.press("ArrowRight");
    expect(await focusedText(page)).toBe("Characters");
    await page.keyboard.press("ArrowLeft");
    expect(await focusedText(page)).toBe("Bible");
    await page.keyboard.press("ArrowLeft");
    await expect(bible).toHaveAttribute("aria-expanded", "false");
    await expect(row(page, "Paluxy Portal binder", "Characters")).toBeHidden();
  });

  test("keyboard: * opens every branch beside the current one", async ({ page }) => {
    await row(page, "Paluxy Portal binder", "Bible").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("*");
    await expect(row(page, "Paluxy Portal binder", "Characters")).toHaveAttribute("aria-expanded", "true");
    await expect(row(page, "Paluxy Portal binder", "Places")).toHaveAttribute("aria-expanded", "true");
    await expect(row(page, "Paluxy Portal binder", "The Paluxy crossing")).toBeVisible();
  });

  test("keyboard: typing letters goes to the next row that starts with them", async ({ page }) => {
    await row(page, "Paluxy Portal binder", "Paluxy Portal 18,420 words").focus();
    await page.keyboard.press("n");
    expect(await focusedText(page)).toBe("Notes");
    await page.waitForTimeout(800);
    await page.keyboard.type("02 f");
    expect(await focusedText(page)).toBe("02 Flood stage");
  });

  test("keyboard: Enter on a link row follows it and chooses it; Space chooses a row", async ({ page }) => {
    const selects = await record(page, "#binder", "cap:tree-select");
    await row(page, "Paluxy Portal binder", /Low water/).focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#ch-01-02$/);
    await expect(row(page, "Paluxy Portal binder", /Tracks/)).toHaveAttribute("aria-selected", "true");
    await expect(row(page, "Paluxy Portal binder", /Low water/)).toHaveAttribute("aria-selected", "false");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    await expect(row(page, "Paluxy Portal binder", /notebook/)).toHaveAttribute("aria-selected", "true");
    expect(((await selects()) ?? []).map((d) => (d as { id: string }).id)).toEqual(["ch-01/02", "ch-01/03"]);
  });

  test("keyboard: in a tree with several chosen, Space adds and removes, and a row not available is never chosen", async ({ page }) => {
    const out = page.locator("#export-out");
    await row(page, "Sections to export", "Title page").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    await expect(out).toHaveText("Chosen: front/title, body, front/dedication.");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Space");
    await expect(out).toHaveText("Chosen: body, front/dedication.");
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowUp");
    expect(await focusedText(page), "a row not available still takes focus").toBe("01 The riverbed");
    await page.keyboard.press("Space");
    await expect(out).toHaveText("Chosen: body, front/dedication.");
  });

  test("keyboard: Alt with Up and Down moves a row among its siblings, says so and reports it", async ({ page }) => {
    const moves = await record(page, "#binder", "cap:tree-move");
    await row(page, "Paluxy Portal binder", /Tracks/).focus();
    await page.keyboard.press("Alt+ArrowUp");
    expect(await labels(page, "#binder [data-value='ch-01'] > .cap-tree-group")).toEqual(["02 Tracks in the limestone", "01 Low water", "03 The ranger's notebook"]);
    expect(await focusedText(page), "focus stays on the moved row").toBe("02 Tracks in the limestone");
    await expect(announce(page, "#binder")).toHaveText("Moved 02 Tracks in the limestone to position 1 of 3 in 01 The riverbed.");
    await expect(page.locator("#binder-out")).toHaveText("Moved ch-01/02 to ch-01, position 1.");
    await page.keyboard.press("Alt+ArrowUp");
    await expect(announce(page, "#binder")).toHaveText("02 Tracks in the limestone is already first here.");
    await page.keyboard.press("Alt+ArrowDown");
    expect(await labels(page, "#binder [data-value='ch-01'] > .cap-tree-group")).toEqual(["01 Low water", "02 Tracks in the limestone", "03 The ranger's notebook"]);
    expect(await moves()).toEqual([
      { id: "ch-01/02", from: { parent: "ch-01", index: 1 }, to: { parent: "ch-01", index: 0 } },
      { id: "ch-01/02", from: { parent: "ch-01", index: 0 }, to: { parent: "ch-01", index: 1 } },
    ]);
  });

  test("keyboard: Alt with Right moves a row into the branch above it; Alt with Left moves it back out", async ({ page }) => {
    await row(page, "Paluxy Portal binder", /^Paluxy Portal/).focus();
    await page.keyboard.press("Alt+ArrowRight");
    await expect(announce(page, "#binder")).toHaveText("Paluxy Portal cannot go in: there is no branch just above it.");
    await row(page, "Paluxy Portal binder", /Rain at Glen Rose/).focus();
    await page.keyboard.press("Alt+ArrowLeft");
    expect(await labels(page, "#binder")).toEqual(["Paluxy Portal", "01 The riverbed", "02 Flood stage", "01 Rain at Glen Rose", "03 Untitled chapter", "Bible", "Notes"]);
    await expect(row(page, "Paluxy Portal binder", /Rain at Glen Rose/)).toHaveAttribute("aria-level", "1");
    await page.keyboard.press("Alt+ArrowRight");
    await expect(announce(page, "#binder")).toHaveText("Moved 01 Rain at Glen Rose to position 2 of 2 in 02 Flood stage.");
    // Into the empty chapter: Down past it, then in.
    await page.keyboard.press("Alt+ArrowLeft");
    await page.keyboard.press("Alt+ArrowDown");
    await page.keyboard.press("Alt+ArrowRight");
    await expect(announce(page, "#binder")).toHaveText("Moved 01 Rain at Glen Rose to position 1 of 1 in 03 Untitled chapter.");
    await expect(row(page, "Paluxy Portal binder", /Untitled chapter/)).toHaveAttribute("aria-expanded", "true");
    expect(await focusedText(page)).toBe("01 Rain at Glen Rose");
  });

  test("behaviour: a host refuses a move by cancelling the event, and nothing moves", async ({ page }) => {
    await page.locator("#binder").evaluate((el) => el.addEventListener("cap:tree-move", (e) => e.preventDefault()));
    await row(page, "Paluxy Portal binder", /Tracks/).focus();
    await page.keyboard.press("Alt+ArrowUp");
    expect(await labels(page, "#binder [data-value='ch-01'] > .cap-tree-group")).toEqual(["01 Low water", "02 Tracks in the limestone", "03 The ranger's notebook"]);
  });

  test("behaviour: the chevron opens and closes; a click on the row chooses it", async ({ page }) => {
    const ch = row(page, "Paluxy Portal binder", /01 The riverbed/);
    await ch.locator(".cap-tree-toggle").click();
    await expect(ch).toHaveAttribute("aria-expanded", "false");
    await expect(page, "the chevron is not the link").not.toHaveURL(/#ch-01$/);
    await expect(row(page, "Paluxy Portal binder", /Low water/)).toBeHidden();
    await ch.locator(".cap-tree-toggle").click();
    await expect(ch).toHaveAttribute("aria-expanded", "true");
    await row(page, "Paluxy Portal binder", "Notes").click();
    await expect(row(page, "Paluxy Portal binder", "Notes")).toHaveAttribute("aria-selected", "true");
    await expect(row(page, "Paluxy Portal binder", /Low water/)).toHaveAttribute("aria-selected", "false");
  });

  test("behaviour: dragging a row shows where it lands and moves it there; the release does not follow the link", async ({ page }) => {
    const from = row(page, "Paluxy Portal binder", /ranger's notebook/);
    const before = row(page, "Paluxy Portal binder", /Low water/);
    const a = (await from.boundingBox())!;
    const b = (await before.boundingBox())!;
    await page.mouse.move(a.x + 40, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + 40, b.y + 3, { steps: 6 });
    await expect(before).toHaveAttribute("data-drop", "before");
    await expect(from).toHaveAttribute("data-dragging", "");
    await page.mouse.up();
    expect(await labels(page, "#binder [data-value='ch-01'] > .cap-tree-group")).toEqual(["03 The ranger's notebook", "01 Low water", "02 Tracks in the limestone"]);
    await expect(page.locator("#binder [data-drop]")).toHaveCount(0);
    await expect(page).not.toHaveURL(/#ch-01-03$/);
  });

  test("behaviour: dropping in the middle of a branch puts the row inside it, at the end", async ({ page }) => {
    const from = row(page, "Paluxy Portal binder", "Notes");
    const into = row(page, "Paluxy Portal binder", /02 Flood stage/);
    const a = (await from.boundingBox())!;
    const b = (await into.boundingBox())!;
    await page.mouse.move(a.x + 40, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + 40, b.y + b.height / 2, { steps: 6 });
    await expect(into).toHaveAttribute("data-drop", "inside");
    await page.mouse.up();
    expect(await labels(page, "#binder [data-value='ch-02'] > .cap-tree-group")).toEqual(["01 Rain at Glen Rose", "02 The second set", "Notes"]);
  });

  test("behaviour: Escape during a drag puts the row back, and a row never drops inside itself", async ({ page }) => {
    const from = row(page, "Paluxy Portal binder", /01 The riverbed/);
    const child = row(page, "Paluxy Portal binder", /Tracks/);
    const a = (await from.boundingBox())!;
    const c = (await child.boundingBox())!;
    await page.mouse.move(a.x + 60, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(c.x + 60, c.y + 3, { steps: 6 });
    await expect(page.locator("#binder [data-drop]"), "no drop under itself").toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await expect(announce(page, "#binder")).toHaveText("Put 01 The riverbed back.");
    expect(await labels(page, "#binder")).toEqual(["Paluxy Portal", "01 The riverbed", "02 Flood stage", "03 Untitled chapter", "Bible", "Notes"]);
  });

  test("behaviour: the React tree moves by key, refuses a move to the top level, and hands the page the new tree", async ({ page }) => {
    const out = page.locator("#series-out");
    await row(page, "Series", "What the river keeps").focus();
    await page.keyboard.press("Alt+ArrowDown");
    await expect(out).toContainText("Field notes from the Paluxy: Reading a trackway, Casts, molds and mistakes, What the river keeps.");
    expect(await focusedText(page)).toBe("What the river keeps");
    await page.keyboard.press("Alt+ArrowLeft");
    await expect(page.locator("[data-mount='react'] [data-cap-part='announce']")).toHaveText("What the river keeps is already at the top level.");
    await expect(out).toContainText("Casts, molds and mistakes, What the river keeps.");
    // Into Lab notebook, by dragging onto its middle.
    const b = (await row(page, "Series", "Lab notebook").boundingBox())!;
    const a = (await row(page, "Series", "What the river keeps").boundingBox())!;
    await page.mouse.move(a.x + 40, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + 40, b.y + b.height / 2, { steps: 6 });
    await expect(row(page, "Series", "Lab notebook")).toHaveAttribute("data-drop", "inside");
    await page.mouse.up();
    await expect(out).toContainText("Lab notebook: Phage plaques at 37 degrees, When a control fails, What the river keeps.");
  });

  test("keyboard: the React tree follows the same keys", async ({ page }) => {
    await row(page, "Series", "What the river keeps").focus();
    await page.keyboard.press("ArrowLeft");
    expect(await focusedText(page)).toBe("Field notes from the Paluxy");
    await page.keyboard.press("ArrowLeft");
    await expect(row(page, "Series", "Field notes from the Paluxy")).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("ArrowDown");
    expect(await focusedText(page)).toBe("Lab notebook");
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowRight");
    await expect(row(page, "Series", "Loose posts")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Home");
    await page.keyboard.press("Space");
    await expect(row(page, "Series", "Field notes from the Paluxy")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("[data-mount='react'] [tabindex='0']")).toHaveCount(1);
  });
});
