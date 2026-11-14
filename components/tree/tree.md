---
name: tree
title: Tree
summary: Nested items a person opens and closes, chooses, and moves, after the WAI-ARIA tree pattern.
parts: [css, behavior, react]
tool: own JavaScript
states: [a binder with branches, links and a chosen row, closed branches, an empty branch, as delivered with no script, several chosen, a row not available, under the pointer, keyboard focus, being dragged, a drop before, inside and after, in React with moves the page saves]
added: 0.7.0
source: carrel/research/design-writing-tools.md (4.1, the binder) and carrel/rulings/writing-tools-2026-10-10.md (point 7)
replaces:
  - 'role="tree"'
  - 'role="treeitem"'
  - "react-arborist"
  - "react-complex-tree"
---

# Tree

## Usage

```html
<ul class="cap-tree" data-cap="tree" data-movable aria-label="Paluxy Portal binder">
  <li class="cap-tree-item" data-value="ch-01">
    <a class="cap-tree-row" href="/book/ch-01"><span class="cap-tree-label">01 The riverbed</span><span class="cap-tree-meta">6,210</span></a>
    <ul class="cap-tree-group">
      <li class="cap-tree-item" data-value="ch-01/01"><a class="cap-tree-row" href="/book/ch-01/01" aria-current="page"><span class="cap-tree-label">01 Low water</span></a></li>
    </ul>
  </li>
  <li class="cap-tree-item" data-value="ch-03" data-branch><span class="cap-tree-row"><span class="cap-tree-label">03 Untitled chapter</span></span></li>
  <li class="cap-tree-item" data-value="bible" data-collapsed>...</li>
</ul>
```

```html
<li class="cap-tree-item" data-value="ch-01" role="none">
  <a class="cap-tree-row" href="/book/ch-01" role="treeitem" aria-level="1" aria-posinset="2" aria-setsize="3" aria-expanded="true" aria-owns="ch-01-group" tabindex="-1"><span class="cap-tree-toggle" aria-hidden="true">...</span><span class="cap-tree-label">01 The riverbed</span></a>
  <ul class="cap-tree-group" role="group" id="ch-01-group">...</ul>
</li>
```

```js
import { enhance, treeFor, applyMove, reverseMove } from "capsomer/behavior/tree";
enhance(); // every [data-cap="tree"]
el.addEventListener("cap:tree-select", (e) => e.detail); // { id, label, selected, values }
el.addEventListener("cap:tree-toggle", (e) => e.detail); // { id, expanded }
el.addEventListener("cap:tree-move", (e) => save(e.detail)); // { id, from, to }; preventDefault refuses it
treeFor(el).move(reverseMove(last)); // Undo
```

## Accessibility

| Key | Does |
| --- | --- |
| Down arrow, Up arrow | Next, previous visible row |
| Right arrow | Opens a closed branch; on an open one, goes to its first child |
| Left arrow | Closes an open branch; otherwise goes to the parent |
| Home, End | First, last visible row |
| `*` | Opens every branch beside the current one |
| A letter | Goes to the next row starting with the letters typed |
| Enter | Opens a link row (the browser follows it); chooses any other row |
| Space | Chooses the row; with several, adds or removes it |
| Alt + Up arrow, Alt + Down arrow | Moves the row before or after its neighbor (`data-movable`) |
| Alt + Right arrow | Moves the row into the branch just above it, at the end |
| Alt + Left arrow | Moves the row out of its branch, to just after it |

- `role="tree"` named by `aria-label` or `aria-labelledby`; each row `role="treeitem"` with `aria-level`, `aria-posinset` and `aria-setsize`; a branch `aria-expanded` and `aria-owns` naming its `role="group"`; the list items `role="none"`. `aria-selected` on every row that can be chosen; `aria-multiselectable` with `data-selection="multi"`; `aria-disabled="true"` on one that cannot.
- The chevron is decoration (`aria-hidden`); the state is `aria-expanded`. The note at the end is part of the row's name ("Low water, Revised, 2,140").
- A move, a refused move ("Low water is already first here.") and a canceled drag are said in a `role="status"` region that exists before it changes.
- Dragging is never the only way: every drag has a keyboard move. A host whose people move rows by touch adds a one-pointer command (a "Move to" menu) that calls the same move, as WCAG 2.5.7 asks.
