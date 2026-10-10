---
name: moderation-queue
title: Moderation queue
summary: Mentions from strangers waiting for a decision, on the site-api contract's states (Waiting, Approved, Rejected, Not yet checked, Source not found): j and k to move, a and r to approve or reject at once with Undo where the site can reverse it, d to delete after a confirm, x to select for a bulk action.
parts: [css, behaviour]
tool: native + own JavaScript
states: [waiting, approved, rejected, not yet checked, source not found, selected rows, bulk bar, open row, open row with an external source, empty, decided with Undo, decided with no Undo on a site without Back to waiting, undone, delete asks first, retention sweep, single keys off, comfortable density, phone width]
added: 0.3.0
source: Dustin Edwards's site admin, app/routes/admin.mentions.tsx (the queue, its filters and counts, the retention sweep), app/lib/webmention/ (retention.mjs, decide.server.ts, urls.mjs), app/components/admin/row-menu.tsx, toast.tsx and posts-table.tsx for the row actions and the status region; app/components/post-mentions.tsx for what readers see. shadcn/ui Item, Checkbox, Kbd and AlertDialog for the craft.
replaces:
  - 'class="(mention-row|mention-queue|mention-filters|mention-actions)"'
  - 'className="(mention-row|mention-queue|mention-filters|mention-actions)"'
  - "MentionRow|AdminMentions"
---

# Moderation queue

What strangers sent, waiting for you: a mention of a post. One row each: who, the excerpt, where it came from, which post, when, and its state. You decide with a key or a button, and the decision happens at once, with Undo where the site can reverse it. Only what cannot be undone asks first.

The states are the site-api contract's (`MentionStatus`), in Dustin's words (2026-10-09): Waiting (`pending`), Approved, Rejected, Not yet checked (`unverified`) and Source not found (`failed`). This page is the markup and the behaviour for a page delivered with its rows; the React component on the contract's data, with forms, paging and the sweep, is the mentions list (`capsomer/react/mentions-list`), which draws this markup.

**Provenance.** MIXED, against the site admin at `app/routes/admin.mentions.tsx`, `app/lib/webmention/`, `app/components/admin/row-menu.tsx`, `toast.tsx` and `posts-table.tsx` and `app/components/post-mentions.tsx`. EXTRACTED: the filter line of states with counts and "pending first, because it wants an action" as the one the page opens on; every value from a stranger drawn as escaped text, and the source address as text, never a link (the site: "an unauthenticated POST chose this string"); the public side's rule that a link, where there is one, is re-parsed and carries `rel="nofollow ugc noopener"`; the row's name carrying its sender ("Approve the mention from X", because every row has an Approve and a list of them is otherwise identical); the always-present status region; the retention windows and the sweep with its confirm (failed after 30 days, rejected after 90, never a pending one, retention.mjs); "Delete removes the only copy of what somebody sent" and the admin-only rule behind it (decide.server.ts: "Reject it instead, which is reversible"); "Approving appears on the post within seconds". REWROTE: the markup (rows of the row list, not a bordered card each with a form), the behaviour (the site posts a form and reloads; here a decision is made at once, with Undo), the keys (`j k a r d x z`), the selection and the bulk bar (the site has neither), and the whole of the behaviour module. Until 0.6.0 the queue had its own states (Spam, Bin, Source gone); it now has the contract's, and a mention not yet checked is in the queue under All, with nothing to decide.

## When to use it

Anything strangers send that a person must accept before it shows: webmentions, comments, reviews, form submissions to a public page. The queue is for deciding quickly, mostly by keyboard.

## When not to

- A list of things your own team did (jobs, drafts, agents) is the row list or the attention list; nobody decides those one by one.
- A table of records compared by column (a user list with roles) is the table.
- A single approval with a body to read and a reason to give is the approval sheet.

## The default and its reason

