import { expect, test, type Locator, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, nextPost, visitStates } from "../../test/helpers.ts";
import { contentStatus, countLine, emptyWords, intentForm, outcomesOf, postActions, postsHref, rowActions, withFilter } from "./posts-list.ts";

const NOW = Date.parse("2026-10-10T12:00:00Z");
const ALL = { edit: true, publish: true, deleteContent: true, deleteMedia: true, decideMentions: true };
const NONE = { edit: false, publish: false, deleteContent: false, deleteMedia: false, decideMentions: false };
const OFFERS = { delete: true, schedule: true, tags: true, duplicate: true };
const row = (status: "draft" | "scheduled" | "published", liveHref: string | null = null) => ({ id: "p", title: "P", kind: "post", status, path: null, href: "/editor/p", liveHref, publishAt: null, publishedAt: null, updatedAt: null });

test("behaviour: contentStatus says each status in words and shapes, and when a scheduled post goes out", () => {
  expect(contentStatus("published")).toEqual({ tone: "ok", word: "Published" });
  expect(contentStatus("draft")).toEqual({ tone: "nodata", word: "Draft" });
  expect(contentStatus("scheduled")).toEqual({ tone: "info", word: "Scheduled" });
  expect(contentStatus("scheduled", "2026-10-10T18:00:00Z", NOW).when).toBe("today");
  expect(contentStatus("scheduled", "2026-10-11T01:00:00Z", NOW).when).toBe("tomorrow");
  expect(contentStatus("scheduled", "2026-10-13T08:00:00Z", NOW).when).toBe("in 3 days");
  expect(contentStatus("scheduled", "2026-10-10T11:00:00Z", NOW).when).toBe("due now");
});

test("behaviour: an action is offered only where the site supports it and the person may run it, and a withheld one says why", () => {
  expect(postActions({ offers: OFFERS, can: ALL }).bulk.map((a) => a.intent)).toEqual(["add-tag", "remove-tag", "duplicate", "unpublish", "delete"]);
  expect(postActions({ offers: OFFERS, can: ALL }).withheld).toEqual([]);
  const noDelete = postActions({ offers: { ...OFFERS, delete: false, tags: false }, can: ALL });
  expect(noDelete.bulk.map((a) => a.intent)).toEqual(["duplicate", "unpublish"]);
  expect(noDelete.withheld).toEqual(["Tags are not offered: this site keeps no tags on its posts.", "Delete is not offered: this site cannot delete posts."]);
  // Delete is offered by the site but not to this person: nothing to tick it with, and no reason owed beyond the role.
  expect(postActions({ offers: OFFERS, can: { ...ALL, deleteContent: false } }).bulk.some((a) => a.intent === "delete")).toBe(false);
  const reader = postActions({ offers: OFFERS, can: NONE });
  expect(reader.bulk).toEqual([]);
  expect(reader.withheld).toEqual(["You can read these posts. Changing them needs an editor's role."]);
  expect(rowActions(row("published", "https://example.com/p"), { offers: OFFERS, can: ALL }).map((a) => a.value)).toEqual(["edit", "view", "unpublish", "duplicate", "delete"]);
  // A draft cannot be unpublished, so its menu never offers it.
  expect(rowActions(row("draft"), { offers: OFFERS, can: ALL }).map((a) => a.value)).toEqual(["edit", "duplicate", "delete"]);
  expect(rowActions(row("published", "https://example.com/p"), { offers: OFFERS, can: NONE }).map((a) => a.value)).toEqual(["view"]);
});

test("behaviour: a filter's address keeps the other filters in one order and starts at the first page", () => {
  const q = { sort: "title" as const, q: "phage", cursor: "c-2", status: "draft" as const };
  expect(postsHref("/posts?old=1", q)).toBe("/posts?q=phage&status=draft&sort=title&cursor=c-2");
  expect(postsHref("/posts", withFilter(q, { status: "published" }))).toBe("/posts?q=phage&status=published&sort=title");
  expect(postsHref("/posts", withFilter(q, { status: undefined }))).toBe("/posts?q=phage&sort=title");
  expect(postsHref("/posts", {})).toBe("/posts");
});

