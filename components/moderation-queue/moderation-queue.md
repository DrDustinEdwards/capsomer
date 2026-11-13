---
name: moderation-queue
title: Moderation queue
summary: "Mentions from strangers waiting for a decision, with keys to move, approve, reject and delete."
group: pattern
parts: [css, behavior]
tool: native + own JavaScript
states: [waiting, approved, rejected, not yet checked, source not found, selected rows, bulk bar, open row, open row with an external source, empty, decided with Undo, decided with no Undo on a site without Back to waiting, undone, delete asks first, retention sweep, single keys off, comfortable density, phone width]
added: 0.3.0
updated: 0.98.0
source: Dustin Edwards's site admin, app/routes/admin.mentions.tsx (the queue, its filters and counts, the retention sweep), app/lib/webmention/ (retention.mjs, decide.server.ts, urls.mjs), app/components/admin/row-menu.tsx, toast.tsx and posts-table.tsx for the row actions and the status region; app/components/post-mentions.tsx for what readers see. shadcn/ui Item, Checkbox, Kbd and AlertDialog for the craft.
replaces:
  - 'class="(mention-row|mention-queue|mention-filters|mention-actions)"'
  - 'className="(mention-row|mention-queue|mention-filters|mention-actions)"'
  - "MentionRow|AdminMentions"
---

# Moderation queue

## Usage

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
      <p class="cap-row-detail" id="m-101-d">On Field notes: the spring survey: “Survey results are not a verdict…”</p>
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

## Accessibility

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

- A `ul` with `role="list"`, named by the heading above it. The live line, the bulk bar's count and the message region are polite status regions; nothing takes focus by itself.
- Every select box and every decision names its sender, so a column of Approve buttons is not a column of the same name. Each decision button has `aria-keyshortcuts` and shows its key as a `kbd` hint (hidden from screen readers, so the name is the action).
- Status is a shape, a word and a color: Waiting (square), Approved (tick), Rejected (octagon), Not yet checked (an empty circle with a bar), Source not found (triangle).
- The avatar is `aria-hidden`: the name is text beside it.
- Text 4.5:1 on the surface, the raised and the selected tones; each box's edge 3:1.
- Forced colors: a selected row gets a Highlight outline (the box shows it too), and the open row's rule is CanvasText.
- A confirm dialog is an alert dialog: focus starts on Cancel, a click outside does nothing, Esc closes it, and focus returns to the next row.
