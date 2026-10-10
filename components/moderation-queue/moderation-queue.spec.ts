import { expect, test, type Locator, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { EMPTY_TEXT, STATE_LABEL, VIEWS, VIEW_LABEL, actionsFor, bulkActionsFor, countStates, decide, decidedText, inView, summaryText, sweepLines, undoAction, undoStack } from "./moderation-queue.ts";

// The pure helpers need no browser.
test("behaviour: decide is the contract's table: only waiting, approved and rejected can be decided", () => {
  expect(decide("pending", "approve")).toBe("approved");
  expect(decide("pending", "reject")).toBe("rejected");
  expect(decide("pending", "reset", true)).toBeNull();
  expect(decide("approved", "approve")).toBeNull();
  expect(decide("approved", "reject")).toBe("rejected");
  expect(decide("rejected", "approve")).toBe("approved");
  // Back to waiting only where the site offers it.
  expect(decide("approved", "reset")).toBeNull();
  expect(decide("approved", "reset", true)).toBe("pending");
  for (const s of ["unverified", "failed"] as const) for (const a of ["approve", "reject", "reset"] as const) expect(decide(s, a, true)).toBeNull();
  expect(actionsFor("pending")).toEqual(["approve", "reject"]);
  expect(actionsFor("rejected")).toEqual(["approve"]);
  expect(actionsFor("rejected", true)).toEqual(["approve", "reset"]);
  expect(actionsFor("failed", true)).toEqual([]);
  expect(bulkActionsFor("all")).toEqual(["approve", "reject"]);
  expect(bulkActionsFor("failed", true)).toEqual([]);
});

test("behaviour: the words are the contract's states as Dustin named them, and the views count from the whole queue", () => {
  expect(Object.values(STATE_LABEL)).toEqual(["Not yet checked", "Waiting", "Approved", "Rejected", "Source not found"]);
  expect(VIEWS.map((v) => VIEW_LABEL[v])).toEqual(["Waiting", "Source not found", "Approved", "Rejected", "All"]);
  expect(Object.keys(EMPTY_TEXT)).toEqual([...VIEWS]);
  expect(inView("unverified", "pending")).toBe(false);
  expect(inView("unverified", "all")).toBe(true);
  const c = countStates([{ state: "pending" }, { state: "pending" }, { state: "unverified" }, { state: "failed" }, { state: "approved" }]);
  expect(c).toEqual({ unverified: 1, pending: 2, approved: 1, rejected: 0, failed: 1, all: 5 });
  expect(summaryText(c)).toBe("2 waiting, 1 not yet checked");
  expect(summaryText({ pending: 0, unverified: 0 })).toBe("Nothing waiting");
});

test("behaviour: Undo is the opposite decision between approved and rejected, and Back to waiting only where the site offers it", () => {
  expect(undoAction("approved")).toBe("approve");
  expect(undoAction("rejected")).toBe("reject");
  expect(undoAction("pending")).toBeNull();
  expect(undoAction("pending", true)).toBe("reset");
  expect(undoAction("unverified", true)).toBeNull();
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

test("behaviour: the sweep names what the site will remove, by kind", () => {
  expect(sweepLines({ failed: 2, rejected: 1 })).toEqual(["2 whose source was not found", "1 rejected"]);
  expect(sweepLines({ failed: 0, rejected: 3 })).toEqual(["3 rejected"]);
});

test("behaviour: each decision says what it did, for one mention and for several", () => {
  expect(decidedText("reject", ["Rosa Park"])).toBe("Rejected the mention from Rosa Park.");
  expect(decidedText("approve", ["Rosa Park", "Sam Okafor"])).toBe("Approved 2 mentions.");
  expect(decidedText("reset", ["Rosa Park"])).toBe("Put the mention from Rosa Park back to waiting.");
});

test("behaviour: the page is delivered with every mention, its state in words, and a stranger's text escaped", async ({ page }) => {
  const html = await (await page.request.get("components/moderation-queue/states.html")).text();
  for (const word of ["Waiting", "Approved", "Rejected", "Not yet checked", "Source not found"]) expect(html).toContain(`</svg>${word}</span>`);
  for (const gone of ["Spam", "Bin", "Source gone"]) expect(html).not.toContain(`</svg>${gone}</span>`);
  expect(html).toContain("&lt;script&gt;alert(");
  expect(html).not.toContain("<script>alert(");
  // Every row of the main queue is there, whatever filter shows.
  const main = html.slice(html.indexOf('id="mq-main"'), html.indexOf('id="s-failed"'));
  expect((main.match(/class="cap-row cap-mq-row"/g) ?? []).length).toBe(11);
  expect(main).toContain('value="pending" data-cap-part="view" checked');
});

const queue = (page: Page) => page.locator("#mq-main");
const row = (q: Locator, id: string) => q.locator(`li.cap-mq-row[data-id='${id}']`);
const title = (q: Locator, id: string) => row(q, id).locator(".cap-row-title button");
const region = (page: Page) => page.locator("#mq-results");
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
      { sel: "#mq-main li[data-id='m-101'] [data-cap-action='delete']", what: "Delete", part: "color" },
      { sel: "#mq-main li[data-id='m-101'] .cap-kbd", what: "the key hint" },
      { sel: "#mq-main li[data-id='m-101'] [data-cap-part='select']", what: "a select box's edge", part: "border" },
      { sel: "#mq-main .cap-mq-summary", what: "the live count" },
      { sel: "#mq-main .cap-mq-retention p", what: "the retention note" },
      { sel: "#mq-main [data-cap-part='sweep']", what: "the sweep button's edge", part: "border" },
    ]);
    // Each state's word, on the view that shows it.
    for (const [label, id] of [["Approved", "m-120"], ["Rejected", "m-130"], ["Source not found", "m-150"], ["All", "m-160"]] as const) {
      await showView(q, label);
      await expectContrast(page, [{ sel: `#mq-main li[data-id='${id}'] .cap-status`, what: `the status on ${label}` }]);
    }
  });

  test("accessibility: the roles and names of the head, the bulk bar and a row", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    await expect(queue(page).locator(".cap-mq-head")).toMatchAriaSnapshot(`
      - group "Show mentions that are":
        - radio "Waiting 4 mentions" [checked]
        - text: Waiting 4 mentions
        - radio "Source not found 2 mentions"
        - text: Source not found 2 mentions
        - radio "Approved 2 mentions"
        - text: Approved 2 mentions
        - radio "Rejected 2 mentions"
        - text: Rejected 2 mentions
        - radio "All 11 mentions"
        - text: All 11 mentions
      - status: 4 waiting, 1 not yet checked
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
        - button "Reject the mention from Rosa Park"
        - button "Delete the mention from Rosa Park"
    `);
  });

  test("accessibility: each decision is a real button with its key announced and shown", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const r = row(queue(page), "m-101");
    for (const [action, key] of [["approve", "a"], ["reject", "r"], ["delete", "d"]] as const) {
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

  test("accessibility: a source not found says so in a word and a shape, and the open row gives the site's reason", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const failed = page.locator("#mq-failed li[data-id='m-150']");
    await expect(failed.locator(".cap-row-status .cap-status")).toHaveText("Source not found");
    await expect(failed.locator(".cap-row-status svg")).toHaveCount(1);
    await expect(failed.locator(".cap-mq-why")).toContainText("answered 404");
    await expect(failed.locator(".cap-mq-why")).toContainText("cannot be approved or rejected");
    // Nothing to decide: only Delete.
    await expect(failed.locator("[data-cap-action]")).toHaveCount(1);
    await expect(failed.locator("[data-cap-action='delete']")).toHaveCount(1);
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
    await expect(page.locator("#mq-results")).toHaveAttribute("aria-atomic", "false");
  });

  test("keyboard: Tab goes from a row's select box to its title and its decisions, in order", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const r = row(queue(page), "m-102");
    await r.locator("[data-cap-part='select']").focus();
    for (const next of [r.locator(".cap-row-title button"), r.locator("[data-cap-action='approve']"), r.locator("[data-cap-action='reject']"), r.locator("[data-cap-action='delete']")]) {
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
    await expect(q.getByRole("radio", { name: "Approved 3 mentions" })).toBeVisible();
    await expect(q.locator("[data-cap-part='summary']")).toHaveText("3 waiting, 1 not yet checked");
    await expect(region(page)).toContainText("Approved the mention from Rosa Park.");
    await expect(region(page).getByRole("button", { name: /^Undo/ })).toBeVisible();
  });

  test("keyboard: r rejects the row at once, with Undo", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await title(q, "m-101").focus();
    await page.keyboard.press("r");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "rejected");
    await expect(region(page)).toContainText("Rejected the mention from Rosa Park.");
    await expect(region(page).getByRole("button", { name: /^Undo/ })).toBeVisible();
    await expect(q.getByRole("radio", { name: "Rejected 3 mentions" })).toBeVisible();
    await expect(title(q, "m-102")).toBeFocused();
  });

  test("keyboard: z undoes the last decision: the row comes back, focused, and the counts return", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await title(q, "m-101").focus();
    await page.keyboard.press("r");
    await expect(row(q, "m-101")).toBeHidden();
    await page.keyboard.press("z");
    await expect(row(q, "m-101")).toBeVisible();
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "pending");
    await expect(title(q, "m-101")).toBeFocused();
    await expect(q.getByRole("radio", { name: "Waiting 4 mentions" })).toBeVisible();
    await expect(q.getByRole("radio", { name: "Rejected 2 mentions" })).toBeVisible();
    await expect(region(page)).toContainText("The mention from Rosa Park is back where it was.");
  });

  test("keyboard: z walks back through earlier decisions, newest first", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await title(q, "m-101").focus();
    await page.keyboard.press("a");
    await page.keyboard.press("r");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "approved");
    await expect(row(q, "m-102")).toHaveAttribute("data-state", "rejected");
    await page.keyboard.press("z");
    await expect(row(q, "m-102")).toHaveAttribute("data-state", "pending");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "approved");
    await expect(region(page)).toContainText("Earlier: Approved the mention from Rosa Park.");
    await page.keyboard.press("z");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "pending");
    await expect(region(page)).not.toContainText("Earlier:");
  });

  test("keyboard: the Undo button does what z does, and focus returns to the mention", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await row(q, "m-103").locator("[data-cap-action='reject']").click();
    await expect(row(q, "m-103")).toHaveAttribute("data-state", "rejected");
    await region(page).getByRole("button", { name: /^Undo/ }).click();
    await expect(row(q, "m-103")).toHaveAttribute("data-state", "pending");
    await expect(title(q, "m-103")).toBeFocused();
  });

  test("behaviour: on a site with no Back to waiting, a decision on a waiting mention says it has no Undo", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = page.locator("#mq-comfy");
    await expect(q.locator("[data-cap-action='reset']")).toHaveCount(0);
    await title(q, "m-101").focus();
    await page.keyboard.press("a");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "approved");
    await expect(region(page)).toContainText("Approved the mention from Rosa Park. This site cannot put a mention back to waiting, so there is no Undo");
    await expect(region(page).getByRole("button", { name: /^Undo/ })).toHaveCount(0);
  });

  test("behaviour: on the same site, approved to rejected is undone by the opposite decision", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = page.locator("#mq-approved");
    await title(q, "m-121").focus();
    await page.keyboard.press("r");
    await expect(row(q, "m-121")).toHaveAttribute("data-state", "rejected");
    await expect(region(page).getByRole("button", { name: /^Undo/ })).toBeVisible();
    await page.keyboard.press("z");
    await expect(row(q, "m-121")).toHaveAttribute("data-state", "approved");
  });

  test("keyboard: Back to waiting puts a decided mention back, where the site offers it, and has no key", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await showView(q, "Rejected");
    const back = row(q, "m-130").locator("[data-cap-action='reset']");
    await expect(back).not.toHaveAttribute("aria-keyshortcuts", /./);
    await back.click();
    await expect(row(q, "m-130")).toHaveAttribute("data-state", "pending");
    await expect(region(page)).toContainText("Put the mention from Cheap Pills back to waiting.");
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
    await page.keyboard.press("a");
    await expect(row(q, "m-104")).toHaveAttribute("data-state", "approved");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "pending");
    // A focused row that is selected: the whole selection.
    await title(q, "m-101").focus();
    await page.keyboard.press("r");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "rejected");
    await expect(row(q, "m-102")).toHaveAttribute("data-state", "rejected");
    await expect(region(page)).toContainText("Rejected 2 mentions.");
  });

  test("keyboard: the bulk bar's buttons act on the selection, and Undo reverses all of it", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    const bar = q.getByRole("region", { name: "Bulk actions" });
    await row(q, "m-101").locator("[data-cap-part='select']").check();
    await row(q, "m-102").locator("[data-cap-part='select']").check();
    await bar.getByRole("button", { name: "Reject", exact: false }).click();
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "rejected");
    await expect(row(q, "m-102")).toHaveAttribute("data-state", "rejected");
    await expect(bar.getByRole("status")).toHaveText("No rows selected");
    // Focus did not fall to the page: it is on a row that is still there.
    await expect(title(q, "m-103")).toBeFocused();
    await page.keyboard.press("z");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "pending");
    await expect(row(q, "m-102")).toHaveAttribute("data-state", "pending");
  });

  test("behaviour: in All, a bulk approve leaves what has nothing to decide, and says so", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = page.locator("#mq-all");
    await q.getByRole("checkbox", { name: "Select all 5 shown" }).check();
    await q.getByRole("region", { name: "Bulk actions" }).getByRole("button", { name: "Approve", exact: false }).click();
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "approved");
    await expect(row(q, "m-140")).toHaveAttribute("data-state", "approved");
    await expect(row(q, "m-160")).toHaveAttribute("data-state", "unverified");
    await expect(row(q, "m-150")).toHaveAttribute("data-state", "failed");
    await expect(region(page)).toContainText("Approved 2 mentions. 2 were left as they were: there is nothing to decide about a mention not yet checked or whose source was not found.");
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
    await expect(title(q, "m-101")).toBeFocused();
  });

  test("keyboard: a, r, d and x do nothing in a text field", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await page.evaluate(() => {
      const input = document.createElement("input");
      input.id = "stray-field";
      input.type = "text";
      document.querySelector("#mq-main .cap-mq-head")?.append(input);
    });
    await page.locator("#stray-field").focus();
    await page.keyboard.type("ardx");
    await expect(page.locator("#stray-field")).toHaveValue("ardx");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "pending");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await title(q, "m-101").focus();
    await page.keyboard.press("Control+r");
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "pending");
  });

  test("keyboard: single keys stay quiet when they are switched off, and the hints go", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await page.evaluate(() => (document.documentElement.dataset.capSingleKeys = "off"));
    await title(q, "m-101").focus();
    for (const key of ["a", "r", "d", "x", "j"]) await page.keyboard.press(key);
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "pending");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(title(q, "m-101")).toBeFocused();
    await expect(row(q, "m-101").locator("kbd.cap-kbd").first()).toBeHidden();
    await expect(row(q, "m-101").locator("[data-cap-action='approve']")).not.toHaveAttribute("aria-keyshortcuts", /./);
    // The buttons still work.
    await row(q, "m-101").locator("[data-cap-action='approve']").click();
    await expect(row(q, "m-101")).toHaveAttribute("data-state", "approved");
  });

  test("keyboard: d asks first, in a confirm dialog with focus on Cancel and the count to type; Escape changes nothing", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await title(q, "m-103").focus();
    await page.keyboard.press("d");
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Delete the mention from An unnamed sender?");
    await expect(dialog).toContainText("This cannot be undone.");
    await expect(dialog).toContainText("From An unnamed sender (reader.example)");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await expect(dialog.getByRole("button", { name: "Delete the mention" })).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(row(q, "m-103")).toBeVisible();
  });

  test("behaviour: confirming a delete removes the row for good, says so without Undo, and tells the app", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await page.evaluate(() => {
      (window as unknown as { __deleted: string[] }).__deleted = [];
      document.addEventListener("cap:mod-deleted", (e) => (window as unknown as { __deleted: string[] }).__deleted.push(...(e as CustomEvent).detail.ids));
    });
    await showView(q, "Rejected");
    await row(q, "m-140").locator("[data-cap-action='delete']").click();
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("textbox").fill("1");
    await dialog.getByRole("button", { name: "Delete the mention" }).click();
    await expect(row(q, "m-140")).toHaveCount(0);
    await expect(q.getByRole("radio", { name: "Rejected 1 mentions" })).toBeVisible();
    await expect(region(page)).toContainText("Deleted the mention from Dev Patel.");
    await expect(region(page).getByRole("button", { name: /^Undo/ })).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __deleted: string[] }).__deleted)).toEqual(["m-140"]);
  });

  test("behaviour: the retention sweep names what the site will remove, and removes only that", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    const sweep = q.getByRole("button", { name: /^Remove \d+ expired/ });
    await expect(sweep).toHaveText("Remove 2 expired");
    await sweep.click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("1 whose source was not found");
    await expect(dialog).toContainText("1 rejected");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await dialog.getByRole("button", { name: "Remove them" }).click();
    await expect(row(q, "m-151")).toHaveCount(0);
    await expect(row(q, "m-130")).toHaveCount(0);
    await expect(row(q, "m-140")).toHaveCount(1);
    await expect(q.getByRole("button", { name: "Remove 0 expired" })).toHaveAttribute("aria-disabled", "true");
    await expect(q.getByRole("radio", { name: "Rejected 1 mentions" })).toBeVisible();
  });

  test("keyboard: the filter is a radio group; the arrow keys change the view, and the selection is cleared", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await row(q, "m-101").locator("[data-cap-part='select']").check();
    await q.getByRole("radio", { name: /^Waiting/ }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(q.getByRole("radio", { name: /^Source not found/ })).toBeChecked();
    await expect(row(q, "m-150")).toBeVisible();
    await expect(row(q, "m-101")).toBeHidden();
    await expect(q.getByRole("region", { name: "Bulk actions" }).getByRole("status")).toHaveText("No rows selected");
    await expect(q.locator("li.cap-mq-row:not([hidden])")).toHaveCount(2);
    await page.keyboard.press("ArrowLeft");
    await expect(q.getByRole("radio", { name: /^Waiting/ })).toBeChecked();
    await expect(row(q, "m-101").locator("[data-cap-part='select']")).not.toBeChecked();
  });

  test("behaviour: the last row of a view decided leaves the empty state with focus, not a lost focus", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    const q = queue(page);
    await showView(q, "Rejected");
    await title(q, "m-130").focus();
    await page.keyboard.press("a");
    await page.keyboard.press("a");
    await expect(q.locator("[data-cap-part='empty']")).toBeVisible();
    await expect(q.locator("[data-cap-part='empty']")).toContainText("Nothing rejected");
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
    await page.keyboard.press("r");
    expect(await page.evaluate(() => (window as unknown as { __decided: unknown[] }).__decided)).toEqual([{ ids: ["m-101"], action: "reject", from: { "m-101": "pending" }, to: { "m-101": "rejected" } }]);
  });

  test("keyboard: the ? button opens the shortcuts sheet, which lists the queue's keys", async ({ page }) => {
    await visitStates(page, "moderation-queue", theme);
    await queue(page).getByRole("button", { name: /^Keyboard shortcuts/ }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText("Moderation queue");
    await expect(sheet).toContainText("Reject the row");
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
