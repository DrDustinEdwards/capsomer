---
name: moderation-queue
title: Moderation queue
summary: Mentions and comments from strangers waiting for a decision: j and k to move, a, s and d to decide at once with Undo, x to select for a bulk action, and a confirm dialog only for what cannot be undone.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [waiting, approved, spam, bin, source gone, a decided mention that is also source gone, selected rows, bulk bar, open row, open row with an external source, empty, decided with Undo, undone, approve with a gone source asks first, delete permanently asks first, retention sweep, single keys off, comfortable density, phone width]
added: 0.3.0
source: Dustin Edwards's site admin, app/routes/admin.mentions.tsx (the queue, its filters and counts, the retention sweep), app/lib/webmention/ (retention.mjs, decide.server.ts, urls.mjs), app/components/admin/row-menu.tsx, toast.tsx and posts-table.tsx for the row actions and the status region; app/components/post-mentions.tsx for what readers see. shadcn/ui Item, Checkbox, Kbd and AlertDialog for the craft.
replaces:
  - 'class="(mention-row|mention-queue|mention-filters|mention-actions)"'
  - 'className="(mention-row|mention-queue|mention-filters|mention-actions)"'
  - "MentionRow|AdminMentions"
---

# Moderation queue

What strangers sent, waiting for you: a mention of a post, a comment. One row each: who, the excerpt, where it came from, which post, when, and its state. You decide with a key or a button, and the decision happens at once with Undo. Only what cannot be undone asks first.

