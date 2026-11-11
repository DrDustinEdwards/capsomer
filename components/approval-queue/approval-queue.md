---
name: approval-queue
title: Approval queue
summary: Things your own side drafted, waiting for a person to approve them one by one, on the moderation queue's markup. Each item has its status, a line of context, what a check held it for, its text in an edit box, and its decisions as one form, so it works with no script; with script j and k move, a and r approve and reject, and a one-way decision asks first.
parts: [css, react]
tool: native + React (composes the moderation queue, status, empty, time and confirm dialog)
states: [awaiting approval, held by a check with findings, several decisions, read only text, closed item, decision in flight, reject asks first, empty, delivered HTML]
added: 0.91.0
updated: 0.91.0
source: Carrel, app/routes/social.tsx (the "Waiting on you" queue, lines 194 to 275, and its reject confirm) and app/app.css (.app-posts, .app-post, .app-post-meta, .app-lint); Capsomer's moderation queue for the rows, the open row and the keys.
replaces:
  - 'className="app-posts?(-meta)?[ "]'
  - 'className="app-lint[ "]'
---

# Approval queue

What your own side drafted, waiting for you: a social post a routine wrote, a reply, a generated summary. One item each: who or what it is for, its status, a line of context, what a check held it for, the text, and the decisions. You can change the text before you decide. Only what cannot be undone asks first.

It is the moderation queue's markup (`.cap-mq`, its rows, its open row) with a generic item: the app describes each item and its decisions, and the queue draws them. The moderation queue is for what strangers sent (mentions, comments), with its fixed states, Undo and bulk bar; this is for what your side made, where the app decides what each decision does.

**Provenance.** MIXED, against Carrel's social queue (`app/routes/social.tsx`, `app/app.css` `.app-post*`). EXTRACTED: the item's meta line (the account, the status as a pill, where it came from, what it is for, the cost), the list of what the lint held it for, each shown as a warning, the editable text with its hidden label ("Post text for X"), the decisions as submit buttons of one form posting `intent` and `id` (Approve as the primary, "Save and lint again", "I posted it by hand", Reject as danger), the reject confirm ("It will not be posted, and it cannot be brought back"), and "All clear" when nothing waits. REWROTE: the layout (the moderation queue's rows and open row, not a stack of bordered blocks), the status (a status word with its shape, not a pill), the keys (`j k a r`, which Carrel's queue did not have), the live line, focus after a decision, and the confirm (the queue opens it for any action that says `confirm`, instead of the page holding one dialog state of its own).

## When to use it

A queue of drafts a person approves before they go out: social posts, outgoing replies, AI drafts of a summary or a description. The text may need a small change first, and a check may have held some of them.

## When not to

- What strangers sent (mentions, comments, form submissions): the moderation queue, or the mentions list for a site's mentions.
- One approval with a body to read and a reason to give: the approval sheet.
- A record of everything that went out: the table or the row list.

## The default and its reason

