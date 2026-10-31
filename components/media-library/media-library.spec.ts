import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, nextPost, visitStates } from "../../test/helpers.ts";
import { applyChanges, countLine, emptyWords, filesToOpen, groupRows, lensChips, mediaActions, mediaHref, pickable, readMediaView, uploadRules, withMedia } from "./media-library.ts";

const ALL = { edit: true, publish: true, deleteContent: true, deleteMedia: true, decideMentions: true };
const NONE = { edit: false, publish: false, deleteContent: false, deleteMedia: false, decideMentions: false };
const OFFERS = { upload: { maxBytes: 5 * 1024 * 1024, types: ["image/png", "application/pdf"] }, alt: true, tags: true, trash: true, delete: true };
const intents = (o: ReturnType<typeof mediaActions>) => o.bulk.map((a) => a.intent);

test("behavior: an action is offered only where the site supports it and the person may run it, and delete is for good", () => {
  expect(intents(mediaActions({ offers: OFFERS, can: ALL, query: {} }))).toEqual(["tag-add", "tag-remove", "trash"]);
  // From Trash: restore, or delete for good.
  const bin = mediaActions({ offers: OFFERS, can: ALL, query: { view: "trash" } });
  expect(intents(bin)).toEqual(["restore", "delete"]);
  expect(bin.bulk.find((a) => a.intent === "delete")?.destructive).toBe(true);
  // A site with no Trash deletes from the library.
  expect(intents(mediaActions({ offers: { ...OFFERS, trash: false }, can: ALL, query: {} }))).toEqual(["tag-add", "tag-remove", "delete"]);
  const bare = mediaActions({ offers: { upload: null, alt: false, tags: false, trash: false, delete: false }, can: ALL, query: {} });
  expect(bare.bulk).toEqual([]);
  expect(bare.withheld).toEqual(["Uploads are not offered by this site.", "Alt text is set at upload here: this site cannot change it afterwards.", "Tags are not offered: this site keeps no tags on its files.", "Delete is not offered: this site cannot delete files."]);
  const reader = mediaActions({ offers: OFFERS, can: NONE, query: {} });
  expect(reader.bulk).toEqual([]);
  expect(reader.withheld).toEqual(["You can look at these files. Changing them needs an editor's role."]);
});

test("behavior: an address keeps its filters in one order, leaves the defaults out, and a filter change closes the file and starts again", () => {
  const q = { inspect: "a/b.png", cursor: "c-2", tag: "release", q: "fox", view: "library" as const, layout: "grid" as const };
  expect(mediaHref("/media?x=1", q)).toBe("/media?q=fox&tag=release&cursor=c-2&inspect=a%2Fb.png");
  expect(mediaHref("/media", withMedia(q, { tag: "capsid" }))).toBe("/media?q=fox&tag=capsid");
  expect(mediaHref("/media", withMedia(q, { view: "trash", layout: "list" }))).toBe("/media?q=fox&tag=release&view=trash&layout=list");
  // Opening another file keeps the page it is on.
  expect(mediaHref("/media", withMedia(q, { inspect: "c.png" }))).toBe("/media?q=fox&tag=release&cursor=c-2&inspect=c.png");
  expect(mediaHref("/media", withMedia(q, { inspect: undefined }))).toBe("/media?q=fox&tag=release&cursor=c-2");
});

