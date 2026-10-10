import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, nextPost, visitStates } from "../../test/helpers.ts";
import { countLine, emptyWords, mediaActions, mediaHref, pickable, uploadRules, withMedia } from "./media-library.ts";

const ALL = { edit: true, publish: true, deleteContent: true, deleteMedia: true, decideMentions: true };
const NONE = { edit: false, publish: false, deleteContent: false, deleteMedia: false, decideMentions: false };
const OFFERS = { upload: { maxBytes: 5 * 1024 * 1024, types: ["image/png", "application/pdf"] }, alt: true, tags: true, trash: true, delete: true };
const intents = (o: ReturnType<typeof mediaActions>) => o.bulk.map((a) => a.intent);

test("behaviour: an action is offered only where the site supports it and the person may run it, and delete is for good", () => {
  expect(intents(mediaActions({ offers: OFFERS, can: ALL, query: {} }))).toEqual(["add-tags", "remove-tags", "trash"]);
  // From the bin: restore, or delete for good.
  const bin = mediaActions({ offers: OFFERS, can: ALL, query: { view: "trash" } });
  expect(intents(bin)).toEqual(["restore", "delete"]);
  expect(bin.bulk.find((a) => a.intent === "delete")?.destructive).toBe(true);
  // A site with no bin deletes from the library.
  expect(intents(mediaActions({ offers: { ...OFFERS, trash: false }, can: ALL, query: {} }))).toEqual(["add-tags", "remove-tags", "delete"]);
  const bare = mediaActions({ offers: { upload: null, alt: false, tags: false, trash: false, delete: false }, can: ALL, query: {} });
  expect(bare.bulk).toEqual([]);
  expect(bare.withheld).toEqual(["Uploads are not offered by this site.", "Alt text is set at upload here: this site cannot change it afterwards.", "Tags are not offered: this site keeps no tags on its files.", "Delete is not offered: this site cannot delete files."]);
  const reader = mediaActions({ offers: OFFERS, can: NONE, query: {} });
  expect(reader.bulk).toEqual([]);
  expect(reader.withheld).toEqual(["You can look at these files. Changing them needs an editor's role."]);
});

test("behaviour: an address keeps its filters in one order, leaves the defaults out, and a filter change closes the file and starts again", () => {
  const q = { inspect: "a/b.png", cursor: "c-2", tag: "release", q: "fox", view: "library" as const, layout: "grid" as const };
  expect(mediaHref("/media?x=1", q)).toBe("/media?q=fox&tag=release&cursor=c-2&inspect=a%2Fb.png");
  expect(mediaHref("/media", withMedia(q, { tag: "capsid" }))).toBe("/media?q=fox&tag=capsid");
  expect(mediaHref("/media", withMedia(q, { view: "trash", layout: "list" }))).toBe("/media?q=fox&tag=release&view=trash&layout=list");
  // Opening another file keeps the page it is on.
  expect(mediaHref("/media", withMedia(q, { inspect: "c.png" }))).toBe("/media?q=fox&tag=release&cursor=c-2&inspect=c.png");
  expect(mediaHref("/media", withMedia(q, { inspect: undefined }))).toBe("/media?q=fox&tag=release&cursor=c-2");
});

