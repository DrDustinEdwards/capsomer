import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { anchorStatus, appliable, applySuggestion, countFlags, groupFlags, revertSuggestion, summaryLine, type Flag } from "./flag-list.ts";

const main = (page: Page) => page.locator("#fl-main");
const flag = (page: Page, id: string) => page.locator(`#fl-main-${id}`);
const DRAFT = "Foxhound watches 14 sites every five minutes. Roughly 40% of the alerts last quarter were false alarms. The new retry policy was shipped on Tuesday. Rosa reviewed it and said it was fine. Recieved wisdom says to alert on the first failure, but we wait for three.";

// ---------------------------------------------------------------------------------------
// Pure helpers.

const sample: Flag[] = [
  { id: "a", kind: "advisory", state: "open", cause: "c", message: "m", anchor: { id: "x", quote: "teh" }, suggestion: { replacement: "the" } },
  { id: "b", kind: "blocking", state: "resolved", cause: "c", message: "m" },
  { id: "c", kind: "blocking", state: "open", cause: "c", message: "m" },
  { id: "d", kind: "advisory", state: "resolved", cause: "c", message: "m" },
];

test("behaviour: groupFlags puts blocking first and open before resolved", () => {
  const g = groupFlags(sample);
  expect(g.blocking.map((f) => f.id)).toEqual(["c", "b"]);
  expect(g.advisory.map((f) => f.id)).toEqual(["a", "d"]);
});

test("behaviour: countFlags counts open flags by kind and the resolved ones", () => {
  expect(countFlags(sample)).toEqual({ blocking: 1, advisory: 1, open: 2, resolved: 2, total: 4 });
  expect(summaryLine(countFlags(sample))).toBe("1 blocking, 1 advisory, 2 resolved");
  expect(summaryLine(countFlags([]))).toBe("No flags");
  expect(summaryLine(countFlags([{ ...sample[1]! }]))).toBe("No open flags, 1 resolved");
});

test("behaviour: anchorStatus searches the current text for the quoted passage", () => {
  const f = sample[0]!;
  expect(anchorStatus(f, "I wrote teh thing")).toBe("found");
  expect(anchorStatus(f, "I wrote the thing")).toBe("lost");
  expect(anchorStatus(sample[2]!, "anything")).toBe("none");
  expect(anchorStatus({ anchor: { id: "x", quote: "q", lost: true } })).toBe("lost");
});

test("behaviour: applySuggestion replaces the passage, and is null when the anchor is gone", () => {
  const f = sample[0]!;
  expect(applySuggestion("fix teh typo", f)).toBe("fix the typo");
  expect(applySuggestion("fix the typo", f)).toBeNull();
  expect(applySuggestion("fix teh typo", sample[2]!)).toBeNull();
  expect(revertSuggestion("fix the typo", f)).toBe("fix teh typo");
});

test("behaviour: applySuggestion uses the context to pick the occurrence", () => {
  const f: Flag = { id: "a", kind: "advisory", state: "open", cause: "c", message: "m", anchor: { id: "x", quote: "very", before: "was ", after: " good" }, suggestion: { replacement: "quite" } };
  expect(applySuggestion("very bad; was very good", f)).toBe("very bad; was quite good");
});

test("behaviour: appliable lists open flags with a suggestion whose passage is still there", () => {
  expect(appliable(sample, "teh").map((f) => f.id)).toEqual(["a"]);
  expect(appliable(sample, "the")).toEqual([]);
});