test("behavior: a sort runs its own way unless told, a display change keeps the open file, and groups come from the page's ids and UTC months", () => {
  const q = { inspect: "a/b.png", cursor: "c-2", q: "fox" };
  // Each sort's own direction is left out of the address; a new sort drops the old direction.
  expect(mediaHref("/media", withMedia(q, { sort: "name" }))).toBe("/media?q=fox&sort=name");
  expect(mediaHref("/media", withMedia({ sort: "name", dir: "desc" }, { sort: "size" }))).toBe("/media?sort=size");
  expect(mediaHref("/media", { sort: "added", dir: "asc" })).toBe("/media?dir=asc");
  // Layout, size and grouping change only the drawing: the page and the open file stay.
  expect(mediaHref("/media", withMedia(q, { group: "month", size: "s" }))).toBe("/media?q=fox&size=s&group=month&cursor=c-2&inspect=a%2Fb.png");
  expect(readMediaView(new URLSearchParams("layout=list&size=xl&group=month"))).toEqual({ layout: "list", group: "month" });
  const rec = (key: string, uploaded?: string) => ({ key, name: key, url: `/m/${key}`, kind: "image" as const, type: "image/png", bytes: 1, alt: "", altState: "missing" as const, title: "", caption: "", tags: [], used: [], state: "ready" as const, uploaded });
  const rows = [rec("2026/09/a.png", "2026-09-30T23:30:00-05:00"), rec("logo.png"), rec("2026/09/b.png", "2026-09-02")];
  expect(groupRows(rows, "folder")?.map((g) => [g.label, g.items.length])).toEqual([["2026/09", 2], ["Top level", 1]]);
  expect(groupRows(rows, "month")?.map((g) => g.label)).toEqual(["October 2026", "No upload date", "September 2026"]);
  expect(groupRows(rows, undefined)).toBeNull();
  // Only the contract's lenses the site names get a chip, in words, with a host's own after them.
  expect(lensChips({ offers: { ...OFFERS, lenses: ["no-alt", "made-up"] }, extra: { lenses: [{ id: "no-alt", label: "x", count: 3 }, { id: "duplicates", label: "Duplicates" }] } }).map((l) => [l.id, l.label, l.count])).toEqual([["no-alt", "No alt text", 3], ["duplicates", "Duplicates", undefined]]);
});

test("behavior: the count, the empty state, the upload rules and the picker's files", () => {
  const rec = (key: string, over: object = {}) => ({ key, name: key, url: `/m/${key}`, kind: "image" as const, type: "image/png", bytes: 1, alt: "", altState: "missing" as const, title: "", caption: "", tags: [], used: [], state: "ready" as const, ...over });
  const rows = [rec("a"), rec("b", { kind: "document", type: "application/pdf" }), rec("c", { state: "uploading" }), rec("d", { state: "binned" })];
  expect(countLine({ rows, page: { nextCursor: null }, query: { view: "trash" } })).toBe("4 files in Trash");
  expect(countLine({ rows, page: { nextCursor: "n", total: 90 }, query: {} })).toBe("Showing 4 of 90 files");
  expect(emptyWords({ view: "trash" }).title).toBe("Trash is empty");
  expect(emptyWords({ q: "survey", view: "trash" })).toMatchObject({ kind: "no-match", title: "No files match “survey”" });
  expect(uploadRules({ maxBytes: 5 * 1024 * 1024, types: ["image/png", "application/pdf"] })).toEqual({ accept: "image/png,application/pdf", hint: expect.stringMatching(/, up to 5 MB\.$/) });
  // The picker uploads images only, and none where the site takes no images.
  expect(uploadRules({ maxBytes: 1024, types: ["image/png", "application/pdf"] }, true)?.accept).toBe("image/png");
  expect(uploadRules({ maxBytes: 1024, types: ["application/pdf"] }, true)).toBeNull();
  expect(pickable(rows).map((r) => r.key)).toEqual(["a"]);
});


test("behavior: others' changes replace a tile, leave the view they no longer match, and are counted when not on the page; an upload's outcome links the file", () => {
  const rec = (key: string, over: object = {}) => ({ key, name: key, url: `/m/${key}`, kind: "image" as const, type: "image/png", bytes: 1, alt: "", altState: "missing" as const, title: "", caption: "", tags: ["river"], used: [], state: "ready" as const, ...over });
  const rows = [rec("a"), rec("b"), rec("c")];
  const changed = new Map([
    ["a", rec("a", { alt: "Now described", version: "v9" })],
    ["b", rec("b", { state: "binned" as const })],
    ["c", null],
    ["d", rec("d")],
    ["e", rec("e", { tags: [] })],
  ]);
  const out = applyChanges(rows, changed, { tag: "river" });
  expect(out.rows.map((r) => [r.key, r.alt])).toEqual([["a", "Now described"]]);
  // d is new and would show here; e no longer carries the tag, so it would not.
  expect([out.updated, out.elsewhere]).toEqual([3, 1]);
  // The kit's outcomes: the file already stored, a new one, and a turned copy.
  expect(
    filesToOpen({
      outcomes: [
        { id: "x", ok: true, duplicate: true, message: "bay.png is already in the library as bay-dusk.png, so no second copy was stored." },
        { id: "y", ok: true, message: "Uploaded. Filled in from the file: credit." },
        { id: "z", ok: true, copyId: "z-turned", message: "Saved the turned picture as a new file." },
        { id: "w", ok: false, message: "Uploaded." },
      ],
    }),
  ).toEqual([{ id: "x", why: "duplicate" }, { id: "y", why: "new" }, { id: "z-turned", why: "copy" }]);
  // The model's suggestions are for one file: asking is in the address, and moving on drops it.
  expect(mediaHref("/media", withMedia({ kind: "image" }, { inspect: "a.png", suggest: true }))).toBe("/media?kind=image&inspect=a.png&suggest=1");
  expect(mediaHref("/media", withMedia({ inspect: "a.png", suggest: true }, { inspect: "b.png" }))).toBe("/media?inspect=b.png");
});