test("behaviour: the count, the empty state, the upload rules and the picker's files", () => {
  const rec = (key: string, over: object = {}) => ({ key, name: key, url: `/m/${key}`, kind: "image" as const, type: "image/png", bytes: 1, alt: "", altState: "missing" as const, title: "", caption: "", tags: [], used: [], state: "ready" as const, ...over });
  const rows = [rec("a"), rec("b", { kind: "document", type: "application/pdf" }), rec("c", { state: "uploading" }), rec("d", { state: "binned" })];
  expect(countLine({ rows, page: { nextCursor: null }, query: { view: "trash" } })).toBe("4 files in the bin");
  expect(countLine({ rows, page: { nextCursor: "n", total: 90 }, query: {} })).toBe("Showing 4 of 90 files");
  expect(emptyWords({ view: "trash" }).title).toBe("The bin is empty");
  expect(emptyWords({ q: "lambda", view: "trash" })).toMatchObject({ kind: "no-match", title: "No files match “lambda”" });
  expect(uploadRules({ maxBytes: 5 * 1024 * 1024, types: ["image/png", "application/pdf"] })).toEqual({ accept: "image/png,application/pdf", hint: expect.stringMatching(/, up to 5 MB\.$/) });
  expect(pickable(rows).map((r) => r.key)).toEqual(["a"]);
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

  test("accessibility: a reader's library is a named region of filters, files and no boxes", async ({ page }) => {
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

  test("behaviour: with no script, a tile links to its inspector, the bar posts the ticked files, upload is a multipart form, and the inspector's fields are forms", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = page.locator("#media-static");
    await expect(lib.locator(".cap-media-tile[data-key='2026/09/uptime-strip.png'] .cap-media-open")).toHaveAttribute("href", "/media?inspect=2026%2F09%2Fuptime-strip.png");
    await expect(lib.locator(".cap-bulk-count")).toHaveText("Tick the files to act on");
    let posted = nextPost(page, "#media-static");
    await lib.getByRole("checkbox", { name: "Select uptime-strip.png" }).check({ force: true });
    await lib.getByRole("checkbox", { name: "Select divider.png" }).check({ force: true });
    await lib.getByRole("button", { name: "Move to the bin" }).first().click();
    expect((await posted).fields).toEqual({ ids: ["2026/09/uptime-strip.png", "2026/09/divider.png"], tag: [""], intent: ["trash"] });
    // The inspector is open on the file the address named, in form mode.
    const ins = lib.getByRole("dialog", { name: "foxhound-hero.png" });
    await expect(ins.getByRole("link", { name: "Close" })).toHaveAttribute("href", "/media");
    posted = nextPost(page, "#media-static");
    await ins.getByRole("textbox", { name: "Alt text" }).fill("The Foxhound dashboard");
    await ins.getByRole("button", { name: "Save alt text" }).click();
    expect((await posted).fields).toEqual({ intent: ["save-alt"], ids: ["2026/09/foxhound-hero.png"], version: ["v1"], alt: ["The Foxhound dashboard"] });
    posted = nextPost(page, "#media-static");
    await ins.getByRole("textbox", { name: "Tags" }).fill("release, launch");
    await ins.getByRole("button", { name: "Save tags" }).click();
    expect((await posted).fields).toEqual({ intent: ["save-tags"], ids: ["2026/09/foxhound-hero.png"], version: ["v1"], tags: ["release, launch"] });
    // Upload is checked against the site's limits before any byte is sent, and posts the file with its alt text.
    const upload = lib.getByRole("form", { name: "Upload a file" });
    await expect(upload.locator("input[type=file]")).toHaveAttribute("accept", "image/png,image/jpeg,image/webp,application/pdf");
    posted = nextPost(page, "#media-static");
    await upload.locator("input[type=file]").setInputFiles({ name: "lambda.png", mimeType: "image/png", buffer: Buffer.from("png") });
    await upload.getByRole("textbox", { name: "Alt text" }).fill("Lambda plaques");
    await upload.getByRole("button", { name: "Upload" }).click();
    const sent = await posted;
    expect(sent.enctype).toBe("multipart/form-data");
    expect(sent.fields).toEqual({ intent: ["upload"], file: ["file:lambda.png"], alt: ["Lambda plaques"] });
  });

  test("behaviour: with script, opening a file reads where it is used, and the inspector saves by itself", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = editor(page);
    // A list of files does not know where each is used, so no tile says Unattached.
    await expect(lib.locator(".cap-media-flags")).not.toContainText(["Unattached"]);
    await lib.locator(".cap-media-tile[data-key='2026/09/foxhound-hero.png'] .cap-media-open").focus();
    await page.keyboard.press("Enter");
    const ins = lib.getByRole("dialog", { name: "foxhound-hero.png" });
    await expect(ins.getByRole("link", { name: "Notes on the Foxhound release" })).toBeVisible();
    await expect(ins.getByRole("textbox", { name: "Alt text" })).toBeFocused();
    await page.keyboard.press("Control+End");
    await page.keyboard.type(", in September");
    await expect.poll(async () => (await log(page)).filter((e) => e.intent === "save").length, { timeout: 4000 }).toBeGreaterThan(0);
    await expect(ins.locator("[data-cap-part='save-status']")).toHaveText("Saved");
    const saves = (await log(page)).filter((e) => e.intent === "save");
    expect(saves.at(-1)).toMatchObject({ ids: "2026/09/foxhound-hero.png", version: "v1", alt: "The Foxhound dashboard with three sites reporting healthy, in September", tags: "release, foxhound" });
  });

  test("keyboard: with script, Move to the bin runs at once with Undo, and z brings the files back", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = editor(page);
    await lib.getByRole("checkbox", { name: "Select uptime-strip.png" }).check({ force: true });
    await lib.getByRole("checkbox", { name: "Select divider.png" }).check({ force: true });
    await lib.getByRole("region", { name: "Bulk actions on files" }).getByRole("button", { name: "Move to the bin" }).click();
    await expect(lib.locator(".cap-media-tile")).toHaveCount(3);
    await expect(lib.locator(".cap-message-item")).toContainText("Moved 2 files to the bin.");
    await page.locator("h1").click();
    await page.keyboard.press("z");
    await expect(lib.locator(".cap-media-tile")).toHaveCount(5);
    await expect(lib.locator(".cap-message-item")).toContainText("Restored 2 files.");
  });

  test("keyboard: with script, Delete for good from the bin asks first with the count, and a refused file says where it is used", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const lib = editor(page);
    await lib.getByRole("link", { name: /^Bin/ }).click();
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

  test("behaviour: the picker offers images only and will not insert one without alt text, unless it is said to be decorative", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const picker = page.locator("[data-mount='picker']");
    await expect(picker.locator(".cap-media-tile")).toHaveCount(4);
    await expect(picker.getByRole("checkbox")).toHaveCount(0);
    await picker.locator(".cap-media-tile[data-key='2026/09/uptime-strip.png'] .cap-media-open").click();
    const step = picker.getByRole("form", { name: "Alt text for uptime-strip.png" });
    const alt = step.getByRole("textbox", { name: "Alt text (required)" });
    await expect(alt).toBeFocused();
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

  test("behaviour: with no script, the picker's alt step posts the file and its alt text", async ({ page }) => {
    await visitStates(page, "media-library", theme);
    const step = page.locator("[data-mount='picker-step']").getByRole("form", { name: "Alt text for uptime-strip.png" });
    await expect(step.getByRole("link", { name: "Choose another" })).toHaveAttribute("href", "/media");
    const posted = nextPost(page, "[data-mount='picker-step']");
    await step.getByRole("textbox", { name: "Alt text (required)" }).fill("The uptime strip");
    await step.getByRole("button", { name: "Insert", exact: true }).click();
    expect((await posted).fields).toEqual({ intent: ["pick"], ids: ["2026/09/uptime-strip.png"], alt: ["The uptime strip"] });
  });

  test("behaviour: the inspector's preview keeps its height above the fields, in a pane shorter than its content", async ({ page }) => {
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