eachTheme((theme) => {
  // -------------------------------------------------------------------------------------
  // Accessibility.

  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: every text tone and control boundary reaches its contrast", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await expectContrast(page, [
      { sel: "#fl-main-f1-s .cap-status", what: "the Blocking status word" },
      { sel: "#fl-main-f3-s .cap-status", what: "the Advisory status word" },
      { sel: "#fl-main-f1 .cap-flag-message", what: "an open flag's message" },
      { sel: "#fl-main-f1 .cap-flag-goto", what: "the Go to passage words" },
      { sel: "#fl-main-f1-d", what: "the cause line" },
      { sel: "#fl-main-f1 .cap-flag-quote-text", what: "the quoted passage" },
      { sel: "#fl-main-f1 .cap-flag-anchor-note", what: "the note over the quote" },
      { sel: "#fl-main-f2 .cap-flag-title .cap-status", what: "the Anchor lost status" },
      { sel: "#fl-main-f2 .cap-flag-quote-text", what: "the last known text" },
      { sel: "#fl-main-f3 .cap-flag-diff del", what: "the before words" },
      { sel: "#fl-main-f3 .cap-flag-diff ins", what: "the after words" },
      { sel: "#fl-main-f3 .cap-flag-suggestion-head", what: "who suggested it" },
      { sel: "#fl-main-f3 .cap-flag-note", what: "the note beside Apply" },
      { sel: "#fl-main .cap-flags-summary", what: "the summary line" },
      { sel: "#fl-main .cap-flag-group-title", what: "a group heading" },
      { sel: "#fl-main .cap-flag-group-count", what: "a group's count" },
      { sel: "#fl-main-f1 [data-cap-part='resolve']", what: "the Resolve button's edge", part: "border" },
      { sel: "#fl-main-f3 [data-cap-part='apply']", what: "the Apply button's label" },
      { sel: "#fl-guest-f6 .cap-flag-message", what: "a resolved flag's message" },
      { sel: "#fl-guest-f6 .cap-row-meta .cap-status", what: "the Resolved status" },
      { sel: "#fl-guest-f7 .cap-row-meta .cap-status", what: "the Dismissed status" },
      { sel: "#fl-guest-f6 .cap-flag-resolution", what: "who resolved it and when" },
      { sel: "#fl-guest-f3 .cap-flag-note", what: "the non-owner's reason" },
      { sel: "#fl-guest [data-cap-part='owner-note']", what: "the batch note for a non-owner" },
    ]);
  });

  test("accessibility: roles and names", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await expect(page.getByRole("region", { name: "Flags on this draft", exact: true })).toBeVisible();
    await expect(main(page).getByRole("list", { name: "Blocking" })).toBeVisible();
    await expect(main(page).getByRole("list", { name: "Advisory" })).toBeVisible();
    await expect(flag(page, "f1")).toMatchAriaSnapshot(`
      - listitem:
        - text: Blocking
        - link "This claim has no source Go to passage":
          - /url: "#fl-draft"
        - paragraph: /Sources check.*/
        - button /Resolve flag.*This claim has no source/
        - button /Dismiss flag.*This claim has no source/
        - blockquote:
          - paragraph: "Raised on this passage:"
          - paragraph: /Quoted passage.*Roughly 40%.*/
    `);
    await expect(flag(page, "f3")).toMatchAriaSnapshot(`
      - listitem:
        - text: Advisory
        - link /Spelling.*Recieved.*Go to passage/
        - button /Resolve flag.*Recieved/
        - button /Apply suggestion.*Recieved/
    `);
    // A lost anchor has no link, and says so in words.
    await expect(flag(page, "f2").getByRole("link")).toHaveCount(0);
    await expect(flag(page, "f2")).toContainText("Anchor lost");
    await expect(flag(page, "f2").getByRole("button", { name: /^Resolve flag/ })).toBeVisible();
    await expect(flag(page, "f2").getByRole("button", { name: /^Dismiss flag/ })).toBeVisible();
    // The suggestion's before and after are named for a screen reader.
    await expect(flag(page, "f3").locator(".cap-flag-diff del")).toContainText("Before: Recieved wisdom");
    await expect(flag(page, "f3").locator(".cap-flag-diff ins")).toContainText("After: Received wisdom");
  });

  test("accessibility: status is a glyph, a word and a colour", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    for (const id of ["f1", "f3"]) {
      const s = flag(page, id).locator(".cap-row-status .cap-status");
      await expect(s.locator("svg[aria-hidden='true']")).toHaveCount(1);
    }
    await expect(flag(page, "f1").locator(".cap-row-status")).toHaveText("Blocking");
    await expect(flag(page, "f3").locator(".cap-row-status")).toHaveText("Advisory");
    await expect(flag(page, "f2").locator(".cap-flag-title .cap-status svg")).toHaveCount(1);
  });

  // -------------------------------------------------------------------------------------
  // Keyboard, one test per row of the doc page's table.

  test("keyboard: Tab moves through the filter, then each flag's link and buttons", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await main(page).getByRole("radio", { name: /^Open/ }).focus();
    await page.keyboard.press("Tab"); // the batch button
    await expect(main(page).getByRole("button", { name: "Apply 2 suggestions" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(flag(page, "f1").getByRole("link")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(flag(page, "f1").getByRole("button", { name: /^Resolve/ })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(flag(page, "f1").getByRole("button", { name: /^Dismiss/ })).toBeFocused();
  });

  test("keyboard: j and k move between flags across both groups", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await flag(page, "f1").getByRole("link").focus();
    await page.keyboard.press("j");
    // f2 has no link (anchor lost), so the next target is the first open advisory flag's link.
    await expect(flag(page, "f3").getByRole("link")).toBeFocused();
    await page.keyboard.press("j");
    await expect(flag(page, "f4").getByRole("link")).toBeFocused();
    await page.keyboard.press("k");
    await expect(flag(page, "f3").getByRole("link")).toBeFocused();
    await page.keyboard.press("k");
    await expect(flag(page, "f1").getByRole("link")).toBeFocused();
  });

  test("keyboard: Enter on the title link goes to the passage", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await flag(page, "f1").getByRole("link").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#fl-draft$/);
  });

  test("keyboard: Enter or Space on Resolve does it at once and moves focus on", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await flag(page, "f1").getByRole("button", { name: /^Resolve/ }).focus();
    await page.keyboard.press("Enter");
    await expect(flag(page, "f1")).toHaveAttribute("data-state", "resolved");
    // The Open filter hides it, so focus goes to the next visible flag, not nowhere.
    await expect(flag(page, "f2").getByRole("button", { name: /^Resolve/ })).toBeFocused();
    await page.keyboard.press("Space");
    await expect(flag(page, "f2")).toHaveAttribute("data-state", "resolved");
    await expect(page.locator(":focus")).not.toHaveJSProperty("tagName", "BODY");
  });

  test("keyboard: Enter on Dismiss closes a flag whose anchor is lost", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await flag(page, "f2").getByRole("button", { name: /^Dismiss/ }).focus();
    await page.keyboard.press("Enter");
    await expect(flag(page, "f2")).toHaveAttribute("data-resolution", "dismissed");
    await expect(page.locator(".cap-message-item").first()).toContainText("Flag dismissed.");
  });

  test("keyboard: Enter on Reopen opens a resolved flag again", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await page.locator("#fl-guest").getByRole("button", { name: /^Reopen flag: The quoted review/ }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#fl-guest-f6")).toHaveAttribute("data-state", "open");
    await expect(page.locator("#fl-guest-f6").getByRole("button", { name: /^Resolve/ })).toBeFocused();
  });

  test("keyboard: Enter on Apply replaces the passage, resolves the flag and says so with Undo", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await flag(page, "f3").getByRole("button", { name: /^Apply suggestion/ }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#fl-draft")).toHaveValue(DRAFT.replace("Recieved wisdom", "Received wisdom"));
    await expect(flag(page, "f3")).toHaveAttribute("data-resolution", "applied");
    await expect(page.locator(".cap-message-item").first()).toContainText("Suggestion applied to the draft.");
    await expect(page.locator(".cap-message-item").first().getByRole("button", { name: "Undo" })).toBeVisible();
  });

  test("keyboard: Enter on Apply N suggestions opens the preview with focus on Cancel, and Esc closes it", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    const batch = main(page).getByRole("button", { name: "Apply 2 suggestions" });
    await batch.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("alertdialog", { name: "Apply 2 suggestions?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await expect(dialog).toContainText("“Recieved wisdom” becomes “Received wisdom”");
    await expect(dialog).toContainText("“was shipped on Tuesday” becomes “shipped on Tuesday”");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(batch).toBeFocused();
    // Nothing changed.
    await expect(page.locator("#fl-draft")).toHaveValue(DRAFT);
  });

  test("keyboard: arrow keys in the filter move between Open, Resolved and All and choose", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await main(page).getByRole("radio", { name: /^Open/ }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(main(page).getByRole("radio", { name: /^Resolved/ })).toBeChecked();
    await expect(flag(page, "f6")).toBeVisible();
    await expect(flag(page, "f1")).toBeHidden();
    await page.keyboard.press("ArrowRight");
    await expect(main(page).getByRole("radio", { name: /^All/ })).toBeChecked();
    await expect(flag(page, "f1")).toBeVisible();
    await expect(flag(page, "f6")).toBeVisible();
  });

  test("keyboard: z runs the newest Undo", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await flag(page, "f1").getByRole("button", { name: /^Resolve/ }).focus();
    await page.keyboard.press("Enter");
    await expect(flag(page, "f1")).toHaveAttribute("data-state", "resolved");
    await page.keyboard.press("z");
    await expect(flag(page, "f1")).toHaveAttribute("data-state", "open");
    await expect(page.locator(".cap-message-item").first()).toContainText("Flag reopened.");
    // Focus goes back to the control that was undone.
    await expect(flag(page, "f1").getByRole("button", { name: /^Resolve/ })).toBeFocused();
  });

  test("keyboard: single-key shortcuts off leave j alone", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await page.evaluate(() => document.documentElement.setAttribute("data-cap-single-keys", "off"));
    await flag(page, "f1").getByRole("link").focus();
    await page.keyboard.press("j");
    await expect(flag(page, "f1").getByRole("link")).toBeFocused();
  });

  // -------------------------------------------------------------------------------------
  // Behaviour.

  test("behaviour: the whole record, resolved flags included, is in the delivered HTML", async ({ page }) => {
    const html = await (await page.request.get("components/flag-list/states.html")).text();
    expect(html).toContain("Resolved by Rosa Park");
    expect(html).toContain("Dismissed by Dustin Edwards");
    expect(html).toContain("Anchor lost");
    expect(html).toContain("Roughly 40% of the alerts last quarter were false alarms");
    expect(html).toContain('href="#fl-draft"');
    expect(html).toContain("2 blocking, 3 advisory, 2 resolved");
  });

  test("behaviour: blocking comes before advisory, and open before resolved within a group", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await main(page).getByRole("radio", { name: /^All/ }).check();
    const order = await main(page).locator("li.cap-flag").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.flag));
    expect(order).toEqual(["f1", "f2", "f6", "f3", "f4", "f5", "f7"]);
  });

  test("behaviour: the summary line and the filter counts say it in words", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await expect(main(page).locator("[data-cap-part='summary']")).toHaveText("2 blocking, 3 advisory, 2 resolved");
    await expect(main(page).getByRole("radio", { name: "Open 5" })).toBeChecked();
    await expect(main(page).getByRole("radio", { name: "Resolved 2" })).toBeVisible();
    await expect(main(page).getByRole("radio", { name: "All 7" })).toBeVisible();
  });

  test("behaviour: resolving keeps the flag on the record with who and when, and the counts follow", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await flag(page, "f5").getByRole("button", { name: /^Resolve/ }).click();
    await expect(main(page).locator("[data-cap-part='summary']")).toHaveText("2 blocking, 2 advisory, 3 resolved");
    await expect(main(page).getByRole("radio", { name: "Open 4" })).toBeVisible();
    await expect(main(page).getByRole("radio", { name: "Resolved 3" })).toBeVisible();
    await expect(main(page).locator(".cap-flag-group[data-group='advisory'] .cap-flag-group-count")).toHaveText("2 open, 2 resolved");
    await main(page).getByRole("radio", { name: /^Resolved/ }).check();
    await expect(flag(page, "f5")).toBeVisible();
    await expect(flag(page, "f5").locator(".cap-flag-resolution")).toContainText("Resolved by Dustin Edwards");
    await expect(flag(page, "f5").locator(".cap-row-meta")).toContainText("Resolved");
    await expect(flag(page, "f5").getByRole("button", { name: /^Reopen/ })).toBeVisible();
    await expect(flag(page, "f5").getByRole("button", { name: /^Resolve/ })).toHaveCount(0);
  });

  test("behaviour: Undo puts a resolved flag back, and the announcement names it", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await flag(page, "f4").getByRole("button", { name: /^Dismiss/ }).click();
    const item = page.locator(".cap-message-item").first();
    await expect(item).toContainText("Flag dismissed.");
    await item.getByRole("button", { name: "Undo" }).click();
    await expect(flag(page, "f4")).toHaveAttribute("data-state", "open");
    await expect(flag(page, "f4")).not.toHaveAttribute("data-resolution", /.+/);
    await expect(main(page).locator("[data-cap-part='summary']")).toHaveText("2 blocking, 3 advisory, 2 resolved");
  });

  test("behaviour: a flag whose passage is edited away says Anchor lost, loses its link, and can still be resolved", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await expect(flag(page, "f1").getByRole("link")).toBeVisible();
    await page.locator("#fl-draft").fill(DRAFT.replace("Roughly 40% of the alerts last quarter were false alarms", "Some alerts were false alarms"));
    await expect(flag(page, "f1")).toHaveAttribute("data-anchor", "lost");
    await expect(flag(page, "f1").getByRole("link")).toHaveCount(0);
    await expect(flag(page, "f1")).toContainText("Anchor lost");
    await expect(flag(page, "f1").locator(".cap-flag-quote-text")).toContainText("Roughly 40% of the alerts last quarter were false alarms");
    await flag(page, "f1").getByRole("button", { name: /^Resolve/ }).click();
    await expect(flag(page, "f1")).toHaveAttribute("data-state", "resolved");
    // And the text coming back brings the link back.
    // A closed flag is a record and keeps what it said; reopened, it is read against the text again.
    await page.locator("#fl-draft").fill(DRAFT);
    await main(page).getByRole("radio", { name: /^All/ }).check();
    await flag(page, "f1").getByRole("button", { name: /^Reopen/ }).click();
    await expect(flag(page, "f1")).toHaveAttribute("data-anchor", "found");
    await expect(flag(page, "f1").getByRole("link")).toBeVisible();
  });

  test("behaviour: a lost anchor takes its suggestion out of the batch and says why", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await page.locator("#fl-draft").fill(DRAFT.replace("Recieved wisdom", "Old wisdom"));
    await expect(flag(page, "f3")).toHaveAttribute("data-anchor", "lost");
    await expect(flag(page, "f3").getByRole("button", { name: /^Apply/ })).toHaveCount(0);
    await expect(flag(page, "f3")).toContainText("Cannot be applied: the passage it replaces has changed or gone.");
    await expect(main(page).getByRole("button", { name: "Apply 1 suggestion" })).toBeVisible();
  });

  test("behaviour: a suggestion is inert until the owner applies it", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await page.waitForTimeout(300);
    await expect(page.locator("#fl-draft")).toHaveValue(DRAFT);
    await expect(flag(page, "f3").locator(".cap-flag-suggestion")).toHaveAttribute("data-state", "inert");
    await expect(flag(page, "f3")).toHaveAttribute("data-state", "open");
  });

  test("behaviour: someone who is not the owner sees the suggestion and the reason, but no Apply button", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    const guest = page.locator("#fl-guest");
    await expect(guest.getByRole("button", { name: /^Apply/ })).toHaveCount(0);
    await expect(guest.locator("#fl-guest-f3 .cap-flag-diff")).toContainText("Received wisdom");
    await expect(guest.locator("#fl-guest-f3 .cap-flag-note")).toHaveText("Only the owner, Dustin Edwards, can apply this. The draft stays as it is until they do.");
    await expect(guest.locator("[data-cap-part='owner-note']")).toBeVisible();
    // Resolving it does not offer Apply either.
    await guest.locator("#fl-guest-f6").getByRole("button", { name: /^Reopen/ }).click();
    await expect(guest.getByRole("button", { name: /^Apply/ })).toHaveCount(0);
  });

  test("behaviour: Undo of an Apply puts the old words back", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await flag(page, "f4").getByRole("button", { name: /^Apply suggestion/ }).click();
    await expect(page.locator("#fl-draft")).toHaveValue(DRAFT.replace("was shipped on Tuesday", "shipped on Tuesday"));
    await page.locator(".cap-message-item").first().getByRole("button", { name: "Undo" }).click();
    await expect(page.locator("#fl-draft")).toHaveValue(DRAFT);
    await expect(flag(page, "f4")).toHaveAttribute("data-state", "open");
    await expect(flag(page, "f4").getByRole("button", { name: /^Apply suggestion/ })).toBeVisible();
  });

  test("behaviour: Undo of an Apply refuses, and says why, when the draft was edited around it", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await flag(page, "f4").getByRole("button", { name: /^Apply suggestion/ }).click();
    await page.locator("#fl-draft").fill("Something else entirely.");
    await page.locator(".cap-message-item").first().getByRole("button", { name: "Undo" }).click();
    await expect(page.locator(".cap-message-item").first()).toContainText("The draft has changed around that passage since.");
    await expect(flag(page, "f4")).toHaveAttribute("data-resolution", "applied");
  });

  test("behaviour: applying a batch is previewed, then rewrites the draft in each place, and can be undone", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await main(page).getByRole("button", { name: "Apply 2 suggestions" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Apply 2 suggestions?" });
    await expect(dialog).toBeVisible();
    await expect(page.locator("#fl-draft")).toHaveValue(DRAFT);
    await dialog.getByRole("button", { name: "Apply 2 suggestions" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator("#fl-draft")).toHaveValue(DRAFT.replace("Recieved wisdom", "Received wisdom").replace("was shipped on Tuesday", "shipped on Tuesday"));
    await expect(flag(page, "f3")).toHaveAttribute("data-resolution", "applied");
    await expect(flag(page, "f4")).toHaveAttribute("data-resolution", "applied");
    await expect(main(page).getByRole("button", { name: /^Apply \d+ suggestion/ })).toBeHidden();
    await expect(page.locator(".cap-message-item").first()).toContainText("Applied 2 suggestions to the draft.");
    await page.locator(".cap-message-item").first().getByRole("button", { name: "Undo" }).click();
    await expect(page.locator("#fl-draft")).toHaveValue(DRAFT);
    await expect(flag(page, "f3")).toHaveAttribute("data-state", "open");
  });

  test("behaviour: cancelling the batch preview changes nothing", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await main(page).getByRole("button", { name: "Apply 2 suggestions" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator("#fl-draft")).toHaveValue(DRAFT);
    await expect(flag(page, "f3")).toHaveAttribute("data-state", "open");
  });

  test("behaviour: a change is reported to the app", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await page.evaluate(() => {
      (window as unknown as { seen: unknown[] }).seen = [];
      document.getElementById("fl-main")?.addEventListener("cap:flag-change", (e) => (window as unknown as { seen: unknown[] }).seen.push((e as CustomEvent).detail));
    });
    await flag(page, "f5").getByRole("button", { name: /^Resolve/ }).click();
    const seen = await page.evaluate(() => (window as unknown as { seen: Array<{ id: string; state: string; resolvedBy: string }> }).seen);
    expect(seen[0]).toMatchObject({ id: "f5", state: "resolved", resolvedBy: "Dustin Edwards" });
  });

  test("behaviour: nothing open leaves the record and says so", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    const done = page.locator("#fl-done");
    await expect(done.locator("[data-cap-part='summary']")).toHaveText("No open flags, 2 resolved");
    await expect(done.locator(".cap-flags-empty[data-for='open']")).toBeVisible();
    await expect(done.locator("li.cap-flag")).toHaveCount(2);
    await done.getByRole("radio", { name: /^All/ }).check();
    await expect(done.locator("#fl-done-d1")).toBeVisible();
  });

  test("behaviour: the React component draws the same list, and resolve and apply work", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    const react = page.getByRole("region", { name: "Flags on this draft (React)" });
    await expect(react).toBeVisible();
    await expect(react.locator("[data-cap-part='summary']")).toHaveText("1 blocking, 1 advisory, 1 resolved");
    await expect(react.getByRole("link", { name: /Most failures: no figure/ })).toHaveAttribute("href", "#react-draft");
    await expect(react.getByRole("button", { name: "Apply 1 suggestion" })).toBeVisible();
    await react.getByRole("button", { name: /^Apply suggestion/ }).click();
    await expect(page.locator("#react-draft")).toHaveValue("The watcher checks 9 sites. Most failures last under a minute. The rest need a person.");
    await expect(react.locator("[data-cap-part='summary']")).toHaveText("1 blocking, 0 advisory, 2 resolved");
    await page.locator(".cap-message-item").first().getByRole("button", { name: "Undo" }).click();
    await expect(page.locator("#react-draft")).toHaveValue("The watcher checks 9 sites. Most failures last under a minute. Teh rest need a person.");
    await react.getByRole("button", { name: /^Resolve flag: Most failures/ }).click();
    await expect(react.locator("[data-cap-part='summary']")).toHaveText("0 blocking, 1 advisory, 2 resolved");
    // The text edited away: the flag says so.
    await page.locator("#react-draft").fill("Nothing here.");
    await expect(react.locator("li[data-state='open']").getByText("Anchor lost").first()).toBeVisible();
  });

  test("behaviour: the filter defaults per its markup and the record is complete under All", async ({ page }) => {
    await visitStates(page, "flag-list", theme);
    await expect(page.locator("#fl-guest").getByRole("radio", { name: /^All/ })).toBeChecked();
    await expect(page.locator("#fl-guest li.cap-flag:visible")).toHaveCount(4);
  });
});

test("behaviour: the filter works before any script runs", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await ctx.newPage();
  await page.goto("components/flag-list/states.html");
  const list = page.locator("#fl-main");
  await expect(list.locator("#fl-main-f6")).toBeHidden();
  await expect(list.locator("#fl-main-f1")).toBeVisible();
  await list.getByRole("radio", { name: /^Resolved/ }).check();
  await expect(list.locator("#fl-main-f6")).toBeVisible();
  await expect(list.locator("#fl-main-f1")).toBeHidden();
  await ctx.close();
});
