import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";
import {
  applyBulkTag,
  altStateOf,
  bands,
  copySnippets,
  createAutosave,
  flagsFor,
  nextTile,
  parseTags,
} from "./media.ts";
import { FOX, UPTIME, alt, inspector, library, link, saveStatus, tile } from "./media-helpers.ts";

// The pure parts run in node.

test("behavior: the grid's arrow keys read rendered rows, wrap in reading order and stop at the edges", () => {
  const boxes = [
    { id: "a", top: 0, left: 0, width: 100 },
    { id: "b", top: 0, left: 110, width: 100 },
    { id: "c", top: 0, left: 220, width: 100 },
    { id: "d", top: 120, left: 0, width: 100 },
    { id: "e", top: 120, left: 110, width: 100 },
    { id: "z", top: 120, left: 220, width: 0 }, // not laid out
  ];
  const rows = bands(boxes);
  expect(rows.map((r) => r.items.map((i) => i.id))).toEqual([
    ["a", "b", "c"],
    ["d", "e"],
  ]);
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

test("behavior: alt text has three states, and decorative is a choice that missing is not", () => {
  expect(altStateOf("", false)).toBe("missing");
  expect(altStateOf("   ", false)).toBe("missing");
  expect(altStateOf("A dashboard", false)).toBe("set");
  expect(altStateOf("", true)).toBe("decorative");
  expect(altStateOf("kept but ignored", true)).toBe("decorative");
  const base = {
    kind: "image" as const,
    used: [{ title: "x", href: "/x" }],
    state: "ready" as const,
  };
  expect(flagsFor({ ...base, altState: "missing" }).map((f) => f.word)).toEqual(["No alt text"]);
  expect(flagsFor({ ...base, altState: "decorative" }).map((f) => f.word)).toEqual(["Decorative"]);
  expect(flagsFor({ ...base, altState: "set", used: [] }).map((f) => f.word)).toEqual([
    "Unattached",
  ]);
  // A list that did not read where a file is used does not call it unattached.
  expect(
    flagsFor({ ...base, altState: "set", used: [], usedUnknown: true }).map((f) => f.word),
  ).toEqual([]);
  expect(flagsFor({ ...base, altState: "set", state: "binned" }).map((f) => f.word)).toEqual([
    "In Trash",
  ]);
  expect(
    flagsFor({ kind: "document", altState: "missing", used: [], state: "ready" }).map(
      (f) => f.word,
    ),
  ).toEqual(["Unattached"]);
});

test("behavior: tags and the copy snippets", () => {
  expect(parseTags(" Release, dashboard,release,, ")).toEqual(["release", "dashboard"]);
  const img = copySnippets({
    url: "https://x.test/a.png",
    kind: "image",
    alt: "A dashboard",
    name: "a.png",
  });
  expect(img.map((s) => s.value)).toEqual([
    "https://x.test/a.png",
    "![A dashboard](https://x.test/a.png)",
    '<img src="https://x.test/a.png" alt="A dashboard">',
  ]);
  const doc = copySnippets({
    url: "https://x.test/r.pdf",
    kind: "document",
    alt: "",
    name: "uptime-report.pdf",
  });
  expect(doc[1]?.value).toBe("[uptime report](https://x.test/r.pdf)");
});

test("behavior: autosave waits for quiet, saves once, and saves a change made while saving", async () => {
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

test("behavior: autosave that fails says so with the reason, and Retry saves again", async () => {
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

test("behavior: a bulk tag skips what already has it, records a failure and carries on", async () => {
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

  // accessibility

  test("accessibility: no axe violations on the states page", async ({ page }) => {
    await visitStates(page, "media", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations in the library, the sheet and the empty library", async ({
    page,
  }) => {
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

  test("accessibility: tile text, flags and the selected check reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "media", theme);
    await expectContrast(page, [
      { sel: "#t-launch-hero .cap-media-name", what: "a tile's name" },
      { sel: "#t-launch-hero .cap-media-meta", what: "a tile's type and size" },
      { sel: "#t-uptime-strip .cap-status", what: "the No alt text status" },
      { sel: "#t-project-tree .cap-status", what: "the Decorative status" },
      { sel: "#t-fieldnotes-migration .cap-status", what: "the Unattached status" },
      { sel: "#t-old-logo .cap-status", what: "the In Trash status" },
      { sel: "#t-old-logo .cap-media-name", what: "a binned tile's name" },
      { sel: "#t-old-logo .cap-media-meta", what: "a binned tile's type and size" },
      { sel: "#t-mention-queue .cap-media-name", what: "a selected tile's name on its tint" },
      { sel: "#t-mention-queue .cap-media-check-word", what: "the word Selected" },
      {
        sel: "#t-mention-queue .cap-media-check-box",
        what: "the check box's edge",
        part: "border",
      },
      { sel: "#t-capsid-walkthrough .cap-meter-label", what: "the uploading label" },
      { sel: "#t-capsid-walkthrough .cap-meter-value", what: "the uploading percentage" },
      { sel: "#t-scan-0042 .cap-media-state-lead", what: "the upload failed lead" },
      { sel: "#t-scan-0042 .cap-media-reason", what: "the failure reason" },
      { sel: "#t-uptime-report-september .cap-media-doc", what: "a document tile's type" },
    ]);
  });

  test("accessibility: the inspector's labels, help, facts, links and save statuses reach their contrast", async ({
    page,
  }) => {
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

  test("accessibility: the empty states are in the HTML and their words reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "media", theme);
    await expect(page.locator("#empty-search")).toContainText("No files match “fieldnotes”");
    await expect(page.locator("#empty-filter")).toContainText("Nothing in this view");
    await expect(page.locator("#empty-bin")).toContainText("Trash is empty");
    await expect(page.locator("#empty-library")).toContainText("Nothing here yet");
    await expectContrast(page, [
      { sel: "#empty-search .cap-empty-title", what: "the nothing matches title" },
      { sel: "#empty-search .cap-empty-text", what: "the nothing matches text" },
      { sel: "#empty-bin .cap-empty-text", what: "the empty Trash text" },
      { sel: "#empty-library .cap-empty-text", what: "the empty library text" },
    ]);
  });

  test(
    "accessibility: each tile is one named link, a named checkbox and its states in words",
    { tag: "@markup" },
    async ({ page }) => {
      await visitStates(page, "media", theme);
      await expect(page.locator("#t-launch-hero")).toMatchAriaSnapshot(`
      - listitem:
        - link "launch-hero.jpg JPEG · 412 kB"
        - checkbox "Select launch-hero.jpg"
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
      await expect(page.locator("#t-project-tree .cap-status")).toHaveText("Decorative");
      await expect(page.locator("#t-uptime-strip .cap-status")).toHaveText("No alt text");
    },
  );

  test(
    "accessibility: an uploading tile is a progress bar named Uploading; a failed one names its reason and Retry",
    { tag: "@markup" },
    async ({ page }) => {
      await visitStates(page, "media", theme);
      const bar = page
        .locator("#t-capsid-walkthrough")
        .getByRole("progressbar", { name: "Uploading" });
      await expect(bar).toHaveJSProperty("value", 62);
      await expect(bar).toHaveAttribute(
        "aria-valuetext",
        "62 percent of capsid-walkthrough.png uploaded",
      );
      await expect(page.locator("#t-capsid-walkthrough .cap-media-open")).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      await expect(page.locator("#t-scan-0042")).toContainText("Upload failed");
      await expect(page.locator("#t-scan-0042")).toContainText(
        "The file is 6 MB and the limit is 5 MB.",
      );
      await expect(
        page.locator("#t-scan-0042").getByRole("button", { name: "Retry uploading scan-0042.png" }),
      ).toBeVisible();
      await expect(
        page.locator("#t-old-logo").getByRole("button", { name: "Restore old-logo.png" }),
      ).toBeVisible();
    },
  );

  test(
    "accessibility: thumbnails load lazily with a size, and the frame keeps its space without the picture",
    { tag: "@markup" },
    async ({ page }) => {
      await visitStates(page, "media", theme);
      const img = page.locator("#t-launch-hero img");
      await expect(img).toHaveAttribute("loading", "lazy");
      await expect(img).toHaveAttribute("width", "320");
      await expect(img).toHaveAttribute("height", "320");
      const frame = page.locator("#t-launch-hero .cap-media-thumb");
      const before = await frame.boundingBox();
      await img.evaluate((el) => el.removeAttribute("src"));
      const after = await frame.boundingBox();
      expect(
        before && after && Math.abs(before.height - after.height) < 1 && after.height > 50,
      ).toBe(true);
    },
  );

  test(
    "accessibility: the inspector is a named dialog with labeled fields and a live save status",
    { tag: "@markup" },
    async ({ page }) => {
      await visitStates(page, "media", theme);
      const ins = page.locator("#ins-static-ins");
      await expect(ins).toHaveAccessibleName("uptime-strip.png");
      await expect(ins.getByLabel("Alt text")).toHaveAccessibleDescription(/Leave out “image of”/);
      await expect(ins.getByRole("checkbox", { name: "Decorative image" })).not.toBeChecked();
      await expect(ins.getByLabel("Title")).toBeVisible();
      await expect(ins.getByLabel("Caption")).toBeVisible();
      await expect(ins.getByLabel("Add a tag")).toBeVisible();
      await expect(ins.getByRole("textbox", { name: "Address" })).toHaveValue(
        "https://example.com/media/uptime-strip.png",
      );
      await expect(ins.locator("[data-cap-part=save-status]")).toHaveAttribute("role", "status");
      await expect(ins.locator("[data-cap-part=save-error]")).toHaveAttribute("role", "alert");
      await expect(
        ins.getByRole("link", { name: "Why the uptime strip counts gaps" }),
      ).toHaveAttribute("href", "/admin/posts/uptime-gaps/edit");
    },
  );

  test(
    "accessibility: the delivered HTML has the tiles and the active file's inspector",
    { tag: "@markup" },
    async ({ page }) => {
      const html = await (await page.request.get("components/media/states.html")).text();
      expect(html).toContain('data-label="launch-hero.jpg"');
      expect(html).toContain("No alt text");
      expect(html).toContain("Not used anywhere.");
      expect(html).toContain('class="cap-dialog cap-media-inspector"');
      expect(html).toContain("The status dashboard with three sites reporting healthy");
      expect(html).toContain('data-alt="decorative"');
      expect(html).toContain('<progress class="cap-meter-bar" max="100" value="62"');
    },
  );

  test(
    "accessibility: a decorative file is a different state from a missing one, and says so in words",
    { tag: "@markup" },
    async ({ page }) => {
      await visitStates(page, "media", theme);
      const deco = page.locator("#ins-deco");
      await expect(deco.getByRole("checkbox", { name: "Decorative image" })).toBeChecked();
      await expect(deco.getByLabel("Alt text")).toBeDisabled();
      await expect(deco.getByLabel("Alt text")).toHaveValue("");
      await expect(page.locator("#t-project-tree")).toHaveAttribute("data-alt", "decorative");
      await expect(page.locator("#t-uptime-strip")).toHaveAttribute("data-alt", "missing");
    },
  );

  // keyboard

  test("keyboard: Tab enters the grid at the active tile only, then its checkbox, then leaves", async ({
    page,
  }) => {
    await library(page, theme);
    const tabs = await page
      .locator(".cap-media-open")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).tabIndex));
    expect(tabs.filter((t) => t === 0)).toHaveLength(1);
    await link(page, FOX).focus();
    await page.keyboard.press("Tab");
    await expect(tile(page, FOX).getByRole("checkbox")).toBeFocused();
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => !!document.activeElement?.closest(".cap-media-grid"));
    expect(inside).toBe(false);
  });

  test("keyboard: the arrow keys move between tiles in two dimensions, Home and End to the first and last", async ({
    page,
  }) => {
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
    // Page coordinates, since moving focus to the next row may scroll it into view.
    const top = () =>
      page.evaluate(() => {
        const r = document.activeElement?.closest(".cap-media-tile")?.getBoundingClientRect();
        return r ? r.top + window.scrollY : null;
      });
    const here = await top();
    await page.keyboard.press("ArrowDown");
    const there = await top();
    expect(there !== null && here !== null && there > here).toBe(true);
    await page.keyboard.press("ArrowUp");
    await expect(link(page, FOX)).toBeFocused();
    await page.keyboard.press("End");
    await expect(link(page, "mention-queue.png")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(link(page, "capsid-walkthrough.png")).toBeFocused();
  });

  test("keyboard: arrow keys reach the uploading and failed tiles, and Enter on them opens nothing", async ({
    page,
  }) => {
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
    const stops = await page
      .locator(".cap-media-open")
      .evaluateAll((els) =>
        els.map((e) => [
          (e as HTMLElement).closest(".cap-media-tile")?.getAttribute("data-label"),
          (e as HTMLElement).tabIndex,
        ]),
      );
    expect(stops.filter(([, t]) => t === 0)).toEqual([["project-tree.svg", 0]]);
  });

  test("keyboard: Enter on a tile opens its inspector and puts focus in the alt text", async ({
    page,
  }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await expect(inspector(page).getByRole("heading", { name: UPTIME })).toBeVisible();
    await expect(alt(page)).toBeFocused();
    expect(await inspector(page).evaluate((el: HTMLDialogElement) => el.matches(":modal"))).toBe(
      false,
    );
  });

  test("keyboard: with the inspector open, arrow keys move between tiles and it follows; focus stays in the grid", async ({
    page,
  }) => {
    await library(page, theme);
    await link(page, FOX).focus();
    await page.keyboard.press("ArrowRight");
    await expect(link(page, UPTIME)).toBeFocused();
    await expect(inspector(page).getByRole("heading", { name: UPTIME })).toBeVisible();
    await expect(link(page, UPTIME)).toHaveAttribute("aria-current", "true");
    await expect(link(page, FOX)).not.toHaveAttribute("aria-current", "true");
    await page.keyboard.press("ArrowRight");
    await expect(inspector(page).getByRole("heading", { name: "project-tree.svg" })).toBeVisible();
    await expect(link(page, "project-tree.svg")).toBeFocused();
  });

  test("keyboard: Alt and an arrow in a field moves to the next file and keeps focus in the field", async ({
    page,
  }) => {
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

  test("keyboard: Esc in an inspector field returns focus to the active tile and leaves the pane open", async ({
    page,
  }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await expect(link(page, UPTIME)).toBeFocused();
    await expect(inspector(page)).toBeVisible();
  });

  test("keyboard: Enter on Close closes the pane and focus goes back to the tile", async ({
    page,
  }) => {
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

  test("keyboard: x toggles a selection too, and does nothing when single keys are off", async ({
    page,
  }) => {
    await library(page, theme);
    await link(page, UPTIME).focus();
    await page.keyboard.press("x");
    await expect(tile(page, UPTIME).getByRole("checkbox")).toBeChecked();
    await page.evaluate(() => (document.documentElement.dataset.capSingleKeys = "off"));
    await page.keyboard.press("x");
    await expect(tile(page, UPTIME).getByRole("checkbox")).toBeChecked();
  });

  test("keyboard: Esc in the grid clears the selection and hides the bulk bar", async ({
    page,
  }) => {
    await library(page, theme);
    await expect(page.locator("#library-bulk")).toBeVisible();
    await link(page, FOX).focus();
    await page.keyboard.press("Escape");
    await expect(page.locator("#library-bulk")).toBeHidden();
    await expect(tile(page, "mention-queue.png")).not.toHaveAttribute("data-selected", "");
  });

  test("keyboard: Enter in the tag field adds a tag, which saves; Enter on its chip removes it", async ({
    page,
  }) => {
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
    await expect(inspector(page).getByRole("button", { name: "Remove tag reports" })).toHaveCount(
      0,
    );
    await expect(tile(page, UPTIME)).toHaveAttribute("data-tags", "");
  });

  test("keyboard: Enter and Space on Copy address copy it and say so in a live region", async ({
    page,
  }) => {
    await library(page, theme);
    const copy = inspector(page).getByRole("button", { name: "Copy address" });
    await copy.focus();
    await page.keyboard.press("Enter");
    await expect(inspector(page).locator("[data-cap-part=copied]")).toHaveText(
      "Copied the address.",
    );
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "https://example.com/media/launch-hero.jpg",
    );
    await page.evaluate(() => navigator.clipboard.writeText("something else"));
    await page.waitForTimeout(50);
    await copy.focus();
    await page.keyboard.press("Space");
    await expect(inspector(page).locator("[data-cap-part=copied]")).toHaveText(
      "Copied the address.",
    );
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "https://example.com/media/launch-hero.jpg",
    );
  });

  test("keyboard: Enter on Retry asks for the upload again", async ({ page }) => {
    await library(page, theme);
    await page.evaluate(() => {
      (window as unknown as { retried: string[] }).retried = [];
      document.addEventListener("cap-media-retry", (e) =>
        (window as unknown as { retried: string[] }).retried.push((e as CustomEvent).detail.key),
      );
    });
    await link(page, "scan-0042.png").focus();
    await page.keyboard.press("Tab");
    await expect(
      tile(page, "scan-0042.png").getByRole("button", { name: "Retry uploading scan-0042.png" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => (window as unknown as { retried: string[] }).retried)).toEqual(
      ["media/scan-0042.png"],
    );
  });

  test("keyboard: Enter on Restore puts a file in Trash back, with Undo", async ({ page }) => {
    await library(page, theme);
    await page.getByRole("radio", { name: /Trash/ }).check();
    await expect(page.locator(".cap-media-tile:not([hidden])")).toHaveCount(1);
    await link(page, "old-logo.png").focus();
    await page.keyboard.press("Tab");
    await expect(
      tile(page, "old-logo.png").getByRole("button", { name: "Restore old-logo.png" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator(".cap-message-item")).toContainText(
      "Restored old-logo.png to the library.",
    );
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
    await expect(tile(page, "old-logo.png")).toBeHidden();
  });

  test("keyboard: in a narrow container Enter opens the inspector as a modal sheet, Esc closes it, focus returns to the tile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 420, height: 800 });
    await library(page, theme, "sheet");
    await expect(inspector(page)).toBeHidden();
    await link(page, FOX).focus();
    await page.keyboard.press("Enter");
    await expect(inspector(page)).toBeVisible();
    expect(await inspector(page).evaluate((el: HTMLDialogElement) => el.matches(":modal"))).toBe(
      true,
    );
    await expect(alt(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(inspector(page)).toBeHidden();
    await expect(link(page, FOX)).toBeFocused();
  });
});