- **Every item opens with its text.** The decision is made on the text, so it is in view; the title button closes an item to its title line and opens it again.
- **The decisions are the app's.** Each `ApprovalAction` is a submit button posting `intent` with the item's `id`, its hidden `fields` and its `text`. The queue does not know what approve means; the app's action does, and its answer redraws the queue.
- **A one-way decision asks first.** An action with `confirm` opens the confirm dialog with focus on Cancel and the item's text in it. With no script it posts at once, so the app's action should accept it or answer with its own confirm page.
- **Findings are warnings with a word.** Each is a status with the warning shape, in a list named "What the check held it for".
- **The live line says what is left:** "3 waiting: 2 awaiting approval, 1 held by the check", or "Nothing waiting". It is a polite status region.
- **Focus is never lost.** After a decision the item leaves (the app's answer), and focus goes to the next item's title, the previous one if it was the last, or the empty state.
- **Nothing acts while typing.** The keys stay quiet in the edit box, with a modifier, in an open dialog, and when single-key shortcuts are off (`data-cap-single-keys="off"` on `<html>`, which also hides the key hints).

## Deliberately different

- **No Undo and no bulk bar.** The app decides each item when it is posted, and a sent post cannot be called back; approving many drafts unread is what the queue is meant to stop.
- **The decisions sit under the text, not in the row's action column,** so Tab goes from the title to the text to the decisions, and a decision is made after reading.

## The shadcn component it matches

There is no approval queue in shadcn. The rows are Item (through the row list), the edit box is Textarea, the findings are Badge with an icon, the key hints are Kbd and the confirm is AlertDialog (through the confirm dialog).

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through each item: its title, its edit box, its decisions |
| `j` | Moves focus to the next item's title (to the first from outside the queue) |
| `k` | Moves focus to the previous item's title |
| Enter or Space on a title | Closes or opens the item; `aria-expanded` follows |
| `a` | Runs the focused item's approve, where it offers one |
| `r` | Runs its reject, which asks first in the confirm dialog |
| Enter or Space on a decision | Posts it; a one-way decision opens the confirm dialog with focus on Cancel, and Esc closes it |

An action's own `key` replaces the default (`a` for `approve`, `r` for `reject`). The single keys do nothing in a text field, with Ctrl, Alt or Meta held, in an open dialog, or when `data-cap-single-keys="off"` is on the page.

## Accessibility

- A `section` named by its heading, a `ul` with `role="list"`, and a polite live line. Nothing takes focus by itself except after a decision.
- Every decision names its item ("Approve for Example Co on Bluesky"), so a column of Approve buttons is not a column of the same name, and carries `aria-keyshortcuts` with a `kbd` hint hidden from screen readers.
- The edit box has a label ("Text for X", or the app's `textLabel`), hidden but read.
- Status is a shape, a word and a color.
- A decision in flight sets `aria-busy` and `aria-disabled` on every decision; they stay focusable.
- The confirm dialog is an alert dialog: focus starts on Cancel, Esc closes it, and focus returns to the button that opened it.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<section class="cap-mq cap-approvals" data-cap="approval-queue" aria-labelledby="aq-h">
  <h2 class="cap-approvals-title" id="aq-h">Waiting on you</h2>
  <div class="cap-mq-head"><p class="cap-mq-summary" role="status">2 waiting: 1 awaiting approval, 1 held by the check</p></div>
  <ul class="cap-rows cap-mq-list" role="list" aria-labelledby="aq-h" data-cap-primary>
    <li class="cap-row cap-mq-row" data-id="p-2">
      <span class="cap-row-status" id="p-2-s"><span class="cap-status" data-tone="warn"><svg aria-hidden="true">...</svg>Held by the check</span></span>
      <div class="cap-row-title"><button type="button" aria-expanded="true" aria-controls="p-2-more" aria-describedby="p-2-s p-2-d">Example Co on X</button></div>
      <p class="cap-row-detail" id="p-2-d">From the template · for "Release notes"</p>
      <span class="cap-row-meta"><time class="cap-time" datetime="2026-11-10T09:05:00Z">3 hours ago</time><span class="cap-row-chevron" aria-hidden="true"></span></span>
      <div class="cap-mq-more" id="p-2-more">
        <ul class="cap-mq-findings" aria-label="What the check held it for"><li><span class="cap-status" data-tone="warn">...Longer than 280 characters</span></li></ul>
        <form method="post" class="cap-mq-edit" id="p-2-form" aria-label="Decide: Example Co on X">
          <input type="hidden" name="id" value="p-2">
          <label class="cap-sr-only" for="p-2-text">Text for Example Co on X</label>
          <textarea class="cap-input" id="p-2-text" name="text" rows="3">...</textarea>
          <!-- or, for read only text: <blockquote class="cap-mq-quote">...</blockquote> -->
          <div class="cap-mq-decide">
            <button type="submit" class="cap-btn" data-variant="default" data-size="sm" name="intent" value="edit">Save and check again<span class="cap-sr-only"> for Example Co on X</span></button>
            <button type="submit" class="cap-btn" data-variant="danger" data-size="sm" name="intent" value="reject" aria-keyshortcuts="r">Reject<span class="cap-sr-only"> for Example Co on X</span><kbd class="cap-kbd" aria-hidden="true">r</kbd></button>
          </div>
        </form>
      </div>
    </li>
  </ul>
</section>
```

The parts it adds to the moderation queue's stylesheet: `.cap-mq-findings` (the list of findings), `.cap-mq-edit` (the form holding the text and the decisions) and `.cap-mq-decide` (the decisions under the text). Nothing of the moderation queue was renamed or removed.

```tsx
import { ApprovalQueue, type ApprovalItem } from "capsomer/react/approval-queue";

<ApprovalQueue items={items} label="Waiting on you" hideLabel Form={Form} pending={busy} textLabel={(i) => `Post text for ${i.who}`} findingsLabel="What the lint held it for" />
```

`ApprovalItem`: `id`, `who`, `status` (`{ tone, word }`), `context`, `findings`, `text`, `editable`, `at`, `actions`, `fields`. `ApprovalAction`: `intent`, `label`, `variant` (`primary`, `danger`, `default`), `key`, `confirm` (`{ title, lead, action }`). Props: `items`, `label`, `hideLabel`, `action` (where the forms post), `Form` (the router's form; a plain `form` without it), `pending`, `textLabel`, `findingsLabel`, `empty` (`{ title, text }`), `now`. The pure helpers, from `capsomer/behavior/approval-queue`: `keyOf`, `actionForKey`, `nextAfter`, `summaryLine`, `DEFAULT_KEYS`.

## Exceptions in production

None yet.
