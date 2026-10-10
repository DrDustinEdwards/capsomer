import { expect, test, type Locator, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, nextPost, visitStates } from "../../test/helpers.ts";
import { countLine, currentView, emptyWords, mentionActions, mentionsHref, sweepLabel, withMentions } from "./mentions-list.ts";

const ALL = { edit: true, publish: true, deleteContent: true, deleteMedia: true, decideMentions: true };
const NONE = { edit: false, publish: false, deleteContent: false, deleteMedia: false, decideMentions: false };
const COUNTS = { unverified: 1, pending: 3, approved: 1, rejected: 2, failed: 2, all: 9 };

test("behaviour: the address keeps one order, leaves the empty out, and a tab change starts on the first page", () => {
  expect(mentionsHref("/mentions?x=1", { open: "m-1", cursor: "c-2", view: "all" })).toBe("/mentions?view=all&cursor=c-2&open=m-1");
  expect(mentionsHref("/mentions", {})).toBe("/mentions");
  expect(withMentions({ view: "all", cursor: "c-2", open: "m-1" }, { view: "rejected" })).toEqual({ view: "rejected" });
  expect(withMentions({ view: "all", cursor: "c-2" }, { open: "m-1" })).toEqual({ view: "all", cursor: "c-2", open: "m-1" });
  expect(withMentions({ view: "all", cursor: "c-2", open: "m-1" }, { open: undefined })).toEqual({ view: "all", cursor: "c-2" });
});

test("behaviour: with no tab asked, the list opens on Waiting, or on All when nothing waits", () => {
  expect(currentView({ query: {}, counts: COUNTS })).toBe("pending");
  expect(currentView({ query: {}, counts: { ...COUNTS, pending: 0 } })).toBe("all");
  expect(currentView({ query: { view: "failed" }, counts: COUNTS })).toBe("failed");
});

test("behaviour: an action is offered only where the site supports it and the person may run it, and a withheld one is said", () => {
  const base = { query: {}, counts: COUNTS, can: ALL };
  expect(mentionActions({ ...base, offers: { reset: true, delete: true, sweep: true } })).toEqual({
    bulk: [
      { intent: "approve", label: "Approve" },
      { intent: "reject", label: "Reject" },
      { intent: "delete", label: "Delete", destructive: true },
    ],
    withheld: [],
  });
  expect(mentionActions({ ...base, query: { view: "approved" }, offers: { reset: true, delete: true, sweep: true } }).bulk.map((a) => a.intent)).toEqual(["reject", "reset", "delete"]);
  expect(mentionActions({ ...base, query: { view: "failed" }, offers: { reset: false, delete: false, sweep: true } })).toEqual({
    bulk: [],
    withheld: ["Delete is not offered: this site keeps every mention. Reject one to keep it off its post.", "Back to waiting is not offered by this site, so a decision on a waiting mention has no Undo."],
  });
  expect(mentionActions({ ...base, can: NONE, offers: { reset: true, delete: true, sweep: true } })).toEqual({ bulk: [], withheld: ["You can read these mentions. Deciding them needs the site owner's role."] });
});

test("behaviour: the count, the sweep's button and the empty state in words", () => {
  const row = { id: "m", author: "A", host: "h", excerpt: "", post: "", at: "2026-10-10T00:00:00Z", state: "pending" as const };
  expect(countLine({ rows: [row], query: {}, counts: COUNTS })).toBe("Showing 1 of 3 mentions");
  expect(countLine({ rows: [row], query: {}, counts: { ...COUNTS, pending: 1 } })).toBe("1 mention");
  expect(sweepLabel({ failed: 1, rejected: 2 })).toEqual({ n: 3, label: "Remove 3 expired" });
  expect(emptyWords("pending")).toEqual({ kind: "all-clear", title: "All clear", text: "No mentions are waiting. Approved and rejected are one filter away." });
  expect(emptyWords("rejected").kind).toBe("nothing-yet");
});

