---
name: bulk-bar
title: Bulk action bar
summary: "What a selection can be done to: the live count, the actions, select all in view and Clear."
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript (the shared confirm dialog and message region)
states: [a form with submit actions, outcomes after an action, three selected in the HTML, nothing selected and hidden, choose then act, reversible action with Undo, destructive action previewed, twelve items in the preview, action that fails, sticky at the bottom, sticky at the top]
added: 0.3.0
source: dustinedwards.info, app/components/admin/media-bulk-bar.tsx, bulk-tag-controls.tsx, lib/admin/bulk-tag.ts, media-confirm-dialogs.tsx, posts-confirm-dialogs.tsx; shadcn/ui Sonner and the Data Table selection bar (Base UI flavor, nova style, commit d75a96ab787f)
replaces:
  - 'class="(bulk|bulk-bar|bulk-actions|posts-bulk)[ "]'
  - "className=\"(bulk|bulk-bar|posts-bulk)[ \"]"
---

# Bulk action bar

## Usage

```html
<div class="cap-bulk" data-cap="bulk-bar" role="region" aria-label="Bulk actions">
  <p class="cap-bulk-count" role="status">3 selected</p>
  <div class="cap-bulk-actions">...buttons...</div>
  <button class="cap-btn cap-bulk-clear" data-variant="quiet">Clear selection</button>
</div>
```

```html
<div class="cap-bulk" data-cap="bulk-bar" data-cap-list="drafts" role="region" aria-label="Bulk actions" hidden>
  <p class="cap-bulk-count" role="status">3 selected <span class="cap-bulk-detail">2.4 MB</span></p>
  <button type="button" class="cap-btn" data-variant="quiet" data-cap-part="select-all" data-cap-label="Select all {n} in view">Select all 24 in view</button>
  <div class="cap-bulk-actions">
    <button type="button" class="cap-btn" data-cap-bulk-action="archive" data-cap-said="Archived {n} draft{s}." data-cap-undone="Brought {n} draft{s} back.">Archive</button>
    <span class="cap-bulk-field"><label for="tag">Tag</label><input class="cap-input" id="tag" /></span>
    <button type="button" class="cap-btn" data-cap-bulk-action="add-tag" data-cap-value="#tag">Add tag</button>
    <button type="button" class="cap-btn" data-variant="danger" data-cap-bulk-action="bin" data-destructive
            data-cap-confirm-title="Bin {n} item{s}?" data-cap-confirm-lead="Binned drafts cannot be brought back."
            data-cap-confirm-action="Bin {n} item{s}">Bin</button>
  </div>
  <button type="button" class="cap-btn cap-bulk-clear" data-variant="quiet">Clear selection</button>
</div>

<label class="cap-check"><input type="checkbox" data-cap-select-all data-cap-list="drafts" /> Select all</label>
<ul id="drafts">
  <li data-label="Notes on the spring release"><label class="cap-check"><input type="checkbox" value="p1" data-cap-select /> Notes on the spring release</label></li>
</ul>
```

```html
<form id="drafts-form" method="post" action="/admin/posts/bulk">
  <ul id="drafts-list"><li data-label="Notes on the spring release"><label class="cap-check"><input type="checkbox" name="ids" value="p1" data-cap-select /> Notes on the spring release</label></li></ul>
  <div class="cap-bulk" data-cap="bulk-bar" data-cap-list="drafts-list" role="region" aria-label="Bulk actions">
    <p class="cap-bulk-count" role="status">Tick the drafts to act on</p>
    <div class="cap-bulk-actions">
      <button type="submit" class="cap-btn" name="intent" value="archive">Archive</button>
      <button type="submit" class="cap-btn" data-variant="danger" data-destructive name="intent" value="bin">Bin</button>
    </div>
    <button type="button" class="cap-btn cap-bulk-clear" data-variant="quiet">Clear selection</button>
  </div>
</form>
```

```html
<div class="cap-bulk-results" data-cap-part="results" role="group" aria-labelledby="bulk-results">
  <p class="cap-bulk-results-summary" id="bulk-results">2 done, 1 not done.</p>
  <ul class="cap-bulk-results-list">
    <li data-ok="false"><span class="cap-status" data-tone="crit">[glyph]Not done</span> <span class="cap-bulk-result-label">What a mention queue is for</span> <span class="cap-bulk-result-message">Changed on the site since this page was loaded.</span>
      <ul class="cap-bulk-result-uses"><li>Notes on the spring release (cover image)</li></ul></li>
    <li data-ok="true"><span class="cap-status" data-tone="ok">[glyph]Done</span> <span class="cap-bulk-result-label">Notes on the spring release</span></li>
  </ul>
  <button type="button" class="cap-btn" data-variant="quiet" data-size="sm" data-cap-part="dismiss-results" hidden>Dismiss results</button>
</div>
``` A bar outside the form names it with `form="drafts-form"` on each submit button.

```ts
import { enhance, bindBulk, performBulk, selectedItems, clearSelection } from "capsomer/behavior/bulk-bar";
enhance(); // every [data-cap="bulk-bar"]; needs a [data-cap="message"] region on the page for results
bindBulk(bar, {
  archive: { run: (items) => api.archive(items.map((i) => i.id)), undo: (items) => api.restore(items.map((i) => i.id)) },
  bin: { run: (items) => api.bin(items.map((i) => i.id)) }, // destructive: runs only after the preview
});
bar.addEventListener("cap-bulk-action", (e) => refresh(e.detail)); // { action, items, value }, after it ran
bar.addEventListener("cap-bulk-change", (e) => (e.detail.count)); // { items, count } on every change
```

```tsx
import { BulkBar } from "capsomer/react/bulk-bar";
<BulkBar items={selected} total={rows.length} onSelectAll={selectAll} onClear={clear} detail="2.4 MB"
  actions={[
    { id: "archive", label: "Archive", said: "Archived {n} draft{s}.", run: archive, undo: restore },
    { id: "bin", label: "Bin", destructive: true, confirmTitle: "Bin {n} item{s}?", confirmAction: "Bin {n} item{s}", run: bin },
  ]} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab, Shift Tab | Moves through Select all, the actions, any field, and Clear selection, in reading order |
| Enter or Space on an action | A reversible action runs at once and the region says so, with Undo; a destructive one opens the preview with focus on Cancel |
| Enter or Space on Clear selection | Clears the selection; focus returns to the list |
| Esc, in the list or the bar | Clears the selection; focus returns to the item last touched |
| Space, on an item's checkbox | Selects or clears it; the count follows |
| z | Runs the last action's Undo (the message region's key; off with the shortcuts switch, which sets `data-cap-single-keys="off"` on `<html>`) |

- The bar is `role="region"` named "Bulk actions"; the count is a `role="status"` inside it, announced as it changes.
- The preview is the confirm dialog: `role="alertdialog"`, named by its title, described by its lead and its list, focus on Cancel, Esc closes.
- A destructive action is a word and a color (the danger variant), never color alone.
- The count and the detail reach 4.5:1; the bar's edge reaches 3:1; forced colors keep the edge.
- Hit areas are the buttons' own, at least `var(--target)`; density moves the bar's padding.
