import { expect, test, type Locator, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates, type Theme } from "../../test/helpers.ts";
import { AUTOSAVE_MS, applyBulkTag, altStateOf, bands, byteSize, copySnippets, createAutosave, flagsFor, nextTile, parseTags, suggestedAlt } from "./media.ts";

const FOX = "foxhound-hero.jpg";
const UPTIME = "uptime-strip.png";

const tile = (page: Page, name: string): Locator => page.locator(`.cap-media-tile[data-label="${name}"]`);
const link = (page: Page, name: string): Locator => tile(page, name).locator(".cap-media-open");
const inspector = (page: Page): Locator => page.locator("dialog.cap-media-inspector");
const alt = (page: Page): Locator => inspector(page).getByLabel("Alt text");
const saveStatus = (page: Page): Locator => inspector(page).locator("[data-cap-part='save-status']");
const library = (page: Page, theme: Theme, only = "library") => visitStates(page, "media", theme, only);

// ---------------------------------------------------------------------------------------
// The pure parts run in node.

test("behaviour: the grid's arrow keys read rendered rows, wrap in reading order and stop at the edges", () => {
  const boxes = [
    { id: "a", top: 0, left: 0, width: 100 },
    { id: "b", top: 0, left: 110, width: 100 },
    { id: "c", top: 0, left: 220, width: 100 },
    { id: "d", top: 120, left: 0, width: 100 },
    { id: "e", top: 120, left: 110, width: 100 },
    { id: "z", top: 120, left: 220, width: 0 }, // not laid out
  ];
  const rows = bands(boxes);
  expect(rows.map((r) => r.items.map((i) => i.id))).toEqual([["a", "b", "c"], ["d", "e"]]);
  expect(nextTile(rows, "a", "right")).toBe("b");
  expect(nextTile(rows, "c", "right")).toBe("d");
  expect(nextTile(rows, "d", "left")).toBe("c");
  expect(nextTile(rows, "a", "left")).toBeNull();
  expect(nextTile(rows, "c", "down")).toBe("e");
  expect(nextTile(rows, "e", "up")).toBe("b");
  expect(nextTile(rows, "a", "up")).toBeNull();
  expect(nextTile(rows, "e", "down")).toBeNull();
  expect(nextTile(rows, "c", "first")).toBe("a");
  expect(nextTile(rows, "a", "last")).toBe("e");
  expect(nextTile(rows, "b", "next")).toBe("c");
  expect(nextTile(rows, "a", "prev")).toBeNull();
  expect(nextTile(rows, "", "down")).toBe("a");
  expect(nextTile(rows, "gone", "left")).toBe("a");
});

test("behaviour: alt text has three states, and decorative is a choice that missing is not", () => {
  expect(altStateOf("", false)).toBe("missing");
  expect(altStateOf("   ", false)).toBe("missing");
  expect(altStateOf("A dashboard", false)).toBe("set");
  expect(altStateOf("", true)).toBe("decorative");
  expect(altStateOf("kept but ignored", true)).toBe("decorative");
  const base = { kind: "image" as const, used: [{ title: "x", href: "/x" }], state: "ready" as const };
  expect(flagsFor({ ...base, altState: "missing" }).map((f) => f.word)).toEqual(["No alt text"]);
  expect(flagsFor({ ...base, altState: "decorative" }).map((f) => f.word)).toEqual(["Decorative"]);
  expect(flagsFor({ ...base, altState: "set", used: [] }).map((f) => f.word)).toEqual(["Unattached"]);
  expect(flagsFor({ ...base, altState: "set", state: "binned" }).map((f) => f.word)).toEqual(["In the bin"]);
  expect(flagsFor({ kind: "document", altState: "missing", used: [], state: "ready" }).map((f) => f.word)).toEqual(["Unattached"]);
});

test("behaviour: sizes, suggested alt text, tags and the copy snippets", () => {
  expect(byteSize(512)).toBe("512 B");
  expect(byteSize(421888)).toBe("412 kB");
  expect(byteSize(2516582)).toBe("2.4 MB");
  expect(suggestedAlt("foxhound-hero_v2.jpg")).toBe("foxhound hero v2");
  expect(parseTags(" Release, foxhound,release,, ")).toEqual(["release", "foxhound"]);
  const img = copySnippets({ url: "https://x.test/a.png", kind: "image", alt: "A dashboard", name: "a.png" });
  expect(img.map((s) => s.value)).toEqual(["https://x.test/a.png", "![A dashboard](https://x.test/a.png)", '<img src="https://x.test/a.png" alt="A dashboard">']);
  const doc = copySnippets({ url: "https://x.test/r.pdf", kind: "document", alt: "", name: "uptime-report.pdf" });
  expect(doc[1]?.value).toBe("[uptime report](https://x.test/r.pdf)");
});

test("behaviour: autosave waits 800 ms of quiet, saves once, and saves a change made while saving", async () => {
  expect(AUTOSAVE_MS).toBe(800);
  const log: string[] = [];
  let release: () => void = () => undefined;
  let calls = 0;
  const a = createAutosave({
    delay: 20,
    save: () => {
      calls += 1;
      return new Promise<void>((r) => (release = r));
    },
    onState: (s) => log.push(s),
  });
  a.schedule();
  a.schedule();
  expect(log).toEqual(["dirty", "dirty"]);
  await new Promise((r) => setTimeout(r, 60));
  expect(calls).toBe(1);
  expect(a.state()).toBe("saving");
  a.schedule(); // typed during the save
  release();
  await new Promise((r) => setTimeout(r, 80));
  expect(calls).toBe(2);
  release();
  await new Promise((r) => setTimeout(r, 10));
  expect(a.state()).toBe("saved");
});

test("behaviour: autosave that fails says so with the reason, and Retry saves again", async () => {
  let ok = false;
  const states: Array<[string, string | undefined]> = [];
  const a = createAutosave({
    delay: 5,
    save: () => (ok ? Promise.resolve() : Promise.reject(new Error("The server answered 502."))),
    onState: (s, e) => states.push([s, e]),
  });
  a.schedule();
  await a.flush();
  await new Promise((r) => setTimeout(r, 30));
  expect(a.state()).toBe("failed");
  expect(states.at(-1)).toEqual(["failed", "The server answered 502."]);
  ok = true;
  await a.retry();
  expect(a.state()).toBe("saved");
});

