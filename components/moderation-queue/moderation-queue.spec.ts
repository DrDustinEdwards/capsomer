import { expect, test, type Locator, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { EMPTY_TEXT, RETENTION_DAYS, VIEWS, actionsFor, countViews, decide, decidedText, expiredIds, needsConfirm, summaryText, undoStack, viewOf, type Mention } from "./moderation-queue.ts";

const NOW = Date.parse("2026-10-02T15:00:00Z");

// The pure helpers need no browser.
test("behaviour: decide is a transition table, and a binned mention can only be restored", () => {
  expect(decide("waiting", "approve")).toBe("approved");
  expect(decide("waiting", "spam")).toBe("spam");
  expect(decide("waiting", "bin")).toBe("bin");
  expect(decide("waiting", "restore")).toBeNull();
  expect(decide("approved", "approve")).toBeNull();
  expect(decide("approved", "restore")).toBe("waiting");
  expect(decide("spam", "approve")).toBe("approved");
  expect(decide("spam", "restore")).toBe("waiting");
  expect(decide("bin", "restore")).toBe("waiting");
  expect(decide("bin", "approve")).toBeNull();
  expect(decide("bin", "spam")).toBeNull();
  expect(actionsFor("bin")).toEqual(["restore"]);
  expect(actionsFor("waiting")).toEqual(["approve", "spam", "bin"]);
});

test("behaviour: a mention is in one view; a waiting mention whose source is gone is in Source gone", () => {
  expect(viewOf({ state: "waiting" })).toBe("waiting");
  expect(viewOf({ state: "waiting", gone: true })).toBe("gone");
  expect(viewOf({ state: "approved", gone: true })).toBe("approved");
  const c = countViews([{ state: "waiting" }, { state: "waiting", gone: true }, { state: "spam" }, { state: "bin" }, { state: "approved" }, { state: "approved" }]);
  expect(c).toEqual({ waiting: 1, gone: 1, spam: 1, bin: 1, approved: 2 });
  expect(summaryText(c)).toBe("1 waiting, 1 with a source gone");
  expect(summaryText({ waiting: 0, approved: 0, spam: 0, bin: 0, gone: 0 })).toBe("Nothing waiting");
  expect(VIEWS).toHaveLength(5);
  expect(Object.keys(EMPTY_TEXT)).toHaveLength(5);
});

test("behaviour: approving a mention whose source is gone asks first; nothing else does", () => {
  expect(needsConfirm({ gone: true }, "approve")).toBe(true);
  expect(needsConfirm({ gone: true }, "spam")).toBe(false);
  expect(needsConfirm({ gone: true }, "bin")).toBe(false);
  expect(needsConfirm({ gone: false }, "approve")).toBe(false);
});

test("behaviour: the undo stack keeps the newest last, is bounded, and removes one entry", () => {
  const s = undoStack<number>(3);
  for (const n of [1, 2, 3, 4]) s.push(n);
  expect(s.size).toBe(3);
  expect(s.peek()).toBe(4);
  s.remove((n) => n === 3);
  expect(s.pop()).toBe(4);
  expect(s.pop()).toBe(2);
  expect(s.pop()).toBeUndefined();
  s.push(9);
  s.clear();
  expect(s.size).toBe(0);
});

test("behaviour: retention sweeps only what is gone, spam or binned, past its window", () => {
  const day = 24 * 60 * 60 * 1000;
  const iso = (daysAgo: number) => new Date(NOW - daysAgo * day).toISOString();
  const items: Array<Pick<Mention, "id" | "state" | "gone" | "at" | "decidedAt" | "goneAt">> = [
    { id: "old-spam", state: "spam", at: iso(200), decidedAt: iso(RETENTION_DAYS.spam + 1) },
    { id: "new-spam", state: "spam", at: iso(200), decidedAt: iso(RETENTION_DAYS.spam - 1) },
    { id: "old-bin", state: "bin", at: iso(200), decidedAt: iso(RETENTION_DAYS.bin + 1) },
    { id: "old-gone", state: "waiting", gone: true, at: iso(200), goneAt: iso(RETENTION_DAYS.gone + 1) },
    { id: "old-waiting", state: "waiting", at: iso(400) },
    { id: "old-approved", state: "approved", at: iso(400), decidedAt: iso(300) },
  ];
  expect(expiredIds(items, NOW)).toEqual(["old-spam", "old-bin", "old-gone"]);
});

test("behaviour: each decision says what it did, for one mention and for several", () => {
  expect(decidedText("spam", ["Rosa Park"])).toBe("Marked the mention from Rosa Park as spam.");
  expect(decidedText("approve", ["Rosa Park", "Sam Okafor"])).toBe("Approved 2 mentions.");
  expect(decidedText("bin", ["Rosa Park"])).toBe("Moved the mention from Rosa Park to the bin.");
});

test("behaviour: the page is delivered with every mention, its state in words, and a stranger's text escaped", async ({ page }) => {
  const html = await (await page.request.get("components/moderation-queue/states.html")).text();
  for (const word of ["Waiting", "Approved", "Spam", "Bin", "Source gone"]) expect(html).toContain(`</svg>${word}</span>`);
  expect(html).toContain("&lt;script&gt;alert(");
  expect(html).not.toContain("<script>alert(");
  // Every row of the main queue is there, whatever filter shows.
  const main = html.slice(html.indexOf('id="mq-main"'), html.indexOf('id="s-gone"'));
  expect((main.match(/class="cap-row cap-mq-row"/g) ?? []).length).toBe(22);
  expect(main).toContain("Waiting <span");
});

const queue = (page: Page) => page.locator("#mq-main");
const row = (q: Locator, id: string) => q.locator(`li.cap-mq-row[data-id='${id}']`);
const title = (q: Locator, id: string) => row(q, id).locator(".cap-row-title button");
const region = (page: Page) => page.getByRole("status", { name: "Results and failures" });
const showView = async (q: Locator, label: string) => {
  await q.getByRole("radio", { name: new RegExp(`^${label}`) }).check();
};

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations on a phone", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme, "phone");
    await expectNoAxeViolations(page);
  });

  test("accessibility: each text tone and each control boundary reaches its contrast", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await expectContrast(page, [
      { sel: "#mq-main li[data-id='m-101'] .cap-mq-name", what: "the sender" },
      { sel: "#mq-main li[data-id='m-101'] .cap-mq-host", what: "the host" },
      { sel: "#mq-main li[data-id='m-101'] .cap-row-detail", what: "the excerpt line" },
      { sel: "#mq-main li[data-id='m-101'] .cap-time", what: "the time" },
      { sel: "#mq-main li[data-id='m-101'] .cap-status", what: "the Waiting status" },
      { sel: "#mq-main li[data-id='m-101'] [data-cap-action='approve']", what: "Approve" },
      { sel: "#mq-main li[data-id='m-101'] .cap-kbd", what: "the key hint" },
      { sel: "#mq-main li[data-id='m-101'] [data-cap-part='select']", what: "a select box's edge", part: "border" },
      { sel: "#mq-main .cap-mq-summary", what: "the live count" },
      { sel: "#mq-main .cap-mq-retention p", what: "the retention note" },
      { sel: "#mq-main [data-cap-part='sweep']", what: "the sweep button's edge", part: "border" },
    ]);
    // Each state's word, on the view that shows it.
    for (const [label, id] of [["Approved", "m-110"], ["Spam", "m-130"], ["Bin", "m-140"], ["Source gone", "m-150"]] as const) {
      await showView(q, label);
      await expectContrast(page, [{ sel: `#mq-main li[data-id='${id}'] .cap-status`, what: `the ${label} status` }]);
    }
    await expect(q.locator("li[data-id='m-140'] [data-cap-action='delete']")).toBeHidden();
    await showView(q, "Bin");
    await expectContrast(page, [{ sel: "#mq-main li[data-id='m-140'] [data-cap-action='delete']", what: "Delete permanently", part: "color" }]);
  });

  test("accessibility: the roles and names of the head, the bulk bar and a row", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    await expect(queue(page).locator(".cap-mq-head")).toMatchAriaSnapshot(`
      - group "Show mentions that are":
        - radio "Waiting 4 mentions" [checked]
        - text: Waiting 4 mentions
        - radio "Approved 12 mentions"
        - text: Approved 12 mentions
        - radio "Spam 3 mentions"
        - text: Spam 3 mentions
        - radio "Bin 1 mentions"
        - text: Bin 1 mentions
        - radio "Source gone 2 mentions"
        - text: Source gone 2 mentions
      - status: 4 waiting, 2 with a source gone
      - button "Keyboard shortcuts"
    `);
    await expect(queue(page).getByRole("region", { name: "Bulk actions" })).toMatchAriaSnapshot(`
      - region "Bulk actions":
        - status: No rows selected
    `);
    await expect(row(queue(page), "m-101")).toMatchAriaSnapshot(`
      - listitem:
        - checkbox "Select the mention from Rosa Park"
        - text: Select the mention from Rosa Park Waiting
        - button "Rosa Park fieldnotes.example"
        - paragraph: /On Phage lambda/
        - time: 1 hour ago
        - button "Approve the mention from Rosa Park"
        - button "Spam the mention from Rosa Park"
        - button "Bin the mention from Rosa Park"
    `);
  });

  test("accessibility: each decision is a real button with its key announced and shown", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const r = row(queue(page), "m-101");
    for (const [action, key] of [["approve", "a"], ["spam", "s"], ["bin", "d"]] as const) {
      const b = r.locator(`[data-cap-action='${action}']`);
      await expect(b).toHaveAttribute("aria-keyshortcuts", key);
      await expect(b.locator("kbd.cap-kbd")).toHaveText(key);
      expect(await b.evaluate((e) => e.tagName)).toBe("BUTTON");
    }
    // Names carry the sender, so a column of Approve buttons is not a column of the same name.
    const names = await queue(page).locator("li.cap-mq-row:not([hidden]) [data-cap-action='approve']").evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));
    expect(new Set(names).size).toBe(names.length);
  });

  test("accessibility: a source is text, never a link, unless marked external with rel nofollow ugc noopener", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    // Nothing in the main queue links to a stranger's page.
    await expect(queue(page).locator("a[href^='http']")).toHaveCount(0);
    const link = page.locator("#mq-approved a[data-external]");
    await expect(link).toHaveAttribute("rel", "nofollow ugc noopener");
    await expect(link).toHaveAttribute("href", "https://jonalvarez.example/notes/agents");
    // The host is text in the title; the post is the one internal link.
    await expect(row(queue(page), "m-101").locator(".cap-mq-host")).toHaveText("fieldnotes.example");
  });

  test("accessibility: a source that is gone says so in a word and a shape, in the row and in the open row", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const gone = page.locator("#mq-gone li[data-id='m-150']");
    await expect(gone.locator(".cap-row-status .cap-status")).toHaveText("Source gone");
    await expect(gone.locator(".cap-row-status svg")).toHaveCount(1);
    await expect(gone.locator(".cap-mq-why")).toContainText("answered 404");
    await expect(gone.locator(".cap-mq-why")).toContainText("Approving asks first");
  });

  test("accessibility: the phone layout does not scroll sideways and keeps the hit areas", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await visitStates(page, "moderation-queue", theme, "phone");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    for (const b of await page.locator("#mq-phone li:not([hidden]) [data-cap-action]").all()) expect((await b.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(24);
  });

  test("accessibility: the live count and the result are polite status regions", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    await expect(queue(page).locator("[data-cap-part='summary']")).toHaveAttribute("role", "status");
    await expect(region(page)).toHaveAttribute("aria-atomic", "false");
  });

  test("keyboard: Tab goes from a row's select box to its title and its decisions, in order", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const r = row(queue(page), "m-102");
    await r.locator("[data-cap-part='select']").focus();
    for (const next of [r.locator(".cap-row-title button"), r.locator("[data-cap-action='approve']"), r.locator("[data-cap-action='spam']"), r.locator("[data-cap-action='bin']")]) {
      await page.keyboard.press("Tab");
      await expect(next).toBeFocused();
    }
  });

  test("keyboard: j and k move between the rows, from a ticked box too", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await title(q, "m-101").focus();
    await page.keyboard.press("j");
    await expect(title(q, "m-102")).toBeFocused();
    await page.keyboard.press("j");
    await expect(title(q, "m-103")).toBeFocused();
    await page.keyboard.press("k");
    await expect(title(q, "m-102")).toBeFocused();
    await row(q, "m-102").locator("[data-cap-part='select']").check();
    await page.keyboard.press("j");
    await expect(title(q, "m-103")).toBeFocused();
  });

  test("keyboard: Enter on a title opens the row in place; aria-expanded follows", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    const t = title(q, "m-101");
    await t.focus();
    await expect(t).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(t).toHaveAttribute("aria-expanded", "true");
    await expect(row(q, "m-101").locator(".cap-mq-quote")).toBeVisible();
    await expect(row(q, "m-101").locator(".cap-mq-quote")).toContainText("Lysogeny is not a failure to lyse");
    await page.keyboard.press("Space");
    await expect(t).toHaveAttribute("aria-expanded", "false");
    await expect(row(q, "m-101").locator(".cap-mq-quote")).toBeHidden();
  });

  test("keyboard: a approves the row at once: it leaves Waiting, the counts follow, focus moves to the next row, a message offers Undo", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await title(q, "m-101").focus();
    await page.keyboard.press("a");
    await expect(row(q, "m-101")).toBeHidden();
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "approved");
    await expect(title(q, "m-102")).toBeFocused();
    await expect(q.getByRole("radio", { name: "Waiting 3 mentions" })).toBeChecked();
    await expect(q.getByRole("radio", { name: "Approved 13 mentions" })).toBeVisible();
    await expect(q.locator("[data-cap-part='summary']")).toHaveText("3 waiting, 2 with a source gone");
    await expect(region(page)).toContainText("Approved the mention from Rosa Park.");
    await expect(region(page).getByRole("button", { name: /^Undo/ })).toBeVisible();
  });

  test("keyboard: s marks the row as spam and d moves it to the bin, each with Undo", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await title(q, "m-101").focus();
    await page.keyboard.press("s");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "spam");
    await expect(region(page)).toContainText("Marked the mention from Rosa Park as spam.");
    await expect(q.getByRole("radio", { name: "Spam 4 mentions" })).toBeVisible();
    await expect(title(q, "m-102")).toBeFocused();
    await page.keyboard.press("d");
    await expect(row(q, "m-102")).toHaveAttribute("data-state", "bin");
    await expect(region(page)).toContainText("Moved the mention from Sam Okafor to the bin.");
    await expect(q.getByRole("radio", { name: "Bin 2 mentions" })).toBeVisible();
  });

  test("keyboard: z undoes the last decision: the row comes back, focused, and the counts return", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await title(q, "m-101").focus();
    await page.keyboard.press("s");
    await expect(row(q, "m-101")).toBeHidden();
    await page.keyboard.press("z");
    await expect(row(q, "m-101")).toBeVisible();
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "waiting");
    await expect(title(q, "m-101")).toBeFocused();
    await expect(q.getByRole("radio", { name: "Waiting 4 mentions" })).toBeVisible();
    await expect(q.getByRole("radio", { name: "Spam 3 mentions" })).toBeVisible();
    await expect(region(page)).toContainText("The mention from Rosa Park is back where it was.");
  });

  test("keyboard: z walks back through earlier decisions, newest first", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await title(q, "m-101").focus();
    await page.keyboard.press("a");
    await page.keyboard.press("s");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "approved");
    await expect(row(q, "m-102")).toHaveAttribute("data-state", "spam");
    await page.keyboard.press("z");
    await expect(row(q, "m-102")).toHaveAttribute("data-state", "waiting");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "approved");
    await expect(region(page)).toContainText("Earlier: Approved the mention from Rosa Park.");
    await page.keyboard.press("z");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "waiting");
    await expect(region(page)).not.toContainText("Earlier:");
  });

  test("keyboard: the Undo button does what z does, and focus returns to the mention", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await row(q, "m-103").locator("[data-cap-action='bin']").click();
    await expect(row(q, "m-103")).toHaveAttribute("data-state", "bin");
    await region(page).getByRole("button", { name: /^Undo/ }).click();
    await expect(row(q, "m-103")).toHaveAttribute("data-state", "waiting");
    await expect(title(q, "m-103")).toBeFocused();
  });

  test("keyboard: r puts a decided mention back to waiting", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await showView(q, "Spam");
    await title(q, "m-130").focus();
    await page.keyboard.press("r");
    await expect(row(q, "m-130")).toHaveAttribute("data-state", "waiting");
    await expect(region(page)).toContainText("Put the mention from Cheap Watches back to waiting.");
    await expect(row(q, "m-130").locator("[data-cap-action]")).toHaveCount(3);
  });

  test("keyboard: x selects the row; the bulk bar counts; a second x unselects", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    const bar = q.getByRole("region", { name: "Bulk actions" });
    await title(q, "m-101").focus();
    await page.keyboard.press("x");
    await expect(row(q, "m-101").locator("[data-cap-part='select']")).toBeChecked();
    await expect(row(q, "m-101")).toHaveAttribute("data-selected", "");
    await expect(bar.getByRole("status")).toHaveText("1 selected");
    await page.keyboard.press("j");
    await page.keyboard.press("x");
    await expect(bar.getByRole("status")).toHaveText("2 selected");
    await page.keyboard.press("x");
    await expect(bar.getByRole("status")).toHaveText("1 selected");
    await title(q, "m-101").focus();
    await page.keyboard.press("x");
    await expect(bar.getByRole("status")).toHaveText("No rows selected");
    await expect(bar.getByRole("button", { name: "Clear selection" })).toBeHidden();
  });

  test("keyboard: a key acts on every selected row when the focused row is selected, else on the focused row only", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await row(q, "m-101").locator("[data-cap-part='select']").check();
    await row(q, "m-102").locator("[data-cap-part='select']").check();
    // A focused row that is not selected: only it.
    await title(q, "m-104").focus();
    await page.keyboard.press("d");
    await expect(row(q, "m-104")).toHaveAttribute("data-state", "bin");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "waiting");
    // A focused row that is selected: the whole selection.
    await title(q, "m-101").focus();
    await page.keyboard.press("s");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "spam");
    await expect(row(q, "m-102")).toHaveAttribute("data-state", "spam");
    await expect(region(page)).toContainText("Marked 2 mentions as spam.");
  });

  test("keyboard: the bulk bar's buttons act on the selection, and Undo reverses all of it", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    const bar = q.getByRole("region", { name: "Bulk actions" });
    await row(q, "m-101").locator("[data-cap-part='select']").check();
    await row(q, "m-102").locator("[data-cap-part='select']").check();
    await bar.getByRole("button", { name: "Spam", exact: true }).click();
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "spam");
    await expect(row(q, "m-102")).toHaveAttribute("data-state", "spam");
    await expect(bar.getByRole("status")).toHaveText("No rows selected");
    // Focus did not fall to the page: it is on a row that is still there.
    await expect(title(q, "m-103")).toBeFocused();
    await page.keyboard.press("z");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "waiting");
    await expect(row(q, "m-102")).toHaveAttribute("data-state", "waiting");
  });

  test("keyboard: select all ticks every row shown, and Clear selection unticks them and returns focus to a row", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    const bar = q.getByRole("region", { name: "Bulk actions" });
    await q.getByRole("checkbox", { name: "Select all 4 shown" }).check();
    await expect(bar.getByRole("status")).toHaveText("4 selected");
    await bar.getByRole("button", { name: "Clear selection" }).click();
    await expect(bar.getByRole("status")).toHaveText("No rows selected");
    expect(await q.locator("li.cap-mq-row[data-selected]").count()).toBe(0);
    await expect(q.locator(".cap-row-title button").first()).toBeFocused();
  });

  test("keyboard: a, s, d and x do nothing in a text field", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await page.evaluate(() => {
      const input = document.createElement("input");
      input.id = "stray-field";
      input.type = "text";
      document.querySelector("#mq-main .cap-mq-head")?.append(input);
    });
    await page.locator("#stray-field").focus();
    await page.keyboard.type("asdx");
    await expect(page.locator("#stray-field")).toHaveValue("asdx");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "waiting");
    await title(q, "m-101").focus();
    await page.keyboard.press("Control+s");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "waiting");
  });

  test("keyboard: single keys stay quiet when they are switched off, and the hints go", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await page.evaluate(() => (document.documentElement.dataset.capSingleKeys = "off"));
    await title(q, "m-101").focus();
    for (const key of ["a", "s", "d", "x", "j"]) await page.keyboard.press(key);
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "waiting");
    await expect(title(q, "m-101")).toBeFocused();
    await expect(row(q, "m-101").locator("kbd.cap-kbd").first()).toBeHidden();
    await expect(row(q, "m-101").locator("[data-cap-action='approve']")).not.toHaveAttribute("aria-keyshortcuts", /./);
    // The buttons still work.
    await row(q, "m-101").locator("[data-cap-action='approve']").click();
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "approved");
  });

  test("keyboard: approving a mention whose source is gone asks first, with focus on Cancel, and Cancel changes nothing", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await showView(q, "Source gone");
    await title(q, "m-150").focus();
    await page.keyboard.press("a");
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Its source page no longer exists");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(row(q, "m-150")).toHaveAttribute("data-state", "waiting");
    await expect(title(q, "m-150")).toBeFocused();
  });

  test("keyboard: confirming approves it at once, with Undo, and focus moves to the next row", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await showView(q, "Source gone");
    await row(q, "m-150").locator("[data-cap-action='approve']").click();
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: "Approve anyway" }).click();
    await expect(dialog).toBeHidden();
    await expect(row(q, "m-150")).toHaveAttribute("data-state", "approved");
    await expect(row(q, "m-150").locator(".cap-row-status .cap-status")).toHaveText(["Approved", "Source gone"]);
    await expect(region(page)).toContainText("Approved the mention from Kai Anders.");
    await expect(title(q, "m-151")).toBeFocused();
    await page.keyboard.press("z");
    await expect(row(q, "m-150")).toHaveAttribute("data-state", "waiting");
  });

  test("keyboard: a bulk approve leaves the mentions whose source is gone, and says so", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await showView(q, "Waiting");
    // Select a waiting mention and make one gone mention part of the selection by hand: the gone view is separate, so use the bar on the gone view.
    await showView(q, "Source gone");
    await q.getByRole("checkbox", { name: "Select all 2 shown" }).check();
    await q.getByRole("region", { name: "Bulk actions" }).getByRole("button", { name: "Approve", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(row(q, "m-150")).toHaveAttribute("data-state", "waiting");
    await expect(region(page)).toContainText("2 with a source gone were left selected: approve them one at a time.");
  });

  test("keyboard: Delete permanently previews in a confirm dialog with focus on Cancel, and has no key", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await showView(q, "Bin");
    const del = row(q, "m-140").locator("[data-cap-action='delete']");
    await expect(del).not.toHaveAttribute("aria-keyshortcuts", /./);
    await title(q, "m-140").focus();
    await page.keyboard.press("Delete");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await del.click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("This cannot be undone.");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(row(q, "m-140")).toBeVisible();
  });

  test("behaviour: confirming Delete permanently removes the row for good, says so without Undo, and tells the app", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await page.evaluate(() => {
      (window as unknown as { __deleted: string[] }).__deleted = [];
      document.addEventListener("cap:mod-deleted", (e) => (window as unknown as { __deleted: string[] }).__deleted.push(...(e as CustomEvent).detail.ids));
    });
    await showView(q, "Bin");
    await row(q, "m-140").locator("[data-cap-action='delete']").click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete permanently" }).click();
    await expect(row(q, "m-140")).toHaveCount(0);
    await expect(q.getByRole("radio", { name: "Bin 0 mentions" })).toBeVisible();
    await expect(region(page)).toContainText("Deleted the mention from Dev Patel permanently.");
    await expect(region(page).getByRole("button", { name: /^Undo/ })).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __deleted: string[] }).__deleted)).toEqual(["m-140"]);
    await expect(q.locator("[data-cap-part='empty']")).toContainText("The bin is empty");
  });

  test("behaviour: the retention sweep names what it will remove, and removes only the expired", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    const sweep = q.getByRole("button", { name: /^Remove \d+ expired/ });
    await expect(sweep).toHaveText("Remove 1 expired");
    await sweep.click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("1 marked as spam");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await dialog.getByRole("button", { name: "Remove them" }).click();
    await expect(row(q, "m-132")).toHaveCount(0);
    await expect(row(q, "m-130")).toHaveCount(1);
    await expect(q.getByRole("button", { name: "Remove 0 expired" })).toHaveAttribute("aria-disabled", "true");
    await expect(q.getByRole("radio", { name: "Spam 2 mentions" })).toBeVisible();
  });

  test("keyboard: the filter is a radio group; the arrow keys change the view, and the selection is cleared", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await row(q, "m-101").locator("[data-cap-part='select']").check();
    await q.getByRole("radio", { name: /^Waiting/ }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(q.getByRole("radio", { name: /^Approved/ })).toBeChecked();
    await expect(row(q, "m-110")).toBeVisible();
    await expect(row(q, "m-101")).toBeHidden();
    await expect(q.getByRole("region", { name: "Bulk actions" }).getByRole("status")).toHaveText("No rows selected");
    await expect(q.locator("li.cap-mq-row:not([hidden])")).toHaveCount(12);
    await page.keyboard.press("ArrowLeft");
    await expect(q.getByRole("radio", { name: /^Waiting/ })).toBeChecked();
    await expect(row(q, "m-101").locator("[data-cap-part='select']")).not.toBeChecked();
  });

  test("behaviour: the last row of a view decided leaves the empty state with focus, not a lost focus", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await showView(q, "Bin");
    await title(q, "m-140").focus();
    await page.keyboard.press("r");
    await expect(q.locator("[data-cap-part='empty']")).toBeVisible();
    await expect(q.locator("[data-cap-part='empty']")).toContainText("The bin is empty");
    await expect(q.locator("[data-cap-part='empty']")).toBeFocused();
  });

  test("behaviour: a decision tells the app which ids moved, from where to where", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await page.evaluate(() => {
      (window as unknown as { __decided: unknown[] }).__decided = [];
      document.addEventListener("cap:mod-decided", (e) => (window as unknown as { __decided: unknown[] }).__decided.push((e as CustomEvent).detail));
    });
    await title(q, "m-101").focus();
    await page.keyboard.press("s");
    expect(await page.evaluate(() => (window as unknown as { __decided: unknown[] }).__decided)).toEqual([{ ids: ["m-101"], action: "spam", from: { "m-101": "waiting" }, to: { "m-101": "spam" } }]);
  });

  test("keyboard: the ? button opens the shortcuts sheet, which lists the queue's keys", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    await queue(page).getByRole("button", { name: /^Keyboard shortcuts/ }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText("Moderation queue");
    await expect(sheet).toContainText("Mark the row as spam");
    await page.keyboard.press("Escape");
    await expect(queue(page).getByRole("button", { name: /^Keyboard shortcuts/ })).toBeFocused();
  });

  test("behaviour: the empty state names what is empty and is reached by focus", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const empty = page.locator("#mq-empty [data-cap-part='empty']");
    await expect(empty).toBeVisible();
    await expect(empty).toContainText("All clear");
    await expect(empty).toContainText("No mentions are waiting");
    await expect(page.locator("#mq-empty .cap-mq-list")).toBeHidden();
  });
});