**Provenance.** MIXED, against the site admin at `app/routes/admin.mentions.tsx`, `app/lib/webmention/`, `app/components/admin/row-menu.tsx`, `toast.tsx` and `posts-table.tsx` and `app/components/post-mentions.tsx`. EXTRACTED: the filter line of states with counts and "pending first, because it wants an action" as the one the page opens on; every value from a stranger drawn as escaped text, and the source address as text, never a link (the site: "an unauthenticated POST chose this string"); the public side's rule that a link, where there is one, is re-parsed and carries `rel="nofollow ugc noopener"`; the row's name carrying its sender ("Approve the mention from X", because every row has an Approve and a list of them is otherwise identical); the always-present status region; the retention windows and the sweep with its confirm (failed after 30 days, rejected after 90, never a pending one, retention.mjs); "Delete removes the only copy of what somebody sent" and the admin-only rule behind it (decide.server.ts: "Reject it instead, which is reversible"); "Approving appears on the post within seconds". REWROTE: the markup (rows of the row list, not a bordered card each with a form), the states (the site's `rejected` is Spam, its `failed` is Source gone, named for its cause; Bin is new, a reversible holding place), the behaviour (the site posts a form and reloads; here a decision is made at once, with Undo), the keys (`j k a s d r x z`), the selection and the bulk bar (the site has neither), the confirm for a gone source, and the whole of the behaviour module. NOT carried: the "unverified" chip. A mention that has not been verified cannot be decided (decideWebmention only touches verified rows), so it is not in the queue; an app can say how many are unverified in a line of text. The site's typed "1" confirmation: a confirm dialog with focus on Cancel previews and performs, and a typed word is for the many (the sweep keeps none either; the dialog names what it removes).

## When to use it

Anything strangers send that a person must accept before it shows: webmentions, comments, reviews, form submissions to a public page. The queue is for deciding quickly, mostly by keyboard.

## When not to

- A list of things your own team did (jobs, drafts, agents) is the row list or the attention list; nobody decides those one by one.
- A table of records compared by column (a user list with roles) is the table.
- A single approval with a body to read and a reason to give is the approval sheet.

## The default and its reason

- **A decision happens at once, then offers Undo.** Approve, Spam and Bin are all reversible (a mention in Spam or the Bin can be put back), so by the system's rule they act first. The row leaves the view, the counts and the live line change, focus moves to the next row, and the message region says "Marked the mention from Rosa Park as spam." with Undo (`z`). The message stays until dismissed.
- **`z` walks back.** The message region offers Undo for the newest decision only; the queue keeps the earlier ones (`undoStack`), so after an Undo it says "Earlier: Approved the mention from Rosa Park." and offers Undo for that one too. Press `z` again to go further back.
- **The keys act on the row that has focus, or on the whole selection when that row is part of it** (Gmail's rule). `a` approve, `s` spam, `d` bin, `r` put back to waiting, `x` select, `j` and `k` move, `z` undo. A key does nothing where the table says the decision does not apply (approving what is approved; anything but restore for the bin).
- **Nothing acts while typing.** The keys stay quiet in a text field, with a modifier held, in an open dialog, and when single-key shortcuts are off (`data-cap-single-keys="off"` on `<html>`, also hiding the key hints and the announced shortcuts). A checkbox, a radio or a button is not typing, so a key works from a box you just ticked.
- **Five filters, each in its own view, that add up:** Waiting, Approved, Spam, Bin, Source gone. A waiting mention whose source is gone is in Source gone, not in Waiting, so the counts are a partition and "4 waiting, 2 with a source gone" says what is left to do. The filter is a radio group (the segmented control), so the arrow keys change the view, and the rows of the others are in the page, hidden. Changing the view clears the selection: a selection that cannot be seen cannot be acted on.
- **The live line** says what waits: "3 waiting, 2 with a source gone", "Nothing waiting". It is a polite status region, so a decision is heard as well as seen.
- **A source that is gone is a state with a word and a shape** ("Source gone", a triangle), kept when the mention is decided: an approved mention whose source later vanished shows both words. Its excerpt is kept and it can still be approved or binned. **Approving it asks first, in a confirm dialog with focus on Cancel**, because it would put text from a page nobody can check any more on the post, where readers see it within seconds; the message with Undo is not enough for something that is public before it is undone. A bulk approve leaves such mentions selected and says so ("2 with a source gone were left selected: approve them one at a time"): the question is about each one.
- **Delete permanently is the one-way action, only from the Bin,** previewed and performed in a confirm dialog ("This removes the only copy of it. Nothing else has one."), with focus on Cancel, with no key and no Undo. An app whose credential may not delete leaves the button out; the Bin empties itself by retention.
- **Retention is stated and sweepable.** "Mentions whose source is gone are removed after 30 days, spam after 90, the bin after 30", and "Remove N expired" opens a confirm that names what it removes (counts by kind). Waiting and approved mentions are never swept. Spam is kept longer so a sender who comes back does not look new.
- **A source is text, never a link.** The host is in the row, the full address in the open row, both as text, because a stranger chose them. Only a source marked `external` becomes a link, with `rel="nofollow ugc noopener"`, and says it opens the sender's page.
- **Everything is in the HTML.** Every row is in the delivered page with its state in words; the filter hides the rows of the other views. A stranger's text is escaped. Without script the filter is a form (`?view=`) with a Show button the app answers.
- **A row opens in place** (its title is a button with `aria-expanded`) to show the whole excerpt, the source address, the post, the exact times and, for a gone source, why it matters.
- **Select all, and the bulk bar.** The bar is the bulk-bar component's markup (`data-cap="bulk-bar"`, a region named "Bulk actions", a count that is a status, the actions, Clear selection). Empty, it stays in the page for a screen reader and is not seen, so the first selection is announced. Its buttons act on the selection; "Clear selection" returns focus to the first row.
- **Focus is never lost.** After a decision it goes to the next row (the previous if it was the last; the empty state if none). After Undo it returns to the mention that came back. After a bulk action pressed in the bar it goes to a row.
- **Empty says which kind:** "All clear" for Waiting; "Nothing approved yet", "No spam", "The bin is empty", "No missing sources" for the others.

## Deliberately different

- **The filter is a segmented control, not tabs.** The tabs component is not used (it may not exist in an app's version, and the choice here filters a list rather than switching panels). The contract is one choice of five with counts, so tabs can replace it.
- **Approving a gone source asks first although approving is reversible,** for the reason above. Everything else reversible acts at once.
- **Select-all and the bulk bar sit above the list, not in a footer,** because a queue is used from the top and the keys act on the focused row.
- **The empty bulk bar stays in the page, unseen.** A live region that appears with its text is often not announced; one that is already there is.
- **Pagination is not used.** The queue holds the rows the app sends; an app with thousands pages them itself and sends the next page with the same markup.

## The shadcn component it matches

There is no moderation queue in shadcn. The rows are Item (through the row list), the select box and select-all are Checkbox, the key hints are Kbd, the confirm dialog is AlertDialog (through the confirm dialog), the result with Undo is Sonner's toast as a status region (through the message), and the empty state is Empty. The nearest whole component is the Data Table's row selection with its "n selected" toolbar, which the bulk bar and the select-all follow.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the controls in order: the filter, select all, then each row's select box, its title and its decisions; then the retention sweep |
| `j` | Moves focus to the next row's title (to the first row from outside the list) |
| `k` | Moves focus to the previous row's title |
| Enter or Space on a title | Opens or closes the row in place; `aria-expanded` follows |
| Space on a select box | Selects or unselects the row; the bulk bar counts |
| `x` | Selects or unselects the focused row |
| `a` | Approves the focused row, or the whole selection when the row is selected. A source that is gone asks first |
| `s` | Marks it as spam |
| `d` | Moves it to the bin |
| `r` | Puts a decided mention back to waiting |
| `z` | Undoes the last decision (the message region's key); again, the one before |
| Arrow keys on the filter | Change the view; the selection is cleared |
| Enter or Space on Delete permanently | Opens the confirm dialog, with focus on Cancel; Esc closes it |
| Enter or Space on a bulk button | Acts on the selection; focus moves to a row |
| `?` button | Opens the shortcuts sheet, which lists these keys under "Moderation queue" |

The single keys do nothing in a text field, with Ctrl, Alt or Meta held, in an open dialog, or when `data-cap-single-keys="off"` is on the page.

## Accessibility

- A `ul` with `role="list"`, named by the heading above it. The live line, the bulk bar's count and the message region are polite status regions; nothing takes focus by itself.
- Every select box and every decision names its sender, so a column of Approve buttons is not a column of the same name. Each decision button has `aria-keyshortcuts` and shows its key as a `kbd` hint (hidden from screen readers, so the name is the action).
- Status is a shape, a word and a colour: Waiting (square), Approved (tick), Spam (octagon), Bin (dashed circle), Source gone (triangle).
- The avatar is `aria-hidden`: the name is text beside it.
- Text 4.5:1 on the surface, the raised and the selected tones; each box's edge 3:1.
- Forced colours: a selected row gets a Highlight outline (the box shows it too), and the open row's rule is CanvasText.
- A confirm dialog is an alert dialog: focus starts on Cancel, a click outside does nothing, Esc closes it, and focus returns to the next row.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<section class="cap-mq" data-cap="moderation-queue" data-view="waiting" aria-labelledby="mq-h">
  <h2 id="mq-h">Mentions</h2>
  <div class="cap-mq-head">
    <form method="get" class="cap-mq-filter">
      <fieldset class="cap-seg">
        <legend class="cap-sr-only">Show mentions that are</legend>
        <div class="cap-seg-options">
          <label><input type="radio" name="mq-view" value="waiting" data-cap-part="view" checked> Waiting <span class="cap-mq-count" data-cap-count="waiting">4<span class="cap-sr-only"> mentions</span></span></label>
          <!-- Approved, Spam, Bin, Source gone -->
        </div>
      </fieldset>
      <button type="submit" class="cap-btn cap-mq-show">Show</button>
    </form>
    <p class="cap-mq-summary" role="status" data-cap-part="summary">4 waiting, 2 with a source gone</p>
    <button type="button" class="cap-btn" data-variant="quiet" data-size="sm" data-cap-keys-open>Keyboard shortcuts <kbd class="cap-kbd" aria-hidden="true">?</kbd></button>
  </div>
  <div class="cap-mq-tools">
    <label class="cap-check"><input type="checkbox" data-cap-part="select-all"><span data-cap-part="select-all-text">Select all 4 shown</span></label>
    <div class="cap-bulk" data-cap="bulk-bar" role="region" aria-label="Bulk actions" data-empty>
      <p class="cap-bulk-count" role="status">No rows selected</p>
      <div class="cap-bulk-actions" hidden></div>
      <button type="button" class="cap-btn cap-bulk-clear" data-variant="quiet" hidden>Clear selection</button>
    </div>
  </div>
  <div class="cap-empty cap-mq-empty" data-kind="all-clear" data-cap-part="empty" tabindex="-1" hidden>...</div>
  <ul class="cap-rows cap-mq-list" role="list" aria-labelledby="mq-h" data-cap-primary>
    <li class="cap-row cap-mq-row" data-id="m-101" data-state="waiting" data-view="waiting" data-author="Rosa Park" data-host="fieldnotes.example" data-at="2026-10-02T13:10:00Z">
      <span class="cap-mq-check"><label class="cap-check"><input type="checkbox" data-cap-part="select" value="m-101"><span class="cap-sr-only">Select the mention from Rosa Park</span></label></span>
      <span class="cap-row-status" id="m-101-s"><span class="cap-status" data-tone="info"><svg aria-hidden="true">...</svg>Waiting</span></span>
      <div class="cap-row-title"><button type="button" aria-expanded="false" aria-controls="m-101-more" aria-describedby="m-101-s m-101-d"><span class="cap-avatar" data-size="sm" aria-hidden="true"><span class="cap-avatar-fallback">RP</span></span> <span class="cap-mq-name">Rosa Park</span> <span class="cap-mq-host">fieldnotes.example</span></button></div>
      <p class="cap-row-detail" id="m-101-d">On Phage lambda: lysis or lysogeny: “Lysogeny is not a failure to lyse…”</p>
      <span class="cap-row-meta"><time class="cap-time" data-cap="time" datetime="2026-10-02T13:10:00Z">2 hours ago</time><span class="cap-row-chevron" aria-hidden="true"></span></span>
      <div class="cap-row-actions" data-cap-part="actions">
        <button type="button" class="cap-btn" data-variant="quiet" data-size="sm" data-cap-action="approve" aria-keyshortcuts="a">Approve<span class="cap-sr-only"> the mention from Rosa Park</span><kbd class="cap-kbd" aria-hidden="true">a</kbd></button>
        <!-- Spam s, Bin d; a decided mention has "Back to waiting", "Not spam" or "Restore" (r); the bin adds Delete permanently -->
      </div>
      <div class="cap-mq-more" id="m-101-more" hidden>...the whole excerpt, the source as text, the post, the times...</div>
    </li>
  </ul>
  <div class="cap-mq-retention">
    <p id="mq-ret">Mentions whose source is gone are removed after 30 days, spam after 90 days, and the bin after 30 days.</p>
    <button type="button" class="cap-btn" data-cap-part="sweep" aria-describedby="mq-ret">Remove 1 expired</button>
  </div>
</section>
```

`data-cap-no-delete` on the root (React: `canDelete={false}`) leaves Delete permanently out where the credential may not delete.

A mention whose source is gone has `data-gone` and `data-gone-at` on its row; a decided one carries `data-decided`.

`import { enhance, decide, undoStack, expiredIds } from "capsomer/behaviour/moderation-queue"`. `enhance()` attaches the keys, the filter, the selection, the decisions and the confirms, wires the key button through the shortcuts component, and adds a message region after the queue if the page has none. The pure helpers: `decide(state, action)` is the transition table (`null` where a decision does nothing), `viewOf(mention)`, `countViews(mentions)`, `summaryText(counts)`, `needsConfirm(mention, action)`, `undoStack()`, and `expiredIds(mentions, now)`. Events on the root: `cap:mod-decided` (detail `{ ids, action, from, to }`, fired after the move so the app can save it), `cap:mod-undone` (`{ ids, to }`) and `cap:mod-deleted` (`{ ids }`).

In React, inside a `<MessageProvider>`:

```tsx
import { ModerationQueue } from "capsomer/react/moderation-queue";
<ModerationQueue items={mentions} labelledBy="mq-h" primary
  onDecide={({ ids, to }) => api.decide(ids, to)} onDelete={(ids) => api.delete(ids)} />
```

**Dependencies.** The bulk bar is the bulk-bar component's markup. This component draws that markup with a layout of its own at zero specificity, so the bulk-bar stylesheet overrides it where both are loaded. The tabs and pagination components are not used.

## Exceptions in production

None yet.
