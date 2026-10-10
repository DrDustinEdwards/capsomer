---
name: tree
title: Tree
summary: Nested items a person opens and closes, chooses, and moves, after the WAI-ARIA tree pattern. Carrel's binder, and any outline of folders, sections or series.
parts: [css, behaviour, react]
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

A hierarchy a person moves through and works in: a book's chapters and scenes, a manuscript's sections, a blog's series and their posts, a site's folders. Each row is one line: a chevron on a branch, an optional icon, the label, and a muted note at the end (a status, a word count). It is Carrel's binder, and a Capsomer component so every app gets the same keys and the same reading.

## When to use it

- A hierarchy of more than two levels, or one a person opens and closes as they work (a binder beside an editor).
- Moving items between levels or within one: a scene to another chapter, a post into a series.
- Choosing one row to open, or several to act on.

## When not to

- A flat list put in order: the sortable list.
- Two levels of navigation in a sidebar: the shell's menu, or disclosure groups.
- Rows that each carry their own buttons: a row list. A tree row holds no controls; actions go in a menu or toolbar beside it.
- A short set of nested choices in a form: checkboxes in fieldsets.

## The default and its reason

- **One tab stop, arrows inside** (roving tabindex), as the tree pattern asks: Tab enters on the chosen row or the first, and leaves the tree in one press.
- **The row is the link.** A row with an address is an `a[role=treeitem]`, so Enter, a middle click and "open in new tab" work as links do; a row that only groups is a `span`. The group is owned by its row (`aria-owns`), so a row's name is its own text, not its children's.
- **Works with no script, where it can.** Delivered, it is nested lists with every level shown and every link working, and no tree roles a reader would expect keys for. `enhance` adds the roles, closes the branches marked `data-collapsed`, and takes the keys.
- **Chosen is a tint and a 3 px accent edge**, as the listbox's current option, never the colour alone; in forced colours an outline. The page's own file (`aria-current="page"`) starts chosen.
- **Depth indents the row's content, not the row**, so the tint and the drop line run the full width. Six levels indent; deeper ones sit at the sixth.
- **Moving is optional and the host saves it.** With `data-movable` (React: `onMove`), Alt with an arrow moves a row, and a row drags with a mouse or pen. Every move is a cancelable `cap:tree-move` with where it came from and where it goes; nothing is stored. The host may refuse one (`preventDefault`, or React `canMove`), and offers Undo with `reverseMove`.
- **A drop's place is shown before it happens:** a line above or below a row, or a ring inside a branch; the middle half of a branch drops inside, the outer quarters before and after.
- **Moves are said in words** in a polite live region: "Moved Rain at Glen Rose to position 1 of 3 in 01 The riverbed."

## Keyboard

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
| Alt + Up arrow, Alt + Down arrow | Moves the row before or after its neighbour (`data-movable`) |
| Alt + Right arrow | Moves the row into the branch just above it, at the end |
| Alt + Left arrow | Moves the row out of its branch, to just after it |

## Accessibility

- `role="tree"` named by `aria-label` or `aria-labelledby`; each row `role="treeitem"` with `aria-level`, `aria-posinset` and `aria-setsize`; a branch `aria-expanded` and `aria-owns` naming its `role="group"`; the list items `role="none"`. `aria-selected` on every row that can be chosen; `aria-multiselectable` with `data-selection="multi"`; `aria-disabled="true"` on one that cannot.
- The chevron is decoration (`aria-hidden`); the state is `aria-expanded`. The note at the end is part of the row's name ("Low water, Revised, 2,140").
- A move, a refused move ("Low water is already first here.") and a cancelled drag are said in a `role="status"` region that exists before it changes.
- Dragging is never the only way: every drag has a keyboard move. A host whose people move rows by touch adds a one-pointer command (a "Move to" menu) that calls the same move, as WCAG 2.5.7 asks.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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

Hooks: `data-value` (the id every event names), `data-branch` (a branch with nothing in it yet), `data-collapsed` (closed once script runs), `data-selected` or `aria-current="page"` (chosen at the start), `aria-disabled="true"` on a row, `data-selection="none|single|multi"` and `data-movable` on the tree, `data-variant="surface"` (own border and surface), `.cap-tree-icon` before the label. Specimen hooks: `data-force="hover|focus"`, `data-dragging`, `data-drop="before|inside|after"`.

```js
import { enhance, treeFor, applyMove, reverseMove } from "capsomer/behaviour/tree";
enhance(); // every [data-cap="tree"]
el.addEventListener("cap:tree-select", (e) => e.detail); // { id, label, selected, values }
el.addEventListener("cap:tree-toggle", (e) => e.detail); // { id, expanded }
el.addEventListener("cap:tree-move", (e) => save(e.detail)); // { id, from, to }; preventDefault refuses it
treeFor(el).move(reverseMove(last)); // Undo
```

In React: `<Tree nodes aria-label selection selected onSelectedChange expanded defaultExpanded onExpandedChange onMove canMove variant />`, where a node is `{ id, label, href?, meta?, icon?, disabled?, children? }`. `onMove(move, next)` hands over the tree with the move made (`applyMove`); the caller keeps it or not. The pure functions (`visibleRows`, `treeKey`, `planMove`, `dropMove`, `applyMove`, `reverseMove`, `movedText`) are exported for a host that draws its own.

## Exceptions in production

None yet. A move by drag needs a mouse or a pen; on touch the host's own move command stands in.
