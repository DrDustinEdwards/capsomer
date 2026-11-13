---
name: sortable-list
title: Sortable list
summary: Rows or cards a person puts in order by drag, keyboard or Move buttons, announcing each move.
parts: [css, behavior, react]
tool: own JavaScript
states: [rows, cards, groups of lists, repeatable rows, stack, board of lanes, read-only, Alt keys, an item up by keyboard, an item under the pointer, a grip under the pointer, the ends' buttons disabled, as delivered with no script inside a form, in React inside a form]
added: 0.7.0
updated: 0.104.0
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

## Usage

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

```js
import { enhance, moveId } from "capsomer/behavior/sortable-list";
enhance(); // every [data-cap="sortable-list"]
el.addEventListener("cap:sortable-change", (e) => save(e.detail.order)); // { order, id, from, to, by }; preventDefault puts it back
```

## Accessibility

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

- An ordered list (`ol`) named by `aria-label` or `aria-labelledby`, so its length and each item's place are read.
- The grip is a button named "Move {label}", described by the one help line, with `aria-pressed` while the item is up. Move up and Move down are buttons named "Move {label} up" and "Move {label} down", disabled at the ends.
- The move-to select is named "Move {label} to"; Remove is "Remove {label}", Add is "Add {noun}". Each list has its own live region, which says "Added ...", "Removed ... N left." and moves between lists as "Moved {label} to {list}: position n of m."
- Moves are said in a `role="status"` region that exists before it changes.
- The grip takes touch for dragging (`touch-action: none`) only on itself, so the page still scrolls under a finger anywhere else.
