---
name: bulk-bar
title: Bulk action bar
summary: What a selection can be done to: the live count, the actions, select all in view and Clear. A reversible action runs at once with Undo; a destructive one previews every item first.
parts: [css, behaviour, react]
tool: native + own JavaScript (the shared confirm dialog and message region)
states: [a form with submit actions, three selected in the HTML, nothing selected and hidden, choose then act, reversible action with Undo, destructive action previewed, twelve items in the preview, action that fails, sticky at the bottom, sticky at the top]
added: 0.3.0
source: dustinedwards.info, app/components/admin/media-bulk-bar.tsx, bulk-tag-controls.tsx, lib/admin/bulk-tag.ts, media-confirm-dialogs.tsx, posts-confirm-dialogs.tsx; shadcn/ui Sonner and the Data Table selection bar (Base UI flavour, nova style, commit d75a96ab787f)
replaces:
  - 'class="(bulk|bulk-bar|bulk-actions|posts-bulk)[ "]'
  - "className=\"(bulk|bulk-bar|posts-bulk)[ \"]"
---

# Bulk action bar

A bar that says how many things are selected and what can be done to all of them at once. It is in the page when there is a selection and out of it when there is not.

**Provenance.** MIXED, against dustinedwards.info (`media-bulk-bar.tsx`, `bulk-tag-controls.tsx`, `lib/admin/bulk-tag.ts`, `media-confirm-dialogs.tsx`, `posts-confirm-dialogs.tsx`). EXTRACTED: the count with a quiet detail beside it (the site shows the total size), Copy addresses, the tag field with Add and Remove, Move to trash, Clear, one count for the selection, `type="button"` on every control so the bar never submits the form around it, and the rule that a one-way action lists what is at stake before it runs ("stake" in the site's confirm dialog). REWROTE: the site's bulk trash opened a confirm dialog; here a reversible action runs at once and offers Undo (the message region's pattern, `z` is Undo), and only a destructive action previews, in the shared confirm dialog. The site's count was not a live region ("the grid's own status region announces it"); here the count is the bar's own status. The bar, the helpers and the React wrapper are new.

## When to use it

Over any list where several rows or tiles can be chosen: posts, media, mentions, jobs. It is the one place a list's bulk actions live.

## When not to

- An action on one item is a button on that item (row actions, the inspector), not this bar.
- A choice that applies to the whole list without a selection (a filter, a sort) is a toolbar of chips or a segmented control.
- A one-off "are you sure" for something reversible: do it and offer Undo.

## The default and its reason

- **The contract is small and fixed**, so other components can use it: the region, the count, the actions, Clear selection (see Markup). Everything else is optional.
- **Appears when the count is above zero, and is `hidden` otherwise.** With nothing selected the bar is not a control to find or tab past. A server that renders a selection renders the bar with its count; a server that renders none renders it `hidden`.
- **The count is the bar's own `role="status"`.** It is written a frame after the bar appears, because a status region that is shown and filled in one step is often missed.
- **A reversible action runs at once and offers Undo** through the message region. The result says what happened ("Archived 2 drafts."), Undo stays until dismissed, `z` runs it. Asking first teaches people to press through the question.
- **A destructive action previews every item, then performs.** The shared confirm dialog opens with the count in the title ("Bin 12 items?"), a list of every selected item (the dialog body scrolls and becomes a keyboard stop when it overflows; the list is never shortened, because a preview that hides items is not one), the action button named "Bin 12 items" at the far end, and focus on Cancel. A failure stays in the dialog with the reason and Try again.
- **Esc clears the selection**, from the list or the bar. Focus goes back to the item last touched, not to the page.
- **Clear selection is a plain, quiet button at the far end**, apart from the actions. "Select all N in view" sits beside the count while fewer than all are selected; it selects what the person can see (a filter or a search may hide items), never a hidden item.
- **The bar sticks to the bottom of its scroll container** (the top, with `data-position="top"`), so it is reachable however far the list is scrolled. It wears the popover surface with an edge that reaches 3:1 on the page.
- **Every control is `type="button"`**, so it never submits a form the list sits in, except in form mode.
- **Form mode: the actions are the form's own submit buttons, and the server confirms.** For a list that is a plain form (the boxes are `name="ids"` inputs in a `<form method="post">`), an action is `<button type="submit" name="intent" value="archive">`. The bar is in the delivered page with no script, with static count text ("Tick the drafts to act on"), and the browser posts the ticked ids and the intent. A destructive intent (`data-destructive`, which only gives the danger look here) is answered by the server with its own page that lists every item and asks, because a page that works without script cannot run the preview dialog. With script the bar counts, hides while nothing is ticked and shows when something is, and refuses a press with nothing ticked ("Tick at least one item first."). It does not run, preview, offer Undo or clear: the response page is the result. Esc, Select all and Clear selection work as before.

## The shadcn component it matches

shadcn has no bulk bar. The nearest are its Data Table's selection footer ("3 of 24 row(s) selected") and the floating Sonner surface. Matched: the popover surface (raised, rounded, a hairline edge, a shadow), the compact buttons, the muted detail text. Not in shadcn: the live count, the preview and the Undo.

## Deliberately different

- **The count is a status region, not a footer line**, and it is not shown as "3 of 24": the total is in the Select all button, where it is an action.
- **A destructive action is a danger button**, so its weight says what it does before the dialog does.
- **Undo, not a dialog, for what can be undone.** The site confirmed even a move to the trash. In Capsomer's rule a reversible action is not asked about. A caller whose action is reversible in principle but costly (a bulk change to 400 posts) can still mark it `data-destructive`; the decision is the app's, and the default is Undo.

## Keyboard

| Key | Does |
| --- | --- |
| Tab, Shift Tab | Moves through Select all, the actions, any field, and Clear selection, in reading order |
| Enter or Space on an action | A reversible action runs at once and the region says so, with Undo; a destructive one opens the preview with focus on Cancel |
| Enter or Space on Clear selection | Clears the selection; focus returns to the list |
| Esc, in the list or the bar | Clears the selection; focus returns to the item last touched |
| Space, on an item's checkbox | Selects or clears it; the count follows |
| z | Runs the last action's Undo (the message region's key; `data-cap-single-keys="off"` turns it off) |

## Accessibility

- The bar is `role="region"` named "Bulk actions"; the count is a `role="status"` inside it, announced as it changes.
- The preview is the confirm dialog: `role="alertdialog"`, named by its title, described by its lead and its list, focus on Cancel, Esc closes.
- A destructive action is a word and a colour (the danger variant), never colour alone.
- The count and the detail reach 4.5:1; the bar's edge reaches 3:1; forced colours keep the edge.
- Hit areas are the buttons' own, at least `var(--target)`; density moves the bar's padding.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

The contract, exactly:

```html
<div class="cap-bulk" data-cap="bulk-bar" role="region" aria-label="Bulk actions">
  <p class="cap-bulk-count" role="status">3 selected</p>
  <div class="cap-bulk-actions">...buttons...</div>
  <button class="cap-btn cap-bulk-clear" data-variant="quiet">Clear selection</button>
</div>
```

With the optional parts and the attributes that bind it to a list:

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
  <li data-label="Notes on the Foxhound release"><label class="cap-check"><input type="checkbox" value="p1" data-cap-select /> Notes on the Foxhound release</label></li>
</ul>
```

Form mode, with no script needed:

```html
<form id="drafts-form" method="post" action="/admin/posts/bulk">
  <ul id="drafts-list"><li data-label="Notes on the Foxhound release"><label class="cap-check"><input type="checkbox" name="ids" value="p1" data-cap-select /> Notes on the Foxhound release</label></li></ul>
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

The bar is not `hidden` in the delivered HTML; the script hides it while nothing is ticked. A bar outside the form names it with `form="drafts-form"` on each submit button.

`data-cap-list` is the id of the container whose `input[type=checkbox][data-cap-select]` are the items; an item's name for the preview is its `data-label`, or `data-label` on an ancestor, or its label text. `data-position="top"` sticks the bar to the top. `data-cap-return` is a selector for where focus goes when the bar goes away. `data-cap-value` on an action is a selector for a field whose value goes with it (an empty value moves focus to the field and does nothing). `{n}` and `{s}` in the templates are the count and the plural "s".

```ts
import { enhance, bindBulk, performBulk, selectedItems, clearSelection } from "capsomer/behaviour/bulk-bar";
enhance(); // every [data-cap="bulk-bar"]; needs a [data-cap="message"] region on the page for results
bindBulk(bar, {
  archive: { run: (items) => api.archive(items.map((i) => i.id)), undo: (items) => api.restore(items.map((i) => i.id)) },
  bin: { run: (items) => api.bin(items.map((i) => i.id)) }, // destructive: runs only after the preview
});
bar.addEventListener("cap-bulk-action", (e) => refresh(e.detail)); // { action, items, value }, after it ran
bar.addEventListener("cap-bulk-change", (e) => (e.detail.count)); // { items, count } on every change
```

`performBulk({ action, items, run, undo, destructive, confirmTitle, confirmLead, confirmAction, said, undone, returnTo })` is the whole flow for an app that keeps its own selection. Pure helpers: `countText`, `fillCount`, `plural`, `previewItems`. A `run` rejects with an `Error` whose message says what happened.

```tsx
import { BulkBar } from "capsomer/react/bulk-bar";
<BulkBar items={selected} total={rows.length} onSelectAll={selectAll} onClear={clear} detail="2.4 MB"
  actions={[
    { id: "archive", label: "Archive", said: "Archived {n} draft{s}.", run: archive, undo: restore },
    { id: "bin", label: "Bin", destructive: true, confirmTitle: "Bin {n} item{s}?", confirmAction: "Bin {n} item{s}", run: bin },
  ]} />
```

In React, form mode is `form="drafts-form"` on `BulkBar` and `submit: true` on an action (a submit button named `intent`, valued with the action's id, `run` not used); the bar renders visible and hides only after the page has loaded with nothing selected.

The React wrapper is controlled: it renders the same markup, `hidden` while `items` is empty, calls `onClear` after an action ran, on Clear and on Esc, and has no `style` prop.

## Exceptions in production

None yet.