const log = (page: Page) => page.evaluate(() => (window as unknown as { mediaLog: Array<Record<string, string | string[]>> }).mediaLog);
const editor = (page: Page) => page.locator("[data-mount='editor']");

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    await expect(editor(page).locator(".cap-media-tile")).toHaveCount(5);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the quiet text reaches its contrast", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    await expectContrast(page, [
      { sel: "[data-mount='editor'] .cap-media-lib-count", what: "the count" },
      { sel: "[data-mount='limited'] .cap-media-lib-withheld li", what: "why an action is withheld" },
      { sel: "[data-mount='editor'] .cap-chip[aria-current]", what: "the current tag chip" },
      { sel: "[data-mount='picker-step'] .cap-field-help", what: "the alt step's help" },
    ]);
  });

  test("accessibility: a reader's library is a named region of filters, files and no boxes", { tag: "@markup" }, async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const limited = page.locator("[data-mount='limited']");
    await expect(limited).toMatchAriaSnapshot(`
      - region "Files":
        - search "Find files":
          - text: Search
          - searchbox "Search"
          - button "Show"
        - navigation "Narrow the files":
          - list "Tags":
            - listitem:
              - link "Any tag"
        - paragraph: 5 files
        - navigation "Show as":
          - link "Grid"
          - link "List"
        - list:
          - listitem: You can look at these files. Changing them needs an editor's role.
        - list "Files"
    `);
    await expect(limited.getByRole("checkbox")).toHaveCount(0);
    await expect(limited.getByRole("button", { name: "Upload" })).toHaveCount(0);
  });

  test("behavior: with no script, a tile links to its inspector, the bar posts the ticked files, upload is a multipart form, and the inspector's fields are forms", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = page.locator("#media-static");
    await expect(lib.locator(".cap-media-tile[data-key='2026/09/uptime-strip.png'] .cap-media-open")).toHaveAttribute("href", "/media?inspect=2026%2F09%2Fuptime-strip.png");
    await expect(lib.locator(".cap-bulk-count")).toHaveText("Tick the files to act on");
    let posted = nextPost(page, "#media-static");
    await lib.getByRole("checkbox", { name: "Select uptime-strip.png" }).check({ force: true });
    await lib.getByRole("checkbox", { name: "Select divider.png" }).check({ force: true });
    await lib.getByRole("button", { name: "Move to Trash" }).first().click();
    // Each box's version is posted under its id, which the content kit reads for the ticked ones.
    expect((await posted).fields).toMatchObject({ ids: ["2026/09/uptime-strip.png", "2026/09/divider.png"], tags: [""], intent: ["trash"], "version:2026/09/uptime-strip.png": ["v1"], "version:2026/09/divider.png": ["v1"] });
    // The inspector is open on the file the address named, in form mode.
    const ins = lib.getByRole("dialog", { name: "launch-hero.png" });
    await expect(ins.getByRole("link", { name: "Close" })).toHaveAttribute("href", "/media");
    posted = nextPost(page, "#media-static");
    await ins.getByRole("textbox", { name: "Alt text" }).fill("The status dashboard");
    await ins.getByRole("button", { name: "Save alt text" }).click();
    expect((await posted).fields).toEqual({ intent: ["alt"], ids: ["2026/09/launch-hero.png"], versions: ["v1"], alt: ["The status dashboard"] });
    posted = nextPost(page, "#media-static");
    await ins.getByRole("textbox", { name: "Tags" }).fill("release, launch");
    await ins.getByRole("button", { name: "Save tags" }).click();
    expect((await posted).fields).toEqual({ intent: ["tags"], ids: ["2026/09/launch-hero.png"], versions: ["v1"], tags: ["release, launch"] });
    // The focal point posts its two percents; Replace is a multipart form of its own.
    posted = nextPost(page, "#media-static");
    await ins.locator("summary", { hasText: "Focal point" }).click();
    await ins.getByRole("spinbutton", { name: "From the left (%)" }).fill("25");
    await ins.getByRole("button", { name: "Save focal point" }).click();
    expect((await posted).fields).toMatchObject({ intent: ["focus"], ids: ["2026/09/launch-hero.png"], x: ["25"], y: ["40"] });
    posted = nextPost(page, "#media-static");
    await ins.locator("summary", { hasText: "Replace the file" }).click();
    const replace = ins.getByRole("form", { name: "Replace the file" });
    await replace.locator("input[type=file]").setInputFiles({ name: "hero.png", mimeType: "image/png", buffer: Buffer.from("png") });
    await replace.getByRole("button", { name: "Replace" }).click();
    const swapped = await posted;
    expect(swapped.enctype).toBe("multipart/form-data");
    expect(swapped.fields).toMatchObject({ intent: ["replace"], ids: ["2026/09/launch-hero.png"], file: ["file:hero.png"] });
    // Upload is checked against the site's limits before any byte is sent, and posts the file with its alt text.
    const upload = lib.getByRole("form", { name: "Upload a file" });
    await expect(upload.locator("input[type=file]")).toHaveAttribute("accept", "image/png,image/jpeg,image/webp,application/pdf");
    posted = nextPost(page, "#media-static");
    await upload.locator("input[type=file]").setInputFiles({ name: "survey.png", mimeType: "image/png", buffer: Buffer.from("png") });
    await upload.getByRole("textbox", { name: "Alt text" }).fill("Survey sketches");
    await upload.getByRole("button", { name: "Upload" }).click();
    const sent = await posted;
    expect(sent.enctype).toBe("multipart/form-data");
    expect(sent.fields).toEqual({ intent: ["upload"], file: ["file:survey.png"], alt: ["Survey sketches"] });
  });

  test("behavior: with script, opening a file reads where it is used, and the inspector saves by itself", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = editor(page);
    // A list of files does not know where each is used, so no tile says Unattached.
    await expect(lib.locator(".cap-media-flags")).not.toContainText(["Unattached"]);
    await lib.locator(".cap-media-tile[data-key='2026/09/launch-hero.png'] .cap-media-open").focus();
    await page.keyboard.press("Enter");
    const ins = lib.getByRole("dialog", { name: "launch-hero.png" });
    await expect(ins.getByRole("link", { name: "Notes on the spring release" })).toBeVisible();
    await expect(ins.getByRole("textbox", { name: "Alt text" })).toBeFocused();
    await page.keyboard.press("Control+End");
    await page.keyboard.type(", in September");
    await expect.poll(async () => (await log(page)).filter((e) => e.intent === "alt").length, { timeout: 4000 }).toBeGreaterThan(0);
    await expect(ins.locator("[data-cap-part='save-status']")).toHaveText("Saved");
    // Only the field that changed is saved, as the content kit's own intent.
    const saves = (await log(page)).filter((e) => e.intent === "alt");
    expect(saves.at(-1)).toMatchObject({ ids: "2026/09/launch-hero.png", versions: "v1", alt: "The status dashboard with three sites reporting healthy, in September" });
    expect((await log(page)).some((e) => e.intent === "tags" || e.intent === "save")).toBe(false);
    // The next field saves on the version the alt text's write made, so the site takes it.
    await ins.getByRole("textbox", { name: "Add a tag" }).fill("launch");
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await log(page)).filter((e) => e.intent === "tags").length, { timeout: 4000 }).toBeGreaterThan(0);
    await expect(ins.locator("[data-cap-part='save-status']")).toHaveText("Saved");
    const tagged = (await log(page)).filter((e) => e.intent === "tags").at(-1);
    expect(tagged).toMatchObject({ tags: "release, dashboard, launch" });
    expect(tagged?.versions).not.toBe("v1");
  });

  test("keyboard: Ctrl K finds a file and opens it, and Esc on a tile closes its details", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = editor(page);
    await page.locator("h1").click();
    await page.keyboard.press("Control+k");
    const menu = page.getByRole("dialog", { name: "Command menu" });
    await menu.getByRole("combobox").fill("uptime-s");
    await expect(menu.getByRole("option", { name: "Copy the address of uptime-strip.png" })).toBeVisible();
    await expect(menu.getByRole("option", { name: /uptime-strip\.png/ }).first()).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(lib.getByRole("dialog", { name: "uptime-strip.png" })).toBeVisible();
    await lib.locator(".cap-media-tile[data-key='2026/09/uptime-strip.png'] .cap-media-open").focus();
    await page.keyboard.press("Escape");
    await expect(lib.getByRole("dialog", { name: "uptime-strip.png" })).toHaveCount(0);
    await expect(lib.locator(".cap-media-tile[data-key='2026/09/uptime-strip.png'] .cap-media-open")).toBeFocused();
  });

  test("behavior: with script, Crop loads its editor when pressed and saves the crop as a new file", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = editor(page);
    await lib.locator(".cap-media-tile[data-key='2026/09/launch-hero.png'] .cap-media-open").click();
    const ins = lib.getByRole("dialog", { name: "launch-hero.png" });
    await ins.locator("summary", { hasText: "Crop or replace the file" }).click();
    await ins.getByRole("button", { name: "Crop launch-hero.png" }).click();
    const crop = page.getByRole("dialog", { name: "Crop launch-hero.png" });
    await crop.getByRole("combobox", { name: "Shape" }).selectOption({ label: "Square, 1:1" });
    await crop.getByRole("button", { name: "Save as a new file" }).click();
    await expect(crop).toHaveCount(0);
    const made = (await log(page)).filter((e) => e.intent === "upload").at(-1);
    expect(made).toMatchObject({ intent: "upload", file: expect.stringMatching(/^file:launch-hero-crop.*\.png$/) });
  });

  test("behavior: Grid or List and the tile size are remembered in this browser", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    await editor(page).getByRole("navigation", { name: "Show as" }).getByRole("link", { name: "List" }).click();
    await expect(editor(page).locator(".cap-media")).toHaveAttribute("data-view", "list");
    await page.reload();
    await expect(editor(page).locator(".cap-media")).toHaveAttribute("data-view", "list");
  });

  test("keyboard: with script, Move to Trash runs at once with Undo, and z brings the files back", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = editor(page);
    await lib.getByRole("checkbox", { name: "Select uptime-strip.png" }).check({ force: true });
    await lib.getByRole("checkbox", { name: "Select divider.png" }).check({ force: true });
    await lib.getByRole("region", { name: "Bulk actions on files" }).getByRole("button", { name: "Move to Trash" }).click();
    await expect(lib.locator(".cap-media-tile")).toHaveCount(3);
    await expect(lib.locator(".cap-message-item")).toContainText("Moved 2 files to Trash.");
    await page.locator("h1").click();
    await page.keyboard.press("z");
    await expect(lib.locator(".cap-media-tile")).toHaveCount(5);
    await expect(lib.locator(".cap-message-item")).toContainText("Restored 2 files.");
  });

  test("keyboard: with script, Delete for good from Trash asks first with the count, and a refused file says where it is used", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = editor(page);
    await lib.getByRole("link", { name: /^Trash/ }).click();
    await expect(lib.locator(".cap-media-tile")).toHaveCount(2);
    await lib.getByRole("checkbox", { name: "Select old-logo.png" }).check({ force: true });
    await lib.getByRole("checkbox", { name: "Select scan-0042.png" }).check({ force: true });
    await lib.getByRole("button", { name: "Delete for good" }).focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("alertdialog", { name: "Delete 2 files for good?" });
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await expect(dialog.getByRole("listitem")).toHaveText(["old-logo.png", "scan-0042.png"]);
    await dialog.getByRole("textbox").fill("2");
    await dialog.getByRole("button", { name: "Delete 2 files" }).click();
    const outcomes = lib.getByRole("group", { name: "1 done, 1 not done." });
    await expect(outcomes.locator(".cap-bulk-results-list > li").first()).toContainText("Not done old-logo.png Still used, so the site kept it.");
    await expect(outcomes.locator(".cap-bulk-result-uses")).toHaveText("About (image in the body)");
    await expect(lib.locator(".cap-media-tile")).toHaveCount(1);
  });

  test("behavior: the picker offers images only and will not insert one without alt text, unless it is said to be decorative", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const picker = page.locator("[data-mount='picker']");
    await expect(picker.locator(".cap-media-tile")).toHaveCount(4);
    await expect(picker.getByRole("checkbox")).toHaveCount(0);
    await picker.locator(".cap-media-tile[data-key='2026/09/uptime-strip.png'] .cap-media-open").click();
    const step = picker.getByRole("form", { name: "Alt text for uptime-strip.png" });
    const alt = step.getByRole("textbox", { name: "Alt text (required)" });
    await expect(alt).toBeFocused();
    // Nothing is suggested from the file's name (the checklist's B2).
    await expect(step).not.toContainText("uptime strip");
    await step.getByRole("button", { name: "Insert", exact: true }).click();
    await expect(page.locator("#picked")).toHaveText("");
    expect(await alt.evaluate((el: HTMLTextAreaElement) => el.validity.valueMissing)).toBe(true);
    await alt.fill("The uptime strip, with two gaps");
    await step.getByRole("button", { name: "Insert", exact: true }).click();
    await expect(page.locator("#picked")).toHaveText("Picked 2026/09/uptime-strip.png with alt text “The uptime strip, with two gaps”.");
    await alt.fill("");
    await step.getByRole("button", { name: "Insert as decorative" }).click();
    await expect(page.locator("#picked")).toHaveText("Picked 2026/09/uptime-strip.png with alt text “”.");
  });

  test("behavior: the picker shows the model's alt text and fills the field only when asked", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const step = page.locator("[data-mount='picker-suggest']").getByRole("form", { name: "Alt text for uptime-strip.png" });
    const alt = step.getByRole("textbox", { name: "Alt text (required)" });
    await expect(step).toContainText("@cf/example/vision suggests: “A row of green bars with two short red gaps”");
    await expect(alt).toHaveValue("");
    await step.getByRole("button", { name: "Use it" }).click();
    await expect(alt).toHaveValue("A row of green bars with two short red gaps");
    await expect(alt).toBeFocused();
  });

  test("behavior: with no script, the picker's alt step posts the file and its alt text", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const step = page.locator("[data-mount='picker-step']").getByRole("form", { name: "Alt text for uptime-strip.png" });
    await expect(step.getByRole("link", { name: "Choose another" })).toHaveAttribute("href", "/media");
    const posted = nextPost(page, "[data-mount='picker-step']");
    await step.getByRole("textbox", { name: "Alt text (required)" }).fill("The uptime strip");
    await step.getByRole("button", { name: "Insert", exact: true }).click();
    expect((await posted).fields).toEqual({ intent: ["pick"], ids: ["2026/09/uptime-strip.png"], alt: ["The uptime strip"] });
  });

  test("behavior: with no script, each media idea of site-api v0.13.0 is a form posting the kit's intent, or a link", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = page.locator("#media-ideas-static");
    const ins = lib.getByRole("dialog", { name: "bay-dusk.png" });
    const ident = { ids: ["2026/10/bay-dusk.png"], versions: ["v1"] };
    await expect(lib.getByRole("link", { name: "Portrait", includeHidden: true })).toHaveAttribute("href", "/media?orientation=portrait&lens=oversized");
    await expect(ins.getByRole("link", { name: "Suggest tags and alt" })).toHaveAttribute("href", "/media?lens=oversized&inspect=2026%2F10%2Fbay-dusk.png&suggest=1");
    await expect(ins.getByRole("link", { name: "bay-copy.png" })).toHaveAttribute("href", "/media?lens=oversized&inspect=2026%2F10%2Fbay-copy.png");
    let posted = nextPost(page, "#media-ideas-static");
    await ins.getByRole("textbox", { name: "License ends" }).fill("2027-12-31");
    await ins.getByRole("button", { name: "Save credit" }).click();
    expect((await posted).fields).toEqual({ intent: ["credit"], ...ident, credit: ["Ada Example"], license: ["CC BY 4.0"], sourceUrl: ["https://photos.example.com/r/1"], licenseExpires: ["2027-12-31"] });
    posted = nextPost(page, "#media-ideas-static");
    await ins.getByRole("button", { name: "Rotate left" }).click();
    expect((await posted).fields).toEqual({ intent: ["transform"], ...ident, op: ["rotate-270"] });
    posted = nextPost(page, "#media-ideas-static");
    await ins.getByRole("button", { name: /^Go back to this version/ }).click();
    expect((await posted).fields).toEqual({ intent: ["revert"], ...ident, to: ["r1"] });
    posted = nextPost(page, "#media-ideas-static");
    await ins.getByRole("button", { name: "Save as alt text" }).click();
    expect((await posted).fields).toEqual({ intent: ["alt"], ...ident, alt: ["The bay at dusk, from the old suspension bridge."] });
    // The resize pass names every oversized picture on the page, with the version each was seen at.
    posted = nextPost(page, "#media-ideas-static");
    await lib.getByRole("button", { name: "Shrink all 2 on this page" }).click();
    expect((await posted).fields).toEqual({ intent: ["resize"], ids: ["2026/10/bay-copy.png", "2026/10/bay-dusk.png"], versions: ["v1", "v1"] });
    posted = nextPost(page, "#media-ideas-static");
    await lib.locator("summary", { hasText: "Import from a web address" }).click();
    await lib.getByRole("textbox", { name: "Web address" }).fill("https://photos.example.com/r/2");
    await lib.getByRole("checkbox", { name: "Keep it at full size" }).last().check();
    await lib.getByRole("button", { name: "Import" }).click();
    expect((await posted).fields).toEqual({ intent: ["import"], url: ["https://photos.example.com/r/2"], alt: [""], resize: ["no"] });
  });

  test("behavior: with script, suggestions load when asked and each is applied only when accepted", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = page.locator("[data-mount='ideas']");
    const ins = lib.getByRole("dialog", { name: "bay-dusk.png" });
    await ins.getByRole("link", { name: "Suggest tags and alt" }).click();
    await expect(ins.getByRole("textbox", { name: "Suggested alt text" })).toHaveValue("The bay at dusk under a pink sky, the suspension bridge in silhouette");
    expect(await log(page)).toEqual([]);
    await ins.getByRole("button", { name: "Add suggested tag bridge" }).click();
    await expect.poll(async () => (await log(page)).length).toBe(1);
    expect((await log(page))[0]).toEqual({ intent: "tag-add", ids: "2026/10/bay-dusk.png", versions: "v1", tags: "bridge" });
  });

  test("behavior: with script, an upload the site already holds links the stored file", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = page.locator("[data-mount='ideas']");
    const upload = lib.getByRole("form", { name: "Upload a file" });
    await upload.locator("input[type=file]").setInputFiles({ name: "bay-again.png", mimeType: "image/png", buffer: Buffer.from("png") });
    await upload.getByRole("button", { name: "Upload" }).click();
    await expect(lib.getByRole("link", { name: "Open bay-dusk.png, the file already stored" })).toHaveAttribute("href", "/media?inspect=2026%2F10%2Fbay-dusk.png");
    await expect(lib.locator(".cap-media-tile")).toHaveCount(4);
  });

  test("behavior: with script, files others changed are put in place and deleted ones leave", async ({ page }) => {
    await page.clock.install();
    await visitStates(page, "media-library", theme);
    const lib = page.locator("[data-mount='ideas']");
    const copy = lib.locator(".cap-media-tile[data-key='2026/10/bay-copy.png']");
    await expect(copy).toContainText("No alt text");
    await page.evaluate(() => {
      const w = window as unknown as { mediaChange: (k: string, a: string) => void; mediaRemove: (k: string) => void };
      w.mediaChange("2026/10/bay-copy.png", "The bay at dusk");
      w.mediaRemove("2026/10/field-notes.pdf");
    });
    await page.clock.runFor(16000);
    await expect(copy).not.toContainText("No alt text");
    await expect(lib.locator(".cap-media-tile")).toHaveCount(3);
    await expect(lib.locator("[data-cap-part='live']")).toContainText("2 files were changed elsewhere");
  });

  test("behavior: the inspector's preview keeps its height above the fields, in a pane shorter than its content", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const ins = page.locator("[data-mount='form'] .cap-media-inspector");
    const preview = await ins.locator(".cap-media-preview").boundingBox();
    const altForm = await ins.getByRole("form", { name: "Alt text" }).boundingBox();
    expect(preview && altForm).toBeTruthy();
    if (!preview || !altForm) return;
    expect(preview.height).toBeGreaterThan(100);
    expect(altForm.y).toBeGreaterThanOrEqual(preview.y + preview.height);
  });
});
