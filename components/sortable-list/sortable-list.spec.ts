import { expect, test, type Locator, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, nextPost, visitStates } from "../../test/helpers.ts";

// The ids are the examples' own (examples.html): #scenes the enhanced rows, #reorder-form
// the list as delivered with no script; the React lists are named "Scenes in 02 Flood
// stage" (cards) and "Posts in the series" (rows in a form).
const list = (page: Page, name: string) => page.getByRole("list", { name });
const order = (l: Locator) => l.locator(":scope > li").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.value));
const focusedName = (page: Page) => page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
const said = (l: Locator) => l.locator("xpath=following-sibling::*[@data-cap-part='announce'][1]");

async function drag(page: Page, from: Locator, to: Locator, where: "top" | "bottom" | "right" = "bottom") {
  const a = (await from.boundingBox())!;
  const b = (await to.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  const x = where === "right" ? b.x + b.width - 4 : b.x + b.width / 2;
  const y = where === "top" ? b.y + 4 : where === "bottom" ? b.y + b.height - 4 : b.y + b.height / 2;
  await page.mouse.move(x, y, { steps: 8 });
}

eachTheme((theme) => {
  test.beforeEach(async ({ page }) => {
    await visitStates(page, "sortable-list", theme);
  });

  test("accessibility: no axe violations", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("accessibility: the label, the detail, the grip, the buttons and the item that is up reach their contrast", async ({ page }) => {
    await expectContrast(page, [
      { sel: "#scenes [data-value='tracks'] .cap-sortable-label", what: "an item's label" },
      { sel: "#scenes [data-value='tracks'] .cap-sortable-detail", what: "an item's detail" },
      { sel: "#scenes [data-value='tracks'] .cap-sortable-handle", what: "the grip", min: 3 },
      { sel: "#hover-handle", what: "the grip under the pointer", min: 3 },
      { sel: "#lifted-handle", what: "the grip of an item that is up", min: 3 },
      { sel: "#lifted-label", what: "the label of an item that is up" },
      { sel: "#lifted-detail", what: "the detail of an item that is up" },
      { sel: "#scenes [data-value='tracks'] [data-cap-part='up']", what: "Move up", min: 3 },
      { sel: "#scenes-out", what: "the order line" },
    ]);
  });

  test("accessibility: an item that is up is marked by more than its colour", async ({ page }) => {
    const shadow = (sel: string) => page.locator(sel).evaluate((el) => getComputedStyle(el).boxShadow);
    expect(await shadow("[aria-label='Lifted and dragged'] > li[data-lifted]")).toContain("inset");
    expect(await shadow("#scenes > li:first-child")).toBe("none");
  });

  test("accessibility: roles, names and states", async ({ page }) => {
    await expect(list(page, "Scenes in 01 The riverbed")).toMatchAriaSnapshot(`
      - list "Scenes in 01 The riverbed":
        - listitem:
          - button "Move Low water" [pressed=false]
          - text: Low water Ines, 2,140 words
          - button "Move Low water up" [disabled]
          - button "Move Low water down"
        - listitem:
          - button "Move Tracks in the limestone" [pressed=false]
          - text: Tracks in the limestone Wade, 2,610 words
          - button "Move Tracks in the limestone up"
          - button "Move Tracks in the limestone down"
        - listitem:
          - button "Move The ranger's notebook" [pressed=false]
          - text: /The ranger's notebook/
          - button "Move The ranger's notebook up"
          - button "Move The ranger's notebook down"
        - listitem:
          - button "Move Night at the crossing" [pressed=false]
          - text: /Night at the crossing/
          - button "Move Night at the crossing up"
          - button "Move Night at the crossing down" [disabled]
    `);
    await expect(page.getByRole("button", { name: "Move Low water", exact: true })).toHaveAccessibleDescription(/press Space or Enter on its handle/);
    await expect(list(page, "Scenes in 02 Flood stage").getByRole("button", { name: "Move Rain at Glen Rose", exact: true })).toHaveAccessibleDescription(/press Space or Enter on its handle/);
  });

  test("keyboard: Space picks an item up, the arrows move it, Space drops it, and each step is said", async ({ page }) => {
    const l = list(page, "Scenes in 01 The riverbed");
    const grip = page.getByRole("button", { name: "Move Low water", exact: true });
    await grip.focus();
    await page.keyboard.press("Space");
    await expect(grip).toHaveAttribute("aria-pressed", "true");
    await expect(said(l)).toHaveText("Picked up Low water. Position 1 of 4. Arrow keys move it, Space drops it, Escape puts it back.");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    expect(await order(l)).toEqual(["tracks", "notebook", "low-water", "crossing"]);
    await expect(said(l)).toHaveText("Low water: position 3 of 4.");
    expect(await focusedName(page), "the grip keeps focus as the item moves").toBe("Move Low water");
    await expect(page.locator("#scenes-out"), "nothing is reported until the drop").toHaveText("Order: low-water, tracks, notebook, crossing.");
    await page.keyboard.press("Space");
    await expect(grip).toHaveAttribute("aria-pressed", "false");
    await expect(said(l)).toHaveText("Dropped Low water at position 3 of 4.");
    await expect(page.locator("#scenes-out")).toHaveText("Order: tracks, notebook, low-water, crossing.");
  });

  test("keyboard: Enter picks up and drops too; Home and End go to the ends, Left and Up go back", async ({ page }) => {
    const l = list(page, "Scenes in 01 The riverbed");
    await page.getByRole("button", { name: "Move Tracks in the limestone", exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("End");
    expect(await order(l)).toEqual(["low-water", "notebook", "crossing", "tracks"]);
    await page.keyboard.press("ArrowLeft");
    expect(await order(l)).toEqual(["low-water", "notebook", "tracks", "crossing"]);
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowUp");
    expect(await order(l)).toEqual(["tracks", "low-water", "notebook", "crossing"]);
    await page.keyboard.press("Enter");
    await expect(page.locator("#scenes-out")).toHaveText("Order: tracks, low-water, notebook, crossing.");
  });

  test("keyboard: Escape puts the item back where it was, and nothing is reported", async ({ page }) => {
    const l = list(page, "Scenes in 01 The riverbed");
    await page.getByRole("button", { name: "Move The ranger's notebook", exact: true }).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Escape");
    expect(await order(l)).toEqual(["low-water", "tracks", "notebook", "crossing"]);
    await expect(said(l)).toHaveText("Put The ranger's notebook back at position 3 of 4.");
    await expect(page.locator("#scenes-out")).toHaveText("Order: low-water, tracks, notebook, crossing.");
  });

  test("keyboard: focus leaving the list while an item is up puts it back", async ({ page }) => {
    const l = list(page, "Scenes in 01 The riverbed");
    await page.getByRole("button", { name: "Move Night at the crossing", exact: true }).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("Home");
    await page.locator("#scenes-out").evaluate((el) => {
      el.tabIndex = -1;
    });
    await page.locator("#scenes-out").focus();
    expect(await order(l)).toEqual(["low-water", "tracks", "notebook", "crossing"]);
  });

  test("keyboard: Move up and Move down move at once, report the order, and keep focus on a button that still works", async ({ page }) => {
    const l = list(page, "Scenes in 01 The riverbed");
    await page.getByRole("button", { name: "Move Tracks in the limestone up" }).click();
    expect(await order(l)).toEqual(["tracks", "low-water", "notebook", "crossing"]);
    await expect(said(l)).toHaveText("Moved Tracks in the limestone to position 1 of 4.");
    await expect(page.locator("#scenes-out")).toHaveText("Order: tracks, low-water, notebook, crossing.");
    await expect(page.getByRole("button", { name: "Move Tracks in the limestone up" })).toBeDisabled();
    expect(await focusedName(page), "Move up stopped working at the top, so focus moved to Move down").toBe("Move Tracks in the limestone down");
    await page.keyboard.press("Enter");
    expect(await order(l)).toEqual(["low-water", "tracks", "notebook", "crossing"]);
    expect(await focusedName(page)).toBe("Move Tracks in the limestone down");
  });

  test("behaviour: dragging a grip moves the item as the pointer goes and reports the order on release", async ({ page }) => {
    const l = list(page, "Scenes in 01 The riverbed");
    await drag(page, page.getByRole("button", { name: "Move Low water", exact: true }), l.locator("[data-value='notebook']"), "bottom");
    await expect(l.locator("[data-value='low-water']")).toHaveAttribute("data-dragging", "");
    expect(await order(l)).toEqual(["tracks", "notebook", "low-water", "crossing"]);
    await expect(page.locator("#scenes-out")).toHaveText("Order: low-water, tracks, notebook, crossing.");
    await page.mouse.up();
    await expect(l.locator("[data-dragging]")).toHaveCount(0);
    await expect(page.locator("#scenes-out")).toHaveText("Order: tracks, notebook, low-water, crossing.");
    await expect(said(l)).toHaveText("Dropped Low water at position 3 of 4.");
  });

  test("behaviour: Escape during a drag puts the item back", async ({ page }) => {
    const l = list(page, "Scenes in 01 The riverbed");
    await drag(page, page.getByRole("button", { name: "Move Night at the crossing", exact: true }), l.locator("[data-value='low-water']"), "top");
    expect(await order(l)).toEqual(["crossing", "low-water", "tracks", "notebook"]);
    await page.keyboard.press("Escape");
    await page.mouse.up();
    expect(await order(l)).toEqual(["low-water", "tracks", "notebook", "crossing"]);
    await expect(page.locator("#scenes-out")).toHaveText("Order: low-water, tracks, notebook, crossing.");
  });

  test("behaviour: a host refuses a move by cancelling the event, and the item goes back", async ({ page }) => {
    const l = list(page, "Scenes in 01 The riverbed");
    await page.locator("#scenes").evaluate((el) => el.addEventListener("cap:sortable-change", (e) => e.preventDefault()));
    await page.getByRole("button", { name: "Move Low water down" }).click();
    expect(await order(l)).toEqual(["low-water", "tracks", "notebook", "crossing"]);
  });

  test("behaviour: cards move in reading order, by the arrows and by dragging across a row", async ({ page }) => {
    const l = list(page, "Scenes in 02 Flood stage");
    await l.getByRole("button", { name: "Move Rain at Glen Rose", exact: true }).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    expect(await focusedName(page)).toBe("Move Rain at Glen Rose");
    await page.keyboard.press("Space");
    await expect(page.locator("#cards-out")).toHaveText("Order: second, line, rain, after.");
    await drag(page, l.getByRole("button", { name: "Move After the water", exact: true }), l.locator("[data-value='second']"), "right");
    await page.mouse.up();
    await expect(page.locator("#cards-out")).toHaveText("Order: second, after, line, rain.");
  });

  test("behaviour: the React rows move by button and keep focus", async ({ page }) => {
    const l = list(page, "Posts in the series");
    await l.getByRole("button", { name: "Move What the river keeps down" }).click();
    await expect(page.locator("#rows-out")).toHaveText("Order: trackway, casts, river.");
    expect(await focusedName(page), "Move down is disabled at the end, so focus is on Move up").toBe("Move What the river keeps up");
    await expect(said(l)).toHaveText("Moved What the river keeps to position 3 of 3.");
  });

  test("behaviour: with no script the buttons post the move and the list posts its order", async ({ page }) => {
    const form = "#reorder-form";
    const plain = list(page, "Posts in Field notes from the Paluxy");
    let posted = nextPost(page, form);
    await plain.getByRole("button", { name: "Move Reading a trackway down" }).click();
    expect((await posted).fields).toEqual({ down: ["fn-1"], order: ["fn-1", "fn-2"] });
    posted = nextPost(page, form);
    await page.getByRole("button", { name: "Save order" }).click();
    expect((await posted).fields).toEqual({ intent: ["save-order"], order: ["fn-1", "fn-2"] });
    await expect(plain.getByRole("button", { name: "Move Reading a trackway up" })).toBeDisabled();
    // The React list in a form renders the same fields.
    await expect(page.locator("[data-mount='rows'] input[type='hidden'][name='order']")).toHaveCount(3);
    await expect(list(page, "Posts in the series").getByRole("button", { name: "Move Reading a trackway down" })).toHaveAttribute("type", "submit");
  });
});
