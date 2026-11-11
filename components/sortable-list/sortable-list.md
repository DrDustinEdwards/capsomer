---
name: sortable-list
title: Sortable list
summary: Rows or cards a person puts in order, by dragging a grip, by the keyboard or by Move up and Move down, announcing each move and handing the new order to the host.
parts: [css, behavior, react]
tool: own JavaScript
states: [rows, cards, groups of lists, repeatable rows, stack, board of lanes, read-only, Alt keys, an item up by keyboard, an item under the pointer, a grip under the pointer, the ends' buttons disabled, as delivered with no script inside a form, in React inside a form]
added: 0.7.0
updated: 0.92.0
source: carrel/research/design-writing-tools.md (4.2, the corkboard) and carrel/rulings/writing-tools-2026-10-10.md (point 7)
replaces:
  - "@dnd-kit/sortable"
  - "react-beautiful-dnd"
  - "SortableJS"
  - 'aria-roledescription="sortable"'
  - "hand-written add/remove/reorder rows (Move up and Move down buttons beside inputs)"
  - "a Move to section select with a hand-written reorder"
---

# Sortable list

One list whose order is the point: the scenes of a chapter, a corkboard of cards, the posts of a series, the steps of a checklist. Each item is a grip, the host's own content, and Move up and Move down. The list does the moving and the saying; the host keeps the order.

## When to use it

- A flat list a person puts in order: rows, or cards in a wrapping grid.
- Carrel's corkboard and a series' posts; any "drag to reorder".

## When not to

- Items at more than one level, or moving between levels: the tree. Carrel's binder stays on the tree: it nests, moves between levels, has link rows and keeps one tab stop with roving focus and no per-row controls, where this list is flat, with a grip and buttons on every row.
- Sorting by a column: a table's sort, which changes the view, not the order.
- A list read in a fixed order (by date, by status): a row list.

## The default and its reason

- **Three ways to move, one result.** Drag the grip; or press Space on the grip, move with the arrow keys, Space to drop and Escape to put it back; or press Move up or Move down. The buttons are the one-pointer way that WCAG 2.5.7 asks for, and the way that works on touch without a drag.
- **The host owns the order.** A finished move is a `cap:sortable-change` event with the new order, the id, and where it moved from and to; `preventDefault` puts it back. React calls `onReorder` and shows the caller's `items` again on the next render.
- **Works with no script.** Inside a form, Move up and Move down are submit buttons (`up=<id>`, `down=<id>`) and each item posts its id as `order`, so a server can reorder with no script; with script the same buttons move in place.
- **The item moves as you go**, with no floating copy: neighbors step aside, so what you see is the order you will get. Under the pointer, the item's place is where it would land.
- **Focus stays on what you pressed.** The list moves the neighbors around the item, not the item, so the grip or button keeps focus; a button that reaches an end hands focus to the other one.
- **Up is a raised item with an accent edge** and a pressed grip (`aria-pressed`), never the color alone; in forced colors an outline.
- **Every move is said** in a polite live region: "Picked up Low water. Position 1 of 4.", "Low water: position 2 of 4.", "Dropped Low water at position 2 of 4.", "Put Low water back at position 1 of 4."
- **Leaving the list while an item is up puts it back**, as Escape does.
- **Lists in a group trade items.** Lists with the same `data-group` accept items from each other by drag, by the arrows past an end, and by a "Move {label} to" select in each item (`data-cap-part="move-to"`), the one-pointer way. The event names `list` and `fromList`. Moving between lists needs script.
- **Repeatable rows.** `layout="stack"` puts the grip and buttons beside the host's own fields; a Remove button fires the cancelable `cap:sortable-remove` (React `onRemove`), and Add (`onAdd`, `max`) focuses the new row. What is typed in a row moves with it. `empty` shows when no row is left.
- **Alt and an arrow** (`data-alt-keys`, React `altKeys`) moves the item from anywhere inside it, so a person typing in a field need not leave it. `messages` replaces the spoken text.
- **Read-only** (`readOnly`) shows the order with no grips or buttons; `busy` disables them while a save runs.

## Keyboard

| Key | Does |
| --- | --- |
| Space, Enter on a grip | Picks the item up; again, drops it where it is |
| Up arrow, Left arrow | While up: one place earlier |
| Down arrow, Right arrow | While up: one place later |
| Home, End | While up: to the start, to the end |
| Escape | While up: puts it back where it was |
| Alt+Up, Alt+Down | With `data-alt-keys`, anywhere in an item: moves it one place, keeping focus (ignored in a select) |
| Down past the last item | While up in a group: into the next list, at its start |
| Tab | Grip, then Move up, then Move down, then the next item |

## Accessibility

- An ordered list (`ol`) named by `aria-label` or `aria-labelledby`, so its length and each item's place are read.
- The grip is a button named "Move {label}", described by the one help line, with `aria-pressed` while the item is up. Move up and Move down are buttons named "Move {label} up" and "Move {label} down", disabled at the ends.
- The move-to select is named "Move {label} to"; Remove is "Remove {label}", Add is "Add {noun}". Each list has its own live region, which says "Added ...", "Removed ... N left." and moves between lists as "Moved {label} to {list}: position n of m."
- Moves are said in a `role="status"` region that exists before it changes.
- The grip takes touch for dragging (`touch-action: none`) only on itself, so the page still scrolls under a finger anywhere else.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<ol class="cap-sortable" data-cap="sortable-list" aria-label="Scenes in 01 The riverbed">
  <li class="cap-sortable-item" data-value="low-water">
    <button type="button" class="cap-sortable-handle" aria-describedby="sort-help"><svg aria-hidden="true">...</svg><span class="cap-sr-only">Move Low water</span></button>
    <div class="cap-sortable-body"><span class="cap-sortable-label">Low water</span><span class="cap-sortable-detail">Ines, 2,140 words</span></div>
    <span class="cap-sortable-steps">
      <button type="submit" name="up" value="low-water" class="cap-btn" data-variant="quiet" data-size="sm" data-icon-only data-cap-part="up" disabled>...<span class="cap-sr-only">Move Low water up</span></button>
      <button type="submit" name="down" value="low-water" class="cap-btn" data-variant="quiet" data-size="sm" data-icon-only data-cap-part="down">...<span class="cap-sr-only">Move Low water down</span></button>
    </span>
    <input type="hidden" name="order" value="low-water" />
  </li>
</ol>
<p class="cap-sr-only" id="sort-help">To move an item with the keyboard, press Space or Enter on its handle, ...</p>
```

Groups and rows: `data-group="name"` on each list; `data-list="id"` names a list for the event (otherwise its `id`); `data-alt-keys`; `data-layout="stack"`; `.cap-sortable-head` (a heading in the item, such as "Step 1"); `.cap-sortable-empty` (an `li` shown only when the list has no item); `<select data-cap-part="move-to">` and `<button data-cap-part="remove">` in an item. Listen for `cap:sortable-remove` (`preventDefault` keeps the item). `SortChangeDetail` gains `list`, `fromList`, `lists` and `by: "select"`.

Hooks: `data-layout="cards"` (a wrapping grid of cards; rows by default), `data-value` (the id the event names), `data-label` on an item (otherwise `.cap-sortable-label`'s text), `.cap-sortable-label` and `.cap-sortable-detail` for the content. Specimen hooks: `data-lifted`, `data-dragging`, `data-force="lifted"`, and `data-force="hover"` on a grip. With no script, a list outside a form leaves out the grips and the steps.

```js
import { enhance, moveId } from "capsomer/behavior/sortable-list";
enhance(); // every [data-cap="sortable-list"]
el.addEventListener("cap:sortable-change", (e) => save(e.detail.order)); // { order, id, from, to, by }; preventDefault puts it back
```

In React: `<SortableList items getId getLabel renderItem onReorder layout name aria-label />`. `onReorder(order, { id, from, to })` gets the ids in their new order. `SortableBoard` is lanes of items (`lanes`, `onMove(lists, detail)`, `renderLaneHead`, `moveTo`, `readOnly`, `busy`, `empty`); in a form each item posts `name[lane]`. `useRows(value, onChange)` keeps ids for rows with fields and returns the props for `SortableList` (`items`, `getId`, `onReorder`, `onRemove`). Also `onAdd`, `addLabel`, `max`, `min`, `messages`, `altKeys`, `readOnly`, `busy`, `renderHead`, `layout="stack"`. A single list renders no wrapper, so its status region follows the `ol`. The pure functions (`moveBetween`, `locate`, `keyMove`, `moveId`, `keyTarget`, `indexAtPoint`, `sortText`) and the pointer drag (`startPointerDrag`, which the tree shares) are exported.

## Exceptions in production

None yet. Cards move in reading order: every arrow key is previous or next, not a step across a row.