test("behaviour: the count and the empty state name what is there and what is not", () => {
  const rows = [row("draft"), row("draft")];
  expect(countLine({ rows, page: { nextCursor: null } })).toBe("2 posts");
  expect(countLine({ rows, page: { nextCursor: "c", total: 120, sortedOnPage: true } }, { noun: "article" })).toBe("Showing 2 of 120 articles, sorted on this page only");
  expect(emptyWords({ status: "draft" }).title).toBe("No drafts");
  expect(emptyWords({ status: "draft", q: "lysogeny" })).toMatchObject({ kind: "no-match", title: "No posts match “lysogeny”" });
});

test("behaviour: an undo or a confirm posts its intent with every field, a list as one field per item", () => {
  const form = intentForm("remove-tag", { ids: ["a", "b"], tag: "capsid", intent: "ignored" });
  expect(form.getAll("intent")).toEqual(["remove-tag"]);
  expect(form.getAll("ids")).toEqual(["a", "b"]);
  expect(form.get("tag")).toBe("capsid");
  const names = new Map([["a", "Notes on the Foxhound release"]]);
  expect(outcomesOf({ outcomes: [{ id: "a", ok: false, message: "In use", usedBy: [{ type: "post", id: "x", title: "Lambda", detail: "cover image" }] }, { id: "gone", ok: true }] }, names)).toEqual([
    { id: "a", label: "Notes on the Foxhound release", ok: false, message: "In use", usedBy: ["Lambda (cover image)"] },
    { id: "gone", label: "gone", ok: true, message: undefined, usedBy: undefined },
  ]);
});