test("behaviour: a bulk tag skips what already has it, records a failure and carries on", async () => {
  const tags: Record<string, string[]> = { a: [], b: ["x"], c: [] };
  const r = await applyBulkTag<string>({
    ids: ["a", "b", "c", "gone"],
    wanted: "x",
    adding: true,
    missing: "no longer there",
    read: async (id) => (id in tags ? { item: id, tags: tags[id] ?? [] } : null),
    write: async (id, _item, next) => {
      if (id === "c") throw new Error("write refused");
      tags[id] = next;
    },
  });
  expect(r.done).toEqual(["a"]);
  expect(r.skipped).toEqual(["b"]);
  expect(r.failed).toEqual(["c: write refused", "gone: no longer there"]);
});

eachTheme((theme) => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  // -------------------------------------------------------------------------------------
  // accessibility

  test("accessibility: no axe violations on the states page", async ({ page }) => {
    await visitStates(page, "media", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations in the library, the sheet and the empty library", async ({ page }) => {
    for (const only of ["library", "sheet", "empty"]) {
      await library(page, theme, only);
      await expectNoAxeViolations(page);
    }
  });

  test("accessibility: no axe violations at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await library(page, theme, "sheet");
    await expectNoAxeViolations(page);
  });

  test("accessibility: tile text, flags and the selected check reach their contrast", async ({ page }) => {
    await visitStates(page, "media", theme);
    await expectContrast(page, [
      { sel: "#t-foxhound-hero .cap-media-name", what: "a tile's name" },
      { sel: "#t-foxhound-hero .cap-media-meta", what: "a tile's type and size" },
      { sel: "#t-uptime-strip .cap-status", what: "the No alt text status" },
      { sel: "#t-germomics-tree .cap-status", what: "the Decorative status" },
      { sel: "#t-fieldnotes-migration .cap-status", what: "the Unattached status" },
      { sel: "#t-old-logo .cap-status", what: "the In the bin status" },
      { sel: "#t-mention-queue .cap-media-name", what: "a selected tile's name on its tint" },
      { sel: "#t-mention-queue .cap-media-check-word", what: "the word Selected" },
      { sel: "#t-mention-queue .cap-media-check-box", what: "the check box's edge", part: "border" },
      { sel: "#t-capsid-walkthrough .cap-meter-label", what: "the uploading label" },
      { sel: "#t-capsid-walkthrough .cap-meter-value", what: "the uploading percentage" },
      { sel: "#t-scan-0042 .cap-media-state-lead", what: "the upload failed lead" },
      { sel: "#t-scan-0042 .cap-media-reason", what: "the failure reason" },
      { sel: "#t-uptime-report-september .cap-media-doc", what: "a document tile's type" },
    ]);
  });

  test("accessibility: the inspector's labels, help, facts, links and save statuses reach their contrast", async ({ page }) => {
    await visitStates(page, "media", theme);
    await expectContrast(page, [
      { sel: "#ins-static-ins .cap-dialog-title", what: "the file name" },
      { sel: "#ins-static-ins .cap-dialog-description", what: "the type and size line" },
      { sel: "#ins-static-ins .cap-field-label", what: "a field label" },
      { sel: "#ins-static-ins .cap-field-help", what: "a field's help" },
      { sel: "#ins-static-ins .cap-media-facts dt", what: "a fact's name" },
      { sel: "#ins-static-ins .cap-media-facts dd", what: "a fact's value" },
      { sel: "#ins-static-ins .cap-media-used a", what: "a used-in link" },
      { sel: "#ins-static-ins .cap-media-used-how", what: "how a post uses it" },
      { sel: "#ins-unused .cap-media-used-empty", what: "Not used anywhere" },
      { sel: "#ins-unused .cap-media-note", what: "the unattached explanation" },
      { sel: "#ins-static-ins textarea", what: "the alt text field's edge", part: "border" },
      { sel: "#save-idle [role=status]", what: "the idle save status" },
      { sel: "#save-dirty [role=status]", what: "the unsaved status" },
      { sel: "#save-saving [role=status]", what: "the saving status" },
      { sel: "#save-saved [role=status]", what: "the saved status" },
      { sel: "#save-failed [role=alert]", what: "the could not save alert" },
    ]);
  });

  test("accessibility: each tile is one named link, a named checkbox and its states in words", async ({ page }) => {
    await visitStates(page, "media", theme);
    await expect(page.locator("#t-foxhound-hero")).toMatchAriaSnapshot(`
      - listitem:
        - link "foxhound-hero.jpg JPEG · 412 kB"
        - checkbox "Select foxhound-hero.jpg"
    `);
    await expect(page.locator("#t-mention-queue")).toMatchAriaSnapshot(`
      - listitem:
        - link "mention-queue.png PNG · 203 kB"
        - checkbox "Select mention-queue.png" [checked]
    `);
    await expect(page.locator("#t-uptime-strip")).toMatchAriaSnapshot(`
      - listitem:
        - link "uptime-strip.png PNG · 96 kB"
        - text: No alt text
        - checkbox "Select uptime-strip.png"
    `);
    await expect(link(page, UPTIME).first()).toHaveAccessibleDescription("No alt text");
    await expect(page.locator("#t-germomics-tree .cap-status")).toHaveText("Decorative");
    await expect(page.locator("#t-uptime-strip .cap-status")).toHaveText("No alt text");
  });

  test("accessibility: an uploading tile is a progress bar named Uploading; a failed one names its reason and Retry", async ({ page }) => {
    await visitStates(page, "media", theme);
    const bar = page.locator("#t-capsid-walkthrough").getByRole("progressbar", { name: "Uploading" });
    await expect(bar).toHaveAttribute("aria-valuenow", "62");
    await expect(bar).toHaveAttribute("aria-valuetext", "62 percent of capsid-walkthrough.png uploaded");
    await expect(page.locator("#t-capsid-walkthrough .cap-media-open")).toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#t-scan-0042")).toContainText("Upload failed");
    await expect(page.locator("#t-scan-0042")).toContainText("The file is 6 MB and the limit is 5 MB.");
    await expect(page.locator("#t-scan-0042").getByRole("button", { name: "Retry uploading scan-0042.png" })).toBeVisible();
    await expect(page.locator("#t-old-logo").getByRole("button", { name: "Restore old-logo.png" })).toBeVisible();
  });

  test("accessibility: thumbnails reserve their space and load lazily", async ({ page }) => {
    await visitStates(page, "media", theme);
    const img = page.locator("#t-foxhound-hero img");
    await expect(img).toHaveAttribute("loading", "lazy");
    await expect(img).toHaveAttribute("width", "320");
    await expect(img).toHaveAttribute("height", "320");
    const box = await page.locator("#t-foxhound-hero .cap-media-thumb").boundingBox();
    expect(Math.abs((box?.width ?? 0) - (box?.height ?? 1))).toBeLessThan(1);
  });

  test("accessibility: the inspector is a named dialog with labelled fields and a live save status", async ({ page }) => {
    await visitStates(page, "media", theme);
    const ins = page.locator("#ins-static-ins");
    await expect(ins).toHaveAccessibleName("uptime-strip.png");
    await expect(ins.getByLabel("Alt text")).toHaveAccessibleDescription(/What a person who cannot see the picture needs to know/);
    await expect(ins.getByRole("checkbox", { name: "Decorative image" })).not.toBeChecked();
    await expect(ins.getByLabel("Title")).toBeVisible();
    await expect(ins.getByLabel("Caption")).toBeVisible();
    await expect(ins.getByLabel("Add a tag")).toBeVisible();
    await expect(ins.getByRole("textbox", { name: "Address" })).toHaveValue("https://dustinedwards.info/media/uptime-strip.png");
    await expect(ins.locator("[data-cap-part=save-status]")).toHaveAttribute("role", "status");
    await expect(ins.locator("[data-cap-part=save-error]")).toHaveAttribute("role", "alert");
    await expect(ins.getByRole("link", { name: "Why the uptime strip counts gaps" })).toHaveAttribute("href", "/admin/posts/uptime-gaps/edit");
  });

  test("accessibility: the delivered HTML has the tiles and the active file's inspector", async ({ page }) => {
    const html = await (await page.request.get("components/media/states.html")).text();
    expect(html).toContain('data-label="foxhound-hero.jpg"');
    expect(html).toContain("No alt text");
    expect(html).toContain("Not used anywhere.");
    expect(html).toContain('class="cap-dialog cap-media-inspector"');
    expect(html).toContain("The Foxhound dashboard with three sites reporting healthy");
    expect(html).toContain('data-alt="decorative"');
    expect(html).toContain('role="progressbar"');
  });

  test("accessibility: a decorative file is a different state from a missing one, and says so in words", async ({ page }) => {
    await visitStates(page, "media", theme);
    const deco = page.locator("#ins-deco");
    await expect(deco.getByRole("checkbox", { name: "Decorative image" })).toBeChecked();
    await expect(deco.getByLabel("Alt text")).toBeDisabled();
    await expect(deco.getByLabel("Alt text")).toHaveValue("");
    await expect(page.locator("#t-germomics-tree")).toHaveAttribute("data-alt", "decorative");
    await expect(page.locator("#t-uptime-strip")).toHaveAttribute("data-alt", "missing");
  });

  // -------------------------------------------------------------------------------------
  // keyboard

  test("keyboard: Tab enters the grid at the active tile only, then its checkbox, then leaves", async ({ page }) => {
    await library(page, theme);
    const tabs = await page.locator(".cap-media-open").evaluateAll((els) => els.map((e) => (e as HTMLElement).tabIndex));
    expect(tabs.filter((t) => t === 0)).toHaveLength(1);
    await link(page, FOX).focus();
    await page.keyboard.press("Tab");
    await expect(tile(page, FOX).getByRole("checkbox")).toBeFocused();
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => !!document.activeElement?.closest(".cap-media-grid"));
    expect(inside).toBe(false);
  });

  test("keyboard: the arrow keys move between tiles in two dimensions, Home and End to the first and last", async ({ page }) => {
    await library(page, theme);
    await link(page, FOX).focus();
    await page.keyboard.press("ArrowRight");
    await expect(link(page, UPTIME)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(link(page, FOX)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(link(page, "scan-0042.png")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(link(page, FOX)).toBeFocused();
    // Down: a tile in the next row, near the same column.
    const here = await link(page, FOX).boundingBox();
    await page.keyboard.press("ArrowDown");
    const there = await page.evaluate(() => {
      const r = document.activeElement?.closest(".cap-media-tile")?.getBoundingClientRect();
      return r ? { top: r.top, left: r.left } : null;
    });
    expect(there && here && there.top > here.y).toBe(true);
    await page.keyboard.press("ArrowUp");
    await expect(link(page, FOX)).toBeFocused();
    await page.keyboard.press("End");
    await expect(link(page, "mention-queue.png")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(link(page, "capsid-walkthrough.png")).toBeFocused();
  });

  test("keyboard: arrow keys reach the uploading and failed tiles, and Enter on them opens nothing", async ({ page }) => {
    await library(page, theme);
    await link(page, FOX).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(link(page, "scan-0042.png")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(link(page, "capsid-walkthrough.png")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(inspector(page).getByRole("heading", { name: FOX })).toBeVisible();
    await expect(inspector(page).getByLabel("Alt text")).not.toBeFocused();
  });

  test("keyboard: focus roves, so the tile with focus is the only tab stop", async ({ page }) => {
    await library(page, theme);
    await link(page, FOX).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const stops = await page.locator(".cap-media-open").evaluateAll((els) => els.map((e) => [(e as HTMLElement).closest(".cap-media-tile")?.getAttribute("data-label"), (e as HTMLElement).tabIndex]));
    expect(stops.filter(([, t]) => t === 0)).toEqual([["germomics-tree.svg", 0]]);
  });

  test("keyboard: Enter on a tile opens its inspector and puts focus in the alt text", async ({ page }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await expect(inspector(page).getByRole("heading", { name: UPTIME })).toBeVisible();
    await expect(alt(page)).toBeFocused();
    expect(await inspector(page).evaluate((el: HTMLDialogElement) => el.matches(":modal"))).toBe(false);
  });

  test("keyboard: with the inspector open, arrow keys move between tiles and it follows; focus stays in the grid", async ({ page }) => {
    await library(page, theme);
    await link(page, FOX).focus();
    await page.keyboard.press("ArrowRight");
    await expect(link(page, UPTIME)).toBeFocused();
    await expect(inspector(page).getByRole("heading", { name: UPTIME })).toBeVisible();
    await expect(link(page, UPTIME)).toHaveAttribute("aria-current", "true");
    await expect(link(page, FOX)).not.toHaveAttribute("aria-current", "true");
    await page.keyboard.press("ArrowRight");
    await expect(inspector(page).getByRole("heading", { name: "germomics-tree.svg" })).toBeVisible();
    await expect(link(page, "germomics-tree.svg")).toBeFocused();
  });

  test("keyboard: Alt and an arrow in a field moves to the next file and keeps focus in the field", async ({ page }) => {
    await library(page, theme);
    await link(page, FOX).focus();
    await page.keyboard.press("Enter");
    await expect(alt(page)).toBeFocused();
    await page.keyboard.press("Alt+ArrowRight");
    await expect(inspector(page).getByRole("heading", { name: UPTIME })).toBeVisible();
    await expect(alt(page)).toBeFocused();
    await page.keyboard.press("Alt+ArrowLeft");
    await expect(inspector(page).getByRole("heading", { name: FOX })).toBeVisible();
    await expect(alt(page)).toBeFocused();
  });

  test("keyboard: Esc in an inspector field returns focus to the active tile and leaves the pane open", async ({ page }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await expect(link(page, UPTIME)).toBeFocused();
    await expect(inspector(page)).toBeVisible();
  });

  test("keyboard: Enter on Close closes the pane and focus goes back to the tile", async ({ page }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await inspector(page).getByRole("button", { name: "Close" }).focus();
    await page.keyboard.press("Enter");
    await expect(inspector(page)).toBeHidden();
    await expect(link(page, UPTIME)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(inspector(page)).toBeVisible();
  });

  test("keyboard: Space toggles a tile's selection and the bulk bar follows", async ({ page }) => {
    await library(page, theme);
    await link(page, FOX).focus();
    await page.keyboard.press("Space");
    await expect(tile(page, FOX).getByRole("checkbox")).toBeChecked();
    await expect(tile(page, FOX)).toHaveAttribute("data-selected", "");
    await expect(page.locator("#library-bulk .cap-bulk-count")).toHaveText("2 selected");
    await page.keyboard.press("Space");
    await expect(tile(page, FOX).getByRole("checkbox")).not.toBeChecked();
    await expect(page.locator("#library-bulk .cap-bulk-count")).toHaveText("1 selected");
  });

  test("keyboard: x toggles a selection too, and does nothing when single keys are off", async ({ page }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("x");
    await expect(tile(page, UPTIME).getByRole("checkbox")).toBeChecked();
    await page.evaluate(() => (document.documentElement.dataset.capSingleKeys = "off"));
    await page.keyboard.press("x");
    await expect(tile(page, UPTIME).getByRole("checkbox")).toBeChecked();
  });

  test("keyboard: Esc in the grid clears the selection and hides the bulk bar", async ({ page }) => {
    await library(page, theme);
    await expect(page.locator("#library-bulk")).toBeVisible();
    await link(page, FOX).focus();
    await page.keyboard.press("Escape");
    await expect(page.locator("#library-bulk")).toBeHidden();
    await expect(tile(page, "mention-queue.png")).not.toHaveAttribute("data-selected", "");
  });

  test("keyboard: Enter in the tag field adds a tag, which saves; Enter on its chip removes it", async ({ page }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    const tags = inspector(page).getByLabel("Add a tag");
    await tags.focus();
    await page.keyboard.type("Reports");
    await page.keyboard.press("Enter");
    await expect(inspector(page).getByRole("button", { name: "Remove tag reports" })).toBeVisible();
    await expect(tags).toHaveValue("");
    await expect(saveStatus(page)).toHaveText("Saved");
    await expect(tile(page, UPTIME)).toHaveAttribute("data-tags", "reports");
    await inspector(page).getByRole("button", { name: "Remove tag reports" }).focus();
    await page.keyboard.press("Enter");
    await expect(inspector(page).getByRole("button", { name: "Remove tag reports" })).toHaveCount(0);
    await expect(tile(page, UPTIME)).toHaveAttribute("data-tags", "");
  });

  test("keyboard: Enter and Space on Copy address copy it and say so in a live region", async ({ page }) => {
    await library(page, theme);
    const copy = inspector(page).getByRole("button", { name: "Copy the address" });
    await copy.focus();
    await page.keyboard.press("Enter");
    await expect(inspector(page).locator("[data-cap-part=copied]")).toHaveText("Copied the address.");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://dustinedwards.info/media/foxhound-hero.jpg");
    await page.evaluate(() => navigator.clipboard.writeText("something else"));
    await page.waitForTimeout(50);
    await copy.focus();
    await page.keyboard.press("Space");
    await expect(inspector(page).locator("[data-cap-part=copied]")).toHaveText("Copied the address.");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://dustinedwards.info/media/foxhound-hero.jpg");
  });

  test("keyboard: Enter on Retry asks for the upload again", async ({ page }) => {
    await library(page, theme);
    await page.evaluate(() => {
      (window as unknown as { retried: string[] }).retried = [];
      document.addEventListener("cap-media-retry", (e) => (window as unknown as { retried: string[] }).retried.push((e as CustomEvent).detail.key));
    });
    await link(page, "scan-0042.png").focus();
    await page.keyboard.press("Tab");
    await expect(tile(page, "scan-0042.png").getByRole("button", { name: "Retry uploading scan-0042.png" })).toBeFocused();
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => (window as unknown as { retried: string[] }).retried)).toEqual(["media/scan-0042.png"]);
  });

  test("keyboard: Enter on Restore puts a file in the bin back, with Undo", async ({ page }) => {
    await library(page, theme);
    await page.getByRole("radio", { name: /Bin/ }).check();
    await expect(page.locator(".cap-media-tile:not([hidden])")).toHaveCount(1);
    await link(page, "old-logo.png").focus();
    await page.keyboard.press("Tab");
    await expect(tile(page, "old-logo.png").getByRole("button", { name: "Restore old-logo.png" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator(".cap-message-item")).toContainText("Restored old-logo.png to the library.");
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
    await expect(tile(page, "old-logo.png")).toBeHidden();
  });

  test("keyboard: in a narrow container Enter opens the inspector as a modal sheet, Esc closes it, focus returns to the tile", async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 800 });
    await library(page, theme, "sheet");
    await expect(inspector(page)).toBeHidden();
    await link(page, FOX).focus();
    await page.keyboard.press("Enter");
    await expect(inspector(page)).toBeVisible();
    expect(await inspector(page).evaluate((el: HTMLDialogElement) => el.matches(":modal"))).toBe(true);
    await expect(alt(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(inspector(page)).toBeHidden();
    await expect(link(page, FOX)).toBeFocused();
  });

  // -------------------------------------------------------------------------------------
  // behaviour

  test("behaviour: wide, the inspector is a pane beside the grid; narrow, a closed sheet", async ({ page }) => {
    await library(page, theme);
    const grid = await page.locator("#library-tiles").boundingBox();
    const pane = await inspector(page).boundingBox();
    expect(grid && pane && pane.x >= grid.x + grid.width - 1).toBe(true);
    expect(await inspector(page).evaluate((el: HTMLDialogElement) => el.open && !el.matches(":modal"))).toBe(true);
    await page.setViewportSize({ width: 420, height: 800 });
    await library(page, theme, "sheet");
    expect(await inspector(page).evaluate((el: HTMLDialogElement) => el.open)).toBe(false);
  });

  test("behaviour: with no script the inspector is in the page, open, with its form and a Save button", async ({ page }) => {
    await page.route("**/*.js", (r) => r.abort());
    await page.goto("components/media/states.html");
    const ins = page.locator("#ins-static-ins");
    await expect(ins).toBeVisible();
    await expect(ins.getByLabel("Alt text")).toBeVisible();
    await expect(ins.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(ins.getByRole("link", { name: "Why the uptime strip counts gaps" })).toBeVisible();
  });

  test("behaviour: typing alt text saves after 800 ms of quiet, with Saving then Saved, and the tile updates", async ({ page }) => {
    await page.clock.install();
    await library(page, theme);
    await page.clock.pauseAt(Date.now() + 60_000);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await expect(saveStatus(page)).toHaveText("Changes save by themselves.");
    await page.keyboard.type("The uptime strip");
    await expect(saveStatus(page)).toHaveText("Unsaved changes");
    await page.clock.runFor(500);
    await page.keyboard.type(": 29 green days");
    await page.clock.runFor(700);
    expect(await page.evaluate(() => (window as unknown as { saves: unknown[] }).saves.length)).toBe(0);
    await page.clock.runFor(150);
    await expect(saveStatus(page)).toHaveText("Saving…");
    await expect(inspector(page).locator("form")).toHaveAttribute("aria-busy", "true");
    await page.clock.runFor(200);
    await expect(saveStatus(page)).toHaveText("Saved");
    await expect(inspector(page).locator("form")).not.toHaveAttribute("aria-busy", "true");
    const saves = await page.evaluate(() => (window as unknown as { saves: Array<{ key: string; fields: { alt: string } }> }).saves);
    expect(saves).toHaveLength(1);
    expect(saves[0]?.fields.alt).toBe("The uptime strip: 29 green days");
    await expect(tile(page, UPTIME)).toHaveAttribute("data-alt", "set");
    await expect(tile(page, UPTIME).locator(".cap-status")).toHaveCount(0);
  });

  test("behaviour: leaving a field saves what was typed at once", async ({ page }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.type("Four green sites");
    await page.keyboard.press("Tab");
    await expect(saveStatus(page)).toHaveText("Saved");
    expect(await page.evaluate(() => (window as unknown as { saves: unknown[] }).saves.length)).toBe(1);
  });

  test("behaviour: a save that fails says so, keeps the typed text, and Retry saves it", async ({ page }) => {
    await library(page, theme);
    await page.evaluate(() => ((window as unknown as { failSave: boolean }).failSave = true));
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.type("A strip of thirty days");
    await page.keyboard.press("Tab");
    await expect(inspector(page).locator("[data-cap-part=save-error]")).toContainText("Could not save: The server answered 502. What you typed is still here.");
    await expect(inspector(page).getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(alt(page)).toHaveValue("A strip of thirty days");
    await expect(tile(page, UPTIME)).toHaveAttribute("data-alt", "missing");
    await page.evaluate(() => ((window as unknown as { failSave: boolean }).failSave = false));
    await inspector(page).getByRole("button", { name: "Retry" }).click();
    await expect(saveStatus(page)).toHaveText("Saved");
    await expect(inspector(page).getByRole("button", { name: "Retry" })).toBeHidden();
    await expect(tile(page, UPTIME)).toHaveAttribute("data-alt", "set");
  });

  test("behaviour: typed text that failed to save is still there after moving to another file and back", async ({ page }) => {
    await library(page, theme);
    await page.evaluate(() => ((window as unknown as { failSave: boolean }).failSave = true));
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.type("Thirty days of checks");
    await page.keyboard.press("Tab");
    await expect(inspector(page).locator("[data-cap-part=save-error]")).toContainText("Could not save");
    await link(page, UPTIME).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(inspector(page).getByRole("heading", { name: FOX })).toBeVisible();
    await expect(saveStatus(page)).toHaveText("Changes save by themselves.");
    await page.keyboard.press("ArrowRight");
    await expect(inspector(page).getByRole("heading", { name: UPTIME })).toBeVisible();
    await expect(alt(page)).toHaveValue("Thirty days of checks");
    await expect(inspector(page).getByRole("button", { name: "Retry" })).toBeVisible();
  });

  test("behaviour: switching file saves unsaved text to the file it was typed for", async ({ page }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.type("Typed for the uptime strip");
    await page.keyboard.press("Alt+ArrowRight");
    await expect(inspector(page).getByRole("heading", { name: "germomics-tree.svg" })).toBeVisible();
    const saves = await page.evaluate(() => (window as unknown as { saves: Array<{ key: string; fields: { alt: string } }> }).saves);
    expect(saves.map((s) => [s.key, s.fields.alt])).toEqual([["media/uptime-strip.png", "Typed for the uptime strip"]]);
    await expect(tile(page, UPTIME)).toHaveAttribute("data-alt-text", "Typed for the uptime strip");
  });

  test("behaviour: Decorative image clears and disables the alt text, saves, and the tile says Decorative", async ({ page }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.type("A strip");
    await page.keyboard.press("Tab");
    await expect(saveStatus(page)).toHaveText("Saved");
    const deco = inspector(page).getByRole("checkbox", { name: "Decorative image" });
    await deco.check();
    await expect(alt(page)).toBeDisabled();
    await expect(alt(page)).toHaveValue("");
    await expect(saveStatus(page)).toHaveText("Saved");
    await expect(tile(page, UPTIME)).toHaveAttribute("data-alt", "decorative");
    await expect(tile(page, UPTIME).locator(".cap-status")).toHaveText("Decorative");
    const saves = await page.evaluate(() => (window as unknown as { saves: Array<{ fields: { alt: string; decorative: boolean } }> }).saves);
    expect(saves.at(-1)?.fields).toMatchObject({ alt: "", decorative: true });
    await deco.uncheck();
    await expect(alt(page)).toBeEnabled();
    await expect(alt(page)).toHaveValue("A strip");
  });

  test("behaviour: an uploaded image can be told apart: missing alt text shows a warning word, a written one shows none", async ({ page }) => {
    await library(page, theme);
    await expect(tile(page, UPTIME).locator(".cap-status")).toHaveText(["No alt text"]);
    await expect(tile(page, FOX).locator(".cap-status")).toHaveCount(0);
  });

  test("behaviour: the inspector lists where a file is used, as links, and says so plainly when it is not used", async ({ page }) => {
    await library(page, theme);
    await link(page, "mention-queue.png").focus();
    await page.keyboard.press("Enter");
    const used = inspector(page).locator("[data-cap-part=used]");
    await expect(used.getByRole("link")).toHaveText(["What a mention queue is for", "Undo is cheaper than are-you-sure", "Search without a server"]);
    await expect(used.getByRole("link").first()).toHaveAttribute("href", "/admin/posts/mention-queue/edit");
    await link(page, "fieldnotes-migration.jpg").focus();
    await page.keyboard.press("Enter");
    await expect(used).toContainText("Not used anywhere.");
    await expect(used).toContainText("The Unattached filter lists every file like this.");
    await expect(used.getByRole("link")).toHaveCount(0);
  });

  test("behaviour: the Unattached filter has a count, narrows the grid, and the inspector's button turns it on", async ({ page }) => {
    await library(page, theme);
    const chip = page.getByRole("button", { name: /^Unattached/ });
    await expect(chip.locator(".cap-chip-count")).toHaveText("1");
    await expect(page.locator(".cap-media-count")).toHaveText("6 files");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".cap-media-tile:not([hidden])")).toHaveCount(3); // the unattached one, plus the upload in progress and the failed one
    await expect(tile(page, "fieldnotes-migration.jpg")).toBeVisible();
    await expect(page.locator(".cap-media-count")).toHaveText("1 of 6 files");
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(page.locator(".cap-media-count")).toHaveText("6 files");
    await link(page, "fieldnotes-migration.jpg").focus();
    await page.keyboard.press("Enter");
    await inspector(page).getByRole("button", { name: "Show unattached files" }).click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".cap-media-count")).toHaveText("1 of 6 files");
  });

  test("behaviour: the no alt text filter lists what still needs a description", async ({ page }) => {
    await library(page, theme);
    await page.getByRole("button", { name: /^No alt text/ }).click();
    await expect(tile(page, UPTIME)).toBeVisible();
    await expect(tile(page, "fieldnotes-migration.jpg")).toBeVisible();
    await expect(tile(page, FOX)).toBeHidden();
    await expect(tile(page, "germomics-tree.svg")).toBeHidden();
  });

  test("behaviour: search narrows by name, alt text and tags, and says what it found, or that nothing matches", async ({ page }) => {
    await library(page, theme);
    const q = page.getByRole("searchbox", { name: "Search files" });
    await q.fill("uptime");
    await expect(page.locator(".cap-media-tile:not([hidden])[data-state=ready]")).toHaveCount(2);
    await q.fill("germomics");
    await expect(tile(page, "germomics-tree.svg")).toBeVisible();
    await q.fill("zzzz");
    await expect(page.locator(".cap-media-empty")).toBeVisible();
    await expect(page.getByText("No files match your search")).toBeVisible();
    await expect(page.locator(".cap-media-count")).toHaveText("0 of 6 files");
    await page.getByRole("button", { name: "Clear the search" }).click();
    await expect(q).toHaveValue("");
    await expect(page.locator(".cap-media-empty")).toBeHidden();
    await expect(page.locator(".cap-media-count")).toHaveText("6 files");
  });

  test("behaviour: the bin view shows the binned files, with a count and Restore", async ({ page }) => {
    await library(page, theme);
    await expect(page.locator("[data-cap-count=bin]")).toHaveText("1");
    await page.getByRole("radio", { name: /Bin/ }).check();
    await expect(page.locator(".cap-media-tile:not([hidden])")).toHaveCount(1);
    await expect(tile(page, "old-logo.png").locator(".cap-status")).toHaveText("In the bin");
    await expect(page.locator(".cap-media-count")).toHaveText("1 in the bin");
    await page.getByRole("button", { name: "Restore old-logo.png" }).click();
    await expect(page.locator(".cap-media-empty")).toBeVisible();
    await expect(page.getByText("The bin is empty")).toBeVisible();
    await expect(page.locator("[data-cap-count=bin]")).toHaveText("0");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(tile(page, "old-logo.png")).toBeVisible();
  });

  test("behaviour: moving a file to the bin from the inspector runs at once and offers Undo", async ({ page }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await inspector(page).getByRole("button", { name: "Move to the bin" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(tile(page, UPTIME)).toBeHidden();
    await expect(page.locator(".cap-message-item")).toContainText("Moved uptime-strip.png to the bin.");
    await expect(inspector(page).getByRole("heading", { name: "germomics-tree.svg" })).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(tile(page, UPTIME)).toBeVisible();
    await expect(page.locator("[data-cap-count=bin]")).toHaveText("1");
  });

  test("behaviour: the bulk bar over the grid bins the selection with Undo and adds a tag", async ({ page }) => {
    await library(page, theme);
    await expect(page.locator("#library-bulk .cap-bulk-count")).toHaveText("1 selected");
    await link(page, UPTIME).focus();
    await page.keyboard.press("Space");
    await page.locator("#library-bulk").getByLabel("Tag").fill("Review");
    await page.locator("#library-bulk").getByRole("button", { name: "Add tag" }).click();
    await expect(page.locator(".cap-message-item")).toContainText("Added the tag to 2 files.");
    await expect(tile(page, UPTIME)).toHaveAttribute("data-tags", "review");
    await expect(tile(page, "mention-queue.png")).toHaveAttribute("data-tags", "mentions, review");
    await link(page, UPTIME).focus();
    await page.keyboard.press("Space");
    await link(page, "mention-queue.png").focus();
    await page.keyboard.press("Space");
    await page.locator("#library-bulk").getByRole("button", { name: "Move to the bin" }).click();
    await expect(page.locator(".cap-message-item")).toContainText("Moved 2 files to the bin.");
    await expect(tile(page, UPTIME)).toBeHidden();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(tile(page, UPTIME)).toBeVisible();
  });

  test("behaviour: deleting for good previews every file first, with focus on Cancel, and cannot be undone", async ({ page }) => {
    await library(page, theme);
    await page.getByRole("radio", { name: /Bin/ }).check();
    await tile(page, "old-logo.png").getByRole("checkbox").check({ force: true });
    await page.locator("#library-bulk").getByRole("button", { name: "Delete for good" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Delete 1 file for good?" });
    await expect(dialog.getByRole("listitem")).toHaveText(["old-logo.png"]);
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(tile(page, "old-logo.png")).toBeVisible();
    await page.locator("#library-bulk").getByRole("button", { name: "Delete for good" }).click();
    await dialog.getByRole("button", { name: "Delete 1 file" }).click();
    await expect(tile(page, "old-logo.png")).toHaveCount(0);
    await expect(page.locator(".cap-message-item")).toContainText("Deleted 1 file for good.");
    await expect(page.getByRole("button", { name: "Undo" })).toHaveCount(0);
  });

  test("behaviour: copy address copies the file's address; Markdown copies an image reference", async ({ page }) => {
    await library(page, theme);
    await inspector(page).getByRole("button", { name: "Copy the Markdown image" }).click();
    await expect(inspector(page).locator("[data-cap-part=copied]")).toHaveText("Copied the Markdown image.");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("![The Foxhound dashboard with three sites reporting healthy](https://dustinedwards.info/media/foxhound-hero.jpg)");
  });

  test("behaviour: when the clipboard refuses, copy says so and leaves the address selected", async ({ page }) => {
    await library(page, theme);
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("denied")) }, configurable: true });
      document.execCommand = () => false;
    });
    await inspector(page).getByRole("button", { name: "Copy the address" }).click();
    await expect(inspector(page).locator("[data-cap-part=copied]")).toContainText("Could not copy. The address is selected");
    const selected = await page.evaluate(() => {
      const el = document.activeElement as HTMLInputElement | null;
      return el?.selectionEnd && el.selectionEnd > 0 ? el.value : "";
    });
    expect(selected).toBe("https://dustinedwards.info/media/foxhound-hero.jpg");
  });

  test("behaviour: dropped files become uploading tiles with a progress bar, and finish as tiles that open", async ({ page }) => {
    await library(page, theme, "empty");
    await expect(page.getByText("Nothing here yet")).toBeVisible();
    await page.locator("#blank-empty-drop input").setInputFiles([{ name: "release-notes.png", mimeType: "image/png", buffer: Buffer.alloc(4000, 1) }]);
    const t = tile(page, "release-notes.png");
    await expect(t).toHaveAttribute("data-state", "uploading");
    await expect(t.getByRole("progressbar", { name: "Uploading" })).toBeVisible();
    await expect(page.locator(".cap-media-empty")).toBeHidden();
    await expect(t).toHaveAttribute("data-state", "ready", { timeout: 6000 });
    await expect(t.getByRole("link", { name: /release-notes\.png/ })).toBeVisible();
    await expect(t.locator(".cap-status")).toHaveText(["No alt text", "Unattached"]);
  });

  test("accessibility: a binned tile keeps its words at contrast", async ({ page }) => {
    await visitStates(page, "media", theme);
    await expectContrast(page, [
      { sel: "#t-old-logo .cap-media-name", what: "a binned tile's name" },
      { sel: "#t-old-logo .cap-media-meta", what: "a binned tile's type and size" },
    ]);
  });

  // -------------------------------------------------------------------------------------
  // The React wrappers render the same contract and behave the same way.

  test("accessibility: no axe violations in the React specimen", async ({ page }) => {
    await library(page, theme, "react");
    await expect(page.locator(".cap-media-tile")).toHaveCount(5);
    await expectNoAxeViolations(page);
  });

  test("behaviour: React MediaGrid renders the tiles' contract, with the arrow keys, Space and Enter", async ({ page }) => {
    await library(page, theme, "react");
    await expect(page.getByRole("list", { name: "Files" })).toBeVisible();
    await expect(link(page, UPTIME)).toHaveAccessibleDescription(/No alt text/);
    await expect(page.locator("#tile-media-capsid-walkthrough-png").getByRole("progressbar", { name: "Uploading" })).toHaveAttribute("aria-valuenow", "62");
    await expect(page.getByRole("button", { name: "Retry uploading scan-0042.png" })).toBeVisible();
    await link(page, FOX).focus();
    await page.keyboard.press("ArrowRight");
    await expect(link(page, UPTIME)).toBeFocused();
    await expect(inspector(page).getByRole("heading", { name: UPTIME })).toBeVisible();
    await page.keyboard.press("Space");
    await expect(tile(page, UPTIME).getByRole("checkbox")).toBeChecked();
    await expect(page.locator(".cap-media-count")).toContainText("1 selected");
    await page.keyboard.press("End");
    await expect(link(page, "scan-0042.png")).toBeFocused();
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(alt(page)).toBeFocused();
  });

  test("behaviour: React MediaInspector saves by itself, shows Saved, and keeps typed text when a save fails", async ({ page }) => {
    await library(page, theme, "react");
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await expect(alt(page)).toBeFocused();
    await page.keyboard.type("Thirty days of checks");
    await page.keyboard.press("Tab");
    await expect(saveStatus(page)).toHaveText("Saved");
    expect(await page.evaluate(() => (window as unknown as { reactSaves: Array<{ fields: { alt: string } }> }).reactSaves.map((s) => s.fields.alt))).toEqual(["Thirty days of checks"]);
    await expect(link(page, UPTIME)).not.toHaveAccessibleDescription(/No alt text/);
    await page.evaluate(() => ((window as unknown as { failReactSave: boolean }).failReactSave = true));
    await alt(page).fill("Thirty days, one amber");
    await page.keyboard.press("Tab");
    await expect(inspector(page).locator("[role=alert]")).toContainText("Could not save: The server answered 502. What you typed is still here.");
    await expect(alt(page)).toHaveValue("Thirty days, one amber");
    await page.evaluate(() => ((window as unknown as { failReactSave: boolean }).failReactSave = false));
    await inspector(page).getByRole("button", { name: "Retry" }).click();
    await expect(saveStatus(page)).toHaveText("Saved");
  });

  test("behaviour: React MediaInspector marks a file decorative and clears and disables its alt text", async ({ page }) => {
    await library(page, theme, "react");
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await expect(alt(page)).toBeFocused();
    await page.keyboard.type("Temporary");
    await inspector(page).getByRole("checkbox", { name: "Decorative image" }).check();
    await expect(alt(page)).toBeDisabled();
    await expect(alt(page)).toHaveValue("");
    await expect(saveStatus(page)).toHaveText("Saved");
    await expect(tile(page, UPTIME)).toHaveAttribute("data-alt", "decorative");
    await expect(tile(page, UPTIME).locator(".cap-status")).toHaveText(["Decorative", "Unattached"]);
  });

  test("behaviour: the grid groups by month, and the arrow keys cross from one group to the next", async ({ page }) => {
    await library(page, theme);
    await expect(page.getByRole("heading", { name: /September 2026/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /August 2026/ })).toBeVisible();
    await link(page, "uptime-report-september.pdf").focus();
    let label = "";
    for (let i = 0; i < 8 && label !== "mention-queue.png"; i += 1) {
      await page.keyboard.press("ArrowRight");
      label = (await page.evaluate(() => document.activeElement?.closest(".cap-media-tile")?.getAttribute("data-label"))) ?? "";
    }
    expect(label).toBe("mention-queue.png");
  });

  test("behaviour: sort orders each group, keeps uploads first, and keeps focus", async ({ page }) => {
    await library(page, theme);
    const order = () => page.locator("section[aria-labelledby=library-g-september] .cap-media-tile").evaluateAll((els) => els.map((e) => e.getAttribute("data-label")));
    expect((await order()).slice(0, 3)).toEqual(["capsid-walkthrough.png", "scan-0042.png", FOX]);
    await page.getByRole("radio", { name: "A to Z" }).check({ force: true });
    expect(await order()).toEqual(["capsid-walkthrough.png", "scan-0042.png", "fieldnotes-migration.jpg", FOX, "germomics-tree.svg", "uptime-report-september.pdf", UPTIME]);
    await page.getByRole("radio", { name: "Largest" }).check({ force: true });
    expect((await order()).slice(2, 4)).toEqual(["fieldnotes-migration.jpg", "uptime-report-september.pdf"]);
    await link(page, "germomics-tree.svg").focus();
    await page.getByRole("radio", { name: "Newest" }).check({ force: true });
    expect((await order()).slice(2, 4)).toEqual([FOX, UPTIME]);
  });

  test("behaviour: the list layout puts one file on each row, with the same tiles", async ({ page }) => {
    await library(page, theme);
    await page.getByRole("radio", { name: "List" }).check({ force: true });
    await expect(page.locator(".cap-media[data-cap=media]")).toHaveAttribute("data-view", "list");
    const a = await tile(page, FOX).boundingBox();
    const b = await tile(page, UPTIME).boundingBox();
    expect(a && b && b.y > a.y && Math.abs(a.x - b.x) < 2).toBe(true);
    await link(page, FOX).focus();
    await page.keyboard.press("ArrowDown");
    await expect(link(page, UPTIME)).toBeFocused();
    await expectNoAxeViolations(page);
  });

  test("behaviour: a file dropped anywhere on the library page becomes an uploading tile", async ({ page }) => {
    await library(page, theme);
    const dt = await page.evaluateHandle(() => {
      const t = new DataTransfer();
      t.items.add(new File([new Uint8Array(40)], "dropped-anywhere.png", { type: "image/png" }));
      return t;
    });
    await page.dispatchEvent("body", "dragenter", { dataTransfer: dt });
    await expect(page.locator("#library-drop .cap-drop-overlay")).toBeVisible();
    await page.dispatchEvent("body", "drop", { dataTransfer: dt });
    await expect(tile(page, "dropped-anywhere.png")).toHaveAttribute("data-state", "uploading");
    await expect(page.locator("#library-drop .cap-drop-overlay")).toBeHidden();
  });

  test("behaviour: tile size changes the columns", async ({ page }) => {
    await library(page, theme);
    const w = async () => (await tile(page, FOX).boundingBox())?.width ?? 0;
    const m = await w();
    await page.getByRole("radio", { name: "S", exact: true }).check({ force: true });
    expect(await w()).toBeLessThan(m);
    await page.getByRole("radio", { name: "L", exact: true }).check({ force: true });
    expect(await w()).toBeGreaterThan(m);
  });
});