const log = (page: Page) => page.evaluate(() => (window as unknown as { mentionsLog: Array<Record<string, string | string[]>> }).mentionsLog);
const mount = (page: Page, name: string) => page.locator(`[data-mount='${name}']`);
const row = (list: Locator, id: string) => list.locator(`li.cap-mq-row[data-id='${id}']`);
const title = (list: Locator, id: string) => row(list, id).locator(".cap-row-title a");
const said = (list: Locator) => list.locator(".cap-message-item");

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    await expect(row(mount(page, "editor"), "m-101")).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: the quiet text and each status reach their contrast", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    await expectContrast(page, [
      { sel: "[data-mount='editor'] .cap-mq-summary", what: "the live line" },
      { sel: "[data-mount='editor'] .cap-mentions-count", what: "the count" },
      { sel: "[data-mount='editor'] .cap-mq-host", what: "a source's host" },
      { sel: "[data-mount='editor'] .cap-kbd", what: "a key hint" },
      { sel: "[data-mount='v05'] .cap-mentions-withheld li", what: "why an action is withheld" },
      { sel: "[data-mount='outcomes'] .cap-bulk-result-message", what: "why a mention was not done" },
      { sel: "[data-mount='paged'] li[data-id='m-160'] .cap-status", what: "Not yet checked" },
      { sel: "[data-mount='paged'] li[data-id='m-150'] .cap-status", what: "Source not found" },
      { sel: "[data-mount='paged'] li[data-id='m-120'] .cap-status", what: "Approved" },
      { sel: "[data-mount='paged'] li[data-id='m-130'] .cap-status", what: "Rejected" },
    ]);
  });

  test("accessibility: a reader's list is a named region of tab links with counts and rows with no boxes and no decisions", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    const list = mount(page, "reader");
    await expect(list.getByRole("navigation", { name: "Mentions by state" })).toMatchAriaSnapshot(`
      - navigation "Mentions by state":
        - link "Waiting 3"
        - link "Source not found 2"
        - link "Approved 1"
        - link "Rejected 2"
        - link "All 9"
    `);
    await expect(list.getByRole("link", { name: "Waiting 3" })).toHaveAttribute("aria-current", "page");
    await expect(list.getByRole("checkbox")).toHaveCount(0);
    await expect(list.locator("form")).toHaveCount(0);
    await expect(list.locator(".cap-mentions-withheld")).toHaveText("You can read these mentions. Deciding them needs the site owner's role.");
    await expect(list.getByRole("link", { name: "1 not yet checked" })).toHaveAttribute("href", "/mentions?view=all");
  });

  test("behaviour: with no script, a row's decision and the bar post the intent, the ids and the version; the sweep is a form", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    const list = page.locator("#mentions-static");
    // A source is text: nothing in the delivered list links to a stranger's page.
    await expect(list.locator("a[href^='http']")).toHaveCount(0);
    await expect(list.getByRole("link", { name: /^Rosa Park/ })).toHaveAttribute("href", "/mentions?open=m-101");
    await expect(list.getByRole("link", { name: "Source not found 0" })).toHaveAttribute("href", "/mentions?view=failed");
    await expect(list.locator(".cap-row-detail").filter({ hasText: "alert(" })).toContainText("<script>alert('hello')</script>");
    let posted = nextPost(page, "#mentions-static");
    await list.getByRole("button", { name: "Approve the mention from Rosa Park" }).click();
    expect(await posted).toEqual({ method: "post", enctype: "application/x-www-form-urlencoded", fields: { ids: ["m-101"], version: ["3"], intent: ["approve"] } });
    posted = nextPost(page, "#mentions-static");
    await list.getByRole("checkbox", { name: "Select the mention from Rosa Park" }).check();
    await list.getByRole("checkbox", { name: "Select the mention from Sam Okafor" }).check();
    await list.getByRole("region", { name: "Bulk actions on mentions" }).getByRole("button", { name: "Reject" }).click();
    expect(await posted).toEqual({ method: "post", enctype: "application/x-www-form-urlencoded", fields: { ids: ["m-101", "m-102"], intent: ["reject"] } });
    await expect(list.getByRole("button", { name: "Remove 0 expired" })).toBeDisabled();
    posted = nextPost(page, "[data-mount='outcomes']");
    await page.locator("[data-mount='outcomes']").getByRole("button", { name: "Remove 2 expired" }).click();
    expect(await posted).toEqual({ method: "post", enctype: "application/x-www-form-urlencoded", fields: { intent: ["sweep"] } });
  });

  test("behaviour: with no script, the page after a post says the result, lists each mention's outcome and posts Undo as a form", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    const list = mount(page, "outcomes");
    await expect(list.getByRole("status", { name: "Results and failures" })).toContainText("Approved 2 mentions.");
    await expect(list.getByRole("group", { name: "2 done, 1 not done." }).locator(".cap-bulk-results-list > li")).toHaveText([/^Not done An unnamed sender \(reader\.example\) It changed since the page was read/, /^Done Rosa Park \(fieldnotes\.example\)$/, /^Done Sam Okafor \(bacteriophage\.example\)$/]);
    const posted = nextPost(page, "[data-mount='outcomes']");
    await list.getByRole("button", { name: "Undo" }).click();
    expect(await posted).toEqual({ method: "post", enctype: "application/x-www-form-urlencoded", fields: { ids: ["m-101", "m-102"], intent: ["reset"] } });
  });

  test("behaviour: with no script, a delete is confirmed on the server's page with the count typed, and the sweep's page names what it removes", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    const del = mount(page, "confirm-delete").getByRole("group", { name: "Delete 2 mentions?" });
    await expect(del.getByRole("listitem")).toHaveText(["From Cheap Pills (pills.example)", "From Dev Patel (devpatel.example)"]);
    const posted = nextPost(page, "[data-mount='confirm-delete']");
    await del.getByRole("textbox", { name: "Type 2 to confirm" }).fill("2");
    await del.getByRole("button", { name: "Delete 2 mentions" }).click();
    expect(await posted).toEqual({ method: "post", enctype: "application/x-www-form-urlencoded", fields: { intent: ["delete"], ids: ["m-130", "m-140"], confirm: ["2"] } });
    await expect(mount(page, "confirm-sweep").getByRole("group", { name: "Remove 2 expired mentions?" }).getByRole("listitem")).toHaveText(["1 whose source was not found", "1 rejected"]);
  });

  test("behaviour: one page of many: the count says so, the pages are links, and the mention in the address is open with its source", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    const list = mount(page, "paged");
    await expect(list.locator(".cap-mentions-count")).toHaveText("Showing 9 of 223 mentions");
    await expect(list.getByRole("link", { name: "First page" })).toHaveAttribute("href", "/mentions?view=all");
    await expect(list.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "/mentions?view=all&cursor=c-3");
    await expect(title(list, "m-120")).toHaveAttribute("aria-expanded", "true");
    const source = row(list, "m-120").locator("a[data-external]");
    await expect(source).toHaveAttribute("rel", "nofollow ugc noopener");
    // Nothing to decide on a mention not yet checked or whose source was not found: only Delete.
    for (const id of ["m-160", "m-150"]) await expect(row(list, id).locator("[data-cap-action]")).toHaveText([/^Delete/]);
    await expect(row(list, "m-150").locator(".cap-row-detail")).toHaveText("The source page answered 404.");
  });

  test("behaviour: with nothing waiting the list opens on All, and an empty tab says what is empty", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    await expect(mount(page, "empty-open").getByRole("link", { name: "All 6" })).toHaveAttribute("aria-current", "page");
    await expect(mount(page, "empty-rejected").locator(".cap-empty")).toContainText("Nothing rejected");
  });

  test("keyboard: with script, a approves the focused row at once, focus moves to the next row, and z puts it back", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    const list = mount(page, "editor");
    await title(list, "m-101").focus();
    await page.keyboard.press("j");
    await expect(title(list, "m-102")).toBeFocused();
    await page.keyboard.press("k");
    await page.keyboard.press("a");
    await expect(row(list, "m-101")).toHaveCount(0);
    await expect(title(list, "m-102")).toBeFocused();
    await expect(list.getByRole("link", { name: "Approved 2" })).toBeVisible();
    await expect(said(list)).toContainText("Approved the mention from Rosa Park.");
    await page.keyboard.press("z");
    await expect(row(list, "m-101")).toBeVisible();
    await expect(list.getByRole("link", { name: "Waiting 3" })).toBeVisible();
    expect((await log(page)).map((e) => e.intent)).toEqual(["approve", "put-back"]);
    expect((await log(page))[0]).toMatchObject({ ids: "m-101", version: "3" });
  });

  test("keyboard: x selects, and r on a selected row rejects the whole selection", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    const list = mount(page, "editor");
    await title(list, "m-101").focus();
    await page.keyboard.press("x");
    await page.keyboard.press("j");
    await page.keyboard.press("x");
    const bar = list.getByRole("region", { name: "Bulk actions on mentions" });
    await expect(bar.getByRole("status")).toHaveText("2 selected");
    await page.keyboard.press("r");
    await expect(said(list)).toContainText("Rejected 2 mentions.");
    await expect(list.getByRole("link", { name: "Rejected 4" })).toBeVisible();
    expect((await log(page))[0]).toMatchObject({ intent: "reject", ids: ["m-101", "m-102"] });
  });

  test("keyboard: Esc clears the selection from a row", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    const list = mount(page, "editor");
    await title(list, "m-101").focus();
    await page.keyboard.press("x");
    await expect(row(list, "m-101").getByRole("checkbox")).toBeChecked();
    await page.keyboard.press("Escape");
    await expect(row(list, "m-101").getByRole("checkbox")).not.toBeChecked();
  });

  test("keyboard: d asks first with focus on Cancel and the count to type, then deletes for good", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    const list = mount(page, "editor");
    await title(list, "m-103").focus();
    await page.keyboard.press("d");
    const dialog = page.getByRole("alertdialog", { name: "Delete the mention from An unnamed sender?" });
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await expect(dialog.getByRole("listitem")).toHaveText(["From An unnamed sender (reader.example)"]);
    await dialog.getByRole("textbox").fill("1");
    await dialog.getByRole("button", { name: "Delete 1 mention" }).click();
    await expect(dialog).toBeHidden();
    await expect(row(list, "m-103")).toHaveCount(0);
    await expect(said(list)).toContainText("Deleted the mention from An unnamed sender.");
    await expect(said(list).getByRole("button", { name: "Undo" })).toHaveCount(0);
  });

  test("behaviour: the sweep names what the site's retention removes, by kind, and removes only that", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    const list = mount(page, "editor");
    await list.getByRole("button", { name: "Remove 2 expired" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Remove 2 expired mentions?" });
    await expect(dialog.getByRole("listitem")).toHaveText(["1 whose source was not found", "1 rejected"]);
    await dialog.getByRole("button", { name: "Remove them" }).click();
    await expect(said(list)).toContainText("Removed 2 expired mentions.");
    await expect(list.getByRole("link", { name: "Rejected 1" })).toBeVisible();
    await expect(list.getByRole("button", { name: "Remove 0 expired" })).toBeDisabled();
  });

  test("behaviour: with script, a sender's name opens the row in place", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    const list = mount(page, "editor");
    await title(list, "m-101").click();
    await expect(title(list, "m-101")).toHaveAttribute("aria-expanded", "true");
    await expect(row(list, "m-101").locator(".cap-mq-quote")).toContainText("Lysogeny is not a failure to lyse");
    await expect(row(list, "m-101").locator(".cap-mq-facts")).toContainText("https://fieldnotes.example/2026/lambda-decision");
    await expect(row(list, "m-101").locator("a[href^='http']")).toHaveCount(0);
    await title(list, "m-101").click();
    await expect(row(list, "m-101").locator(".cap-mq-quote")).toHaveCount(0);
  });

  test("behaviour: on a site with no Back to waiting, a decision on a waiting mention says it has no Undo, and approved to rejected still has one", async ({ page }) => {
    await visitStates(page, "mentions-list", theme);
    const list = mount(page, "v05");
    await list.getByRole("button", { name: "Approve the mention from Rosa Park" }).click();
    await expect(said(list)).toContainText("Approved the mention from Rosa Park. This site cannot put a mention back to waiting, so there is no Undo");
    await expect(said(list).getByRole("button", { name: "Undo" })).toHaveCount(0);
    await list.getByRole("link", { name: "Approved 2" }).click();
    await expect(list.locator("[data-cap-action='reset']")).toHaveCount(0);
    await list.getByRole("button", { name: "Reject the mention from Jon Alvarez" }).click();
    await expect(said(list)).toContainText("Rejected the mention from Jon Alvarez.");
    await said(list).getByRole("button", { name: "Undo" }).click();
    await expect(said(list)).toContainText("The mention from Jon Alvarez is back where it was.");
    await expect(row(list, "m-120")).toHaveAttribute("data-state", "approved");
  });
});