const log = (page: Page) => page.evaluate(() => (window as unknown as { postsLog: Array<Record<string, string | string[]>> }).postsLog);
const editor = (page: Page) => page.locator("[data-mount='editor']");
const rowOf = (list: Locator, title: string) => list.locator("tbody tr", { has: list.page().getByRole("link", { name: title, exact: true }) });

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "posts-list", theme);
    await expect(editor(page).locator("tbody tr")).toHaveCount(6);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the quiet text reaches its contrast", async ({ page }) => {
    await visitStates(page, "posts-list", theme);
    await expectContrast(page, [
      { sel: "[data-mount='editor'] .cap-posts-count", what: "the count" },
      { sel: "[data-mount='editor'] .cap-posts-path", what: "a post's path" },
      { sel: "[data-mount='editor'] .cap-posts-when", what: "when a scheduled post goes out" },
      { sel: "[data-mount='limited'] .cap-posts-withheld li", what: "why an action is withheld" },
      { sel: "[data-mount='outcomes'] .cap-bulk-result-message", what: "why a post was not done" },
    ]);
  });

  test("accessibility: a reader's list is a named region of tabs, filters and a table, with no boxes", async ({ page }) => {
    await visitStates(page, "posts-list", theme);
    await expect(page.locator("[data-mount='reader']")).toMatchAriaSnapshot(`
      - region "Posts":
        - navigation "Posts by status":
          - link "All 4"
          - link "Drafts 1"
          - link "Scheduled 1"
          - link "Published 2"
        - search "Find posts":
          - text: Search
          - searchbox "Search"
          - text: Kind
          - combobox "Kind"
          - text: Tag
          - combobox "Tag"
          - text: Sort by
          - combobox "Sort by"
          - button "Show"
        - paragraph: 4 posts
        - list:
          - listitem: You can read these posts. Changing them needs an editor's role.
        - region "Posts on dustinedwards.info":
          - table "Posts on dustinedwards.info":
            - rowgroup:
              - row "Title Status Updated Actions"
            - rowgroup:
              - row /Notes on the Foxhound release/:
                - rowheader /Notes on the Foxhound release/:
                  - link "Notes on the Foxhound release"
                - cell "Published"
                - cell "19 hours ago"
                - cell:
                  - group: Actions
              - row /Why the uptime strip counts gaps/
              - row /What a mention queue is for/
              - row /Notes on a read-only agent/
    `);
  });

  test("behaviour: with no script, the filters are a GET form and the bar and each row's menu post the intent and the ids", async ({ page }) => {
    await visitStates(page, "posts-list", theme);
    const list = page.locator("#posts-static");
    // The delivered HTML has the bar in the page, with words that need no script.
    await expect(list.locator(".cap-bulk-count")).toHaveText("Tick the posts to act on");
    let posted = nextPost(page, "#posts-static");
    await list.getByRole("checkbox", { name: "Select Notes on the Foxhound release" }).check();
    await list.getByRole("checkbox", { name: "Select Notes on a read-only agent" }).check();
    await list.getByRole("button", { name: "Unpublish" }).click();
    expect(await posted).toEqual({ method: "post", enctype: "application/x-www-form-urlencoded", fields: { ids: ["foxhound-release", "read-only-agent"], tag: [""], intent: ["unpublish"] } });
    posted = nextPost(page, "#posts-static");
    const menu = rowOf(list, "Why the uptime strip counts gaps").locator("details");
    await menu.locator("summary").click();
    await expect(menu.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/editor/uptime-strip");
    await menu.getByRole("button", { name: "Duplicate" }).click();
    expect(await posted).toEqual({ method: "post", enctype: "application/x-www-form-urlencoded", fields: { ids: ["uptime-strip"], intent: ["duplicate"] } });
    posted = nextPost(page, "#posts-static");
    await list.getByRole("searchbox", { name: "Search" }).fill("lambda");
    await list.getByRole("button", { name: "Show" }).click();
    expect(await posted).toEqual({ method: "get", enctype: "application/x-www-form-urlencoded", fields: { q: ["lambda"], kind: [""], tag: [""], sort: ["updated"] } });
  });

  test("behaviour: with no script, the page after a post says the result, lists each post's outcome and posts Undo as a form", async ({ page }) => {
    await visitStates(page, "posts-list", theme);
    const list = page.locator("[data-mount='outcomes']");
    await expect(list.getByRole("status", { name: "Results and failures" })).toContainText("Added the tag capsid to 2 posts; 1 refused.");
    await expect(list.getByRole("group", { name: "2 done, 1 not done." }).locator(".cap-bulk-results-list > li")).toHaveText([/^Not done Phage lambda: lysis or lysogeny This post has no front matter/, /^Done Notes on the Foxhound release$/, /^Done What a mention queue is for$/]);
    const posted = nextPost(page, "[data-mount='outcomes']");
    await list.getByRole("button", { name: "Undo" }).click();
    expect(await posted).toEqual({ method: "post", enctype: "application/x-www-form-urlencoded", fields: { ids: ["foxhound-release", "mention-queue"], tag: ["capsid"], intent: ["remove-tag"] } });
  });

  test("behaviour: with no script, a delete is confirmed on the server's page, which posts every id and needs the count typed", async ({ page }) => {
    await visitStates(page, "posts-list", theme);
    const confirm = page.locator("[data-mount='confirm']").getByRole("group", { name: "Delete 2 posts?" });
    await expect(confirm.getByRole("listitem")).toHaveText(["What a mention queue is for", "Phage lambda: lysis or lysogeny"]);
    await expect(page.locator("[data-mount='confirm'] table")).toHaveCount(0);
    const typed = confirm.getByRole("textbox", { name: "Type 2 to confirm" });
    await expect(typed).toHaveAttribute("required", "");
    const posted = nextPost(page, "[data-mount='confirm']");
    await typed.fill("2");
    await confirm.getByRole("button", { name: "Delete 2 posts" }).click();
    expect(await posted).toEqual({ method: "post", enctype: "application/x-www-form-urlencoded", fields: { intent: ["delete"], ids: ["mention-queue", "phage-lambda"], confirm: ["2"] } });
  });

  test("keyboard: with script, a row's Unpublish runs at once with Undo, and z puts it back", async ({ page }) => {
    await visitStates(page, "posts-list", theme);
    const list = editor(page);
    const target = rowOf(list, "Notes on the Foxhound release");
    await target.locator("summary").focus();
    await page.keyboard.press("Enter");
    await target.getByRole("button", { name: "Unpublish" }).focus();
    await page.keyboard.press("Enter");
    await expect(target.locator(".cap-posts-status")).toHaveText("Draft");
    await expect(editor(page).locator(".cap-message-item")).toContainText("Unpublished “Notes on the Foxhound release”.");
    await expect(target.locator("details")).not.toHaveAttribute("open", "");
    await page.locator("h1").click();
    await page.keyboard.press("z");
    await expect(target.locator(".cap-posts-status")).toHaveText("Published");
    await expect(editor(page).locator(".cap-message-item")).toContainText("Published “Notes on the Foxhound release” again.");
    expect((await log(page)).map((e) => e.intent)).toEqual(["unpublish", "republish"]);
  });

  test("behaviour: with script, a tag shows each post's outcome in the bar, and Undo reverses it only where it changed", async ({ page }) => {
    await visitStates(page, "posts-list", theme);
    const list = editor(page);
    for (const t of ["Notes on the Foxhound release", "Why the uptime strip counts gaps", "Phage lambda: lysis or lysogeny"]) await list.getByRole("checkbox", { name: `Select ${t}` }).check();
    const bar = list.getByRole("region", { name: "Bulk actions on posts" });
    await expect(bar.getByRole("status")).toHaveText("3 selected");
    await bar.getByRole("textbox", { name: "Tag" }).fill("capsid");
    await bar.getByRole("button", { name: "Add tag" }).click();
    const outcomes = bar.getByRole("group", { name: "2 done, 1 not done." });
    await expect(outcomes.locator(".cap-bulk-results-list > li")).toHaveText([/^Not done Phage lambda/, /^Done Notes on the Foxhound release$/, /^Done Why the uptime strip counts gaps Already had it\.$/]);
    await expect(bar.getByRole("status")).toHaveText("Nothing selected");
    await editor(page).locator(".cap-message").getByRole("button", { name: "Undo" }).click();
    await expect(editor(page).locator(".cap-message-item")).toContainText("Removed the tag capsid from 1 post.");
    const sent = await log(page);
    expect(sent[0]).toMatchObject({ intent: "add-tag", ids: ["foxhound-release", "uptime-strip", "phage-lambda"], tag: "capsid" });
    // The uptime post already had the tag, so Undo leaves it on.
    expect(sent[1]).toMatchObject({ intent: "remove-tag", ids: "foxhound-release", tag: "capsid" });
    await bar.getByRole("button", { name: "Dismiss results" }).click();
    await expect(bar).toBeHidden();
  });

  test("keyboard: with script, Delete opens the preview with focus on Cancel, lists every post and needs the count typed", async ({ page }) => {
    await visitStates(page, "posts-list", theme);
    const list = editor(page);
    await list.getByRole("checkbox", { name: "Select What a mention queue is for" }).check();
    await list.getByRole("checkbox", { name: "Select Phage lambda: lysis or lysogeny" }).check();
    await list.getByRole("button", { name: "Delete" }).focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("alertdialog", { name: "Delete 2 posts?" });
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await expect(dialog.getByRole("listitem")).toHaveText(["What a mention queue is for", "Phage lambda: lysis or lysogeny"]);
    await expect(list.locator("tbody tr")).toHaveCount(6);
    await dialog.getByRole("textbox").fill("2");
    await dialog.getByRole("button", { name: "Delete 2 posts" }).click();
    await expect(dialog).toBeHidden();
    await expect(list.locator("tbody tr")).toHaveCount(4);
    await expect(editor(page).locator(".cap-message-item")).toContainText("Deleted 2 posts.");
    expect((await log(page)).map((e) => [e.intent, e.confirm ?? null])).toEqual([
      ["delete", null],
      ["delete", "2"],
    ]);
  });

  test("keyboard: the header box ticks every post, and Esc in the table clears them", async ({ page }) => {
    await visitStates(page, "posts-list", theme);
    const list = editor(page);
    await list.getByRole("checkbox", { name: "Select all 6 posts" }).check();
    await expect(list.getByRole("region", { name: "Bulk actions on posts" }).getByRole("status")).toHaveText("6 selected");
    await list.getByRole("checkbox", { name: "Select About" }).focus();
    await page.keyboard.press("Escape");
    await expect(list.getByRole("region", { name: "Bulk actions on posts" })).toBeHidden();
    await expect(list.getByRole("checkbox", { name: "Select About" })).not.toBeChecked();
  });
});