- **A decision happens at once.** Approve (`a`) and Reject (`r`) act first. The row leaves the view, the counts and the live line change, focus moves to the next row, and the message region says "Rejected the mention from Rosa Park." The message stays until dismissed.
- **Undo is what the contract can do.** Between approved and rejected, Undo is the opposite decision, on every site. A decision on a waiting mention can be put back only where the site offers Back to waiting (site-api v0.6's `reset`; `data-cap-reset` on the root), which also shows Back to waiting on decided rows. Without it the message says "This site cannot put a mention back to waiting, so there is no Undo" and offers none.
- **`z` walks back.** The message region offers Undo for the newest decision only; the queue keeps the earlier ones (`undoStack`), so after an Undo it says "Earlier: Approved the mention from Rosa Park." and offers Undo for that one too.
- **The keys act on the row that has focus, or on the whole selection when that row is part of it** (Gmail's rule). `a` approve, `r` reject, `d` delete, `x` select, `j` and `k` move, `z` undo. A key does nothing where the decision does not apply.
- **Only what can be decided offers a decision.** A mention not yet checked, or whose source was not found, has no Approve or Reject (the contract refuses them); only Delete. A bulk decision in All leaves those and says so ("2 were left as they were").
- **Nothing acts while typing.** The keys stay quiet in a text field, with a modifier held, in an open dialog, and when single-key shortcuts are off (`data-cap-single-keys="off"` on `<html>`, also hiding the key hints and the announced shortcuts). A checkbox, a radio or a button is not typing, so a key works from a box you just ticked.
- **Five filters:** Waiting, Source not found, Approved, Rejected, All. Each state is in its own filter, and All shows every mention, Not yet checked included. The filter is a radio group (the segmented control), so the arrow keys change the view, and the rows of the others are in the page, hidden. Changing the view clears the selection.
- **The live line** says what is left: "3 waiting, 1 not yet checked", "Nothing waiting". It is a polite status region.
- **A source not found is a state with a word and a shape** ("Source not found", a triangle), and the open row gives the site's reason (its `failureReason`). Its excerpt is kept.
- **Delete is the one-way action**, on any row, previewed in a confirm dialog with focus on Cancel and the count to type ("This cannot be undone. Reject it instead to keep it off the post and keep the record."), with no Undo. An app whose credential may not delete sets `data-cap-no-delete`.
- **Retention is the site's, stated and sweepable.** The site writes its rule in the retention line and marks the rows its next sweep removes (`data-expiring`); "Remove N expired" opens a confirm that names them by kind. Waiting and approved mentions are never swept.
- **A source is text, never a link.** The host is in the row, the full address in the open row, both as text, because a stranger chose them. Only a source marked `external` becomes a link, with `rel="nofollow ugc noopener"`, and says it opens the sender's page.
- **Everything is in the HTML.** Every row is in the delivered page with its state in words; the filter hides the rows of the other views. A stranger's text is escaped. Without script the filter is a form (`?view=`) with a Show button the app answers.
- **A row opens in place** (its title is a button with `aria-expanded`) to show the whole excerpt, the source address, the post, the exact times and, for a source not found or a mention not yet checked, what that means.
- **Select all, and the bulk bar.** The bar is the bulk-bar component's markup. Empty, it stays in the page for a screen reader and is not seen, so the first selection is announced. "Clear selection" returns focus to the first row.
- **Focus is never lost.** After a decision it goes to the next row (the previous if it was the last; the empty state if none). After Undo it returns to the mention that came back.
- **Empty says which kind:** "All clear" for Waiting; "No missing sources", "Nothing approved yet", "Nothing rejected", "No mentions yet" for the others.

## Deliberately different

- **The filter is a segmented control, not tabs.** The tabs component is not used (it may not exist in an app's version, and the choice here filters a list rather than switching panels). The contract is one choice of five with counts, so tabs can replace it.
- **`j` and `k` are the queue's own,** using the row list's `moveRowFocus`, because the row list's handler stops at any `input` and the queue is full of select boxes. The list does not carry `data-cap="row-list"`, so the two handlers never both act.
- **Select-all and the bulk bar sit above the list, not in a footer,** because a queue is used from the top and the keys act on the focused row.
- **The empty bulk bar stays in the page, unseen.** A live region that appears with its text is often not announced; one that is already there is.
- **Pagination is not used here.** The queue holds the rows the page was delivered with; the mentions list pages by cursor and draws the same rows.

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
| `a` | Approves the focused row, or the whole selection when the row is selected |
| `r` | Rejects it |
| `d` | Deletes it, after the confirm dialog with the count to type |
| `z` | Undoes the last decision (the message region's key); again, the one before |
| Arrow keys on the filter | Change the view; the selection is cleared |
| Enter or Space on Delete or Back to waiting | Delete opens the confirm dialog, with focus on Cancel; Esc closes it. Back to waiting acts at once and has no key |
| Enter or Space on a bulk button | Acts on the selection; focus moves to a row |
| `?` button | Opens the shortcuts sheet, which lists these keys under "Moderation queue" |

The single keys do nothing in a text field, with Ctrl, Alt or Meta held, in an open dialog, or when `data-cap-single-keys="off"` is on the page.

## Accessibility

- A `ul` with `role="list"`, named by the heading above it. The live line, the bulk bar's count and the message region are polite status regions; nothing takes focus by itself.
- Every select box and every decision names its sender, so a column of Approve buttons is not a column of the same name. Each decision button has `aria-keyshortcuts` and shows its key as a `kbd` hint (hidden from screen readers, so the name is the action).
- Status is a shape, a word and a colour: Waiting (square), Approved (tick), Rejected (octagon), Not yet checked (dashed circle), Source not found (triangle).
- The avatar is `aria-hidden`: the name is text beside it.
- Text 4.5:1 on the surface, the raised and the selected tones; each box's edge 3:1.
- Forced colours: a selected row gets a Highlight outline (the box shows it too), and the open row's rule is CanvasText.
- A confirm dialog is an alert dialog: focus starts on Cancel, a click outside does nothing, Esc closes it, and focus returns to the next row.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<section class="cap-mq" data-cap="moderation-queue" data-view="pending" data-cap-reset aria-labelledby="mq-h">
  <h2 id="mq-h">Mentions</h2>
  <div class="cap-mq-head">
    <form method="get" class="cap-mq-filter">
      <fieldset class="cap-seg">
        <legend class="cap-sr-only">Show mentions that are</legend>
        <div class="cap-seg-options">
          <label><input type="radio" name="view" value="pending" data-cap-part="view" checked> Waiting <span class="cap-mq-count" data-cap-count="pending">4<span class="cap-sr-only"> mentions</span></span></label>
          <!-- Source not found (failed), Approved (approved), Rejected (rejected), All (all) -->
        </div>
      </fieldset>
      <button type="submit" class="cap-btn cap-mq-show">Show</button>
    </form>
    <p class="cap-mq-summary" role="status" data-cap-part="summary">4 waiting, 1 not yet checked</p>
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
    <li class="cap-row cap-mq-row" data-id="m-101" data-state="pending" data-author="Rosa Park" data-host="fieldnotes.example" data-at="2026-10-02T13:10:00Z">
      <span class="cap-mq-check"><label class="cap-check"><input type="checkbox" data-cap-part="select" value="m-101"><span class="cap-sr-only">Select the mention from Rosa Park</span></label></span>
      <span class="cap-row-status" id="m-101-s"><span class="cap-status" data-tone="info"><svg aria-hidden="true">...</svg>Waiting</span></span>
      <div class="cap-row-title"><button type="button" aria-expanded="false" aria-controls="m-101-more" aria-describedby="m-101-s m-101-d"><span class="cap-avatar" data-size="sm" aria-hidden="true"><span class="cap-avatar-fallback">RP</span></span> <span class="cap-mq-name">Rosa Park</span> <span class="cap-mq-host">fieldnotes.example</span></button></div>
      <p class="cap-row-detail" id="m-101-d">On Phage lambda: lysis or lysogeny: “Lysogeny is not a failure to lyse…”</p>
      <span class="cap-row-meta"><time class="cap-time" data-cap="time" datetime="2026-10-02T13:10:00Z">2 hours ago</time><span class="cap-row-chevron" aria-hidden="true"></span></span>
      <div class="cap-row-actions" data-cap-part="actions">
        <button type="button" class="cap-btn" data-variant="quiet" data-size="sm" data-cap-action="approve" aria-keyshortcuts="a">Approve<span class="cap-sr-only"> the mention from Rosa Park</span><kbd class="cap-kbd" aria-hidden="true">a</kbd></button>
        <button type="button" class="cap-btn" data-variant="quiet" data-size="sm" data-cap-action="reject" aria-keyshortcuts="r">Reject...<kbd class="cap-kbd" aria-hidden="true">r</kbd></button>
        <button type="button" class="cap-btn" data-variant="danger" data-size="sm" data-cap-action="delete" aria-keyshortcuts="d">Delete...<kbd class="cap-kbd" aria-hidden="true">d</kbd></button>
        <!-- a decided mention has the other decision, and Back to waiting (data-cap-action="reset", no key) where the root has data-cap-reset; a mention not yet checked or whose source was not found has Delete only -->
      </div>
      <div class="cap-mq-more" id="m-101-more" hidden>...the whole excerpt, the source as text, the post, the times...</div>
    </li>
  </ul>
  <div class="cap-mq-retention">
    <p id="mq-ret">This site removes a mention whose source was not found after 30 days, and a rejected one after 90 days. Waiting and approved mentions are never removed.</p>
    <button type="button" class="cap-btn" data-cap-part="sweep" aria-describedby="mq-ret">Remove 1 expired</button>
  </div>
</section>
```

`data-cap-reset` on the root says the site offers Back to waiting (site-api v0.6's `reset`): decided rows show it, and a decision on a waiting mention can be undone. `data-cap-no-delete` leaves Delete out where the credential may not delete.

A row carries its state in `data-state` (`unverified`, `pending`, `approved`, `rejected` or `failed`); a decided one carries `data-decided`, and one the site's next sweep removes carries `data-expiring`. The root's `data-view` is `pending`, `failed`, `approved`, `rejected` or `all`.

`import { enhance, decide, actionsFor, undoAction, undoStack } from "capsomer/behaviour/moderation-queue"`. `enhance()` attaches the keys, the filter, the selection, the decisions and the confirms, wires the key button through the shortcuts component, and adds a message region after the queue if the page has none. The pure helpers: `decide(state, action, reset)` is the contract's table (`null` where a decision does nothing), `actionsFor(state, reset)`, `bulkActionsFor(view, reset)`, `inView(state, view)`, `countStates(mentions)`, `summaryText(counts)`, `undoAction(from, reset)` (the decision that puts a mention back, or `null`), `sweepLines(expiring)`, `undoStack()`, and the words `STATE_LABEL`, `VIEW_LABEL`, `ACTION_LABEL`. Events on the root: `cap:mod-decided` (detail `{ ids, action, from, to }`, fired after the move so the app can save it), `cap:mod-undone` (`{ ids, to }`) and `cap:mod-deleted` (`{ ids }`).

In React, the mentions list draws this markup from the contract's data: `capsomer/react/mentions-list`.

**Dependencies.** The bulk bar is the bulk-bar component's markup. This component draws that markup with a layout of its own at zero specificity, so the bulk-bar stylesheet overrides it where both are loaded. The tabs and pagination components are not used.

## Exceptions in production

None yet.
