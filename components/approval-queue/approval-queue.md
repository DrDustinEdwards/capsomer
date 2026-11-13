---
name: approval-queue
title: Approval queue
summary: Things your own side drafted, waiting for a person to approve them one by one.
group: pattern
parts: [css, react]
tool: native + React (composes the moderation queue, status, empty, time and confirm dialog)
states: [awaiting approval, held by a check with findings, several decisions, read only text, closed item, decision in flight, reject asks first, empty, delivered HTML]
added: 0.98.0
updated: 0.98.0
source: Carrel, app/routes/social.tsx (the "Waiting on you" queue, lines 194 to 275, and its reject confirm) and app/app.css (.app-posts, .app-post, .app-post-meta, .app-lint); Capsomer's moderation queue for the rows, the open row and the keys.
replaces:
  - 'className="app-posts?(-meta)?[ "]'
  - 'className="app-lint[ "]'
---

# Approval queue

## Usage

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

```tsx
import { ApprovalQueue, type ApprovalItem } from "capsomer/react/approval-queue";

<ApprovalQueue items={items} label="Waiting on you" hideLabel Form={Form} pending={busy} textLabel={(i) => `Post text for ${i.who}`} findingsLabel="What the lint held it for" />
```

## Accessibility

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

- A `section` named by its heading, a `ul` with `role="list"`, and a polite live line. Nothing takes focus by itself except after a decision.
- Every decision names its item ("Approve for Example Co on Bluesky"), so a column of Approve buttons is not a column of the same name, and carries `aria-keyshortcuts` with a `kbd` hint hidden from screen readers.
- The edit box has a label ("Text for X", or the app's `textLabel`), hidden but read.
- Status is a shape, a word and a color.
- A decision in flight sets `aria-busy` and `aria-disabled` on every decision; they stay focusable.
- The confirm dialog is an alert dialog: focus starts on Cancel, Esc closes it, and focus returns to the button that opened it.
