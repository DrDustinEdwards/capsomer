---
name: row-list
title: Row list
summary: Rows that each open a detail, the title stretched over the row as its one link, with j and k to move between rows.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [mixed worst first, critical row, hover, keyboard focus, row with actions, long title cut with an ellipsis, a row that opens in place, phone width with a wrapping title]
added: 0.1.0
source: Capsid Portal, dashboard/src/styles.css (.att-row, .qrow, .frow) and dashboard/src/views/shared.tsx (QueueRows, IncidentFeed)
replaces:
  - 'class="(att-row|qrow|frow)'
  - "className=\"(att-row|qrow|frow)"
  - "className=\\{[^}]*(att-row|qrow|frow)"
---

# Row list

A list of things that each open a detail: the attention list, the job queue, the incident feed, a draft list. Each row is a status, a title, a detail line and a time, and the whole row is one link.

## When to use it

For items a person scans and then opens one at a time, where each item has one place to go.

## When not to

Data compared across columns (versions, counts, several numbers per item) is a table (`.cap-table`). A list of settings is a form. A list with several equal actions per item and no detail to open is a plain list of controls. A worst-first problem list with groups and collapsed notices is the attention list, which is built on this one.

## The default and its reason

- **The title is the row's one link or button, stretched over the whole row with a `::after`.** The row is one tab stop with a real role: a link when the detail has its own address, a button when it opens in place. A clickable `div` with `tabindex` (the Portal's first version) has no role and no name a screen reader can trust (patterns.md, "Row that opens a detail").
- **`j` and `k` move keyboard focus itself, not a second selection.** Enter then follows the link, the row is scrolled the least distance that shows it, and a screen reader reads the row it lands on. They work when focus is in the list, or on the page's primary list (`data-cap-primary`, one per page) when focus is on nothing else; from nothing, `j` lands on the first row and `k` on the last (the Portal's rule). They never act in a text field, with a modifier, or when single-key shortcuts are off (`data-cap-single-keys="off"` on `<html>`, set by the shortcuts registry).
- **The focused row shows `--sel` with an inset 2 px ring in `--accent-line`**, which is 3:1 against `--sel` in both themes. The link draws no ring of its own, so there is one indicator, on the row.
- **Critical rows only get the red left edge**, always beside the status word and its glyph: shape, word and colour.
- **No rules between rows.** Hover and focus carry the structure (Portal: "Lists carry no rules between rows").
- **Row actions are real buttons, raised above the stretched link** (`z-index`), so they take their own clicks and their own tab stops.
- **The link is described by the row's status and detail** (`aria-describedby`), so moving by link still says "Critical" and why.
- **Columns line up from row to row**: the list is a grid and each row a subgrid of it.
- **On a narrow column the status moves above the title** (a container query on the list, below 30rem), and actions go underneath.
- **Long titles and details are cut with an ellipsis on one line**, and the full text stays in the link's name. **In a narrow column the title wraps instead**: on a phone there is no hover and no wider view to read the rest in (Portal: "titles wrap instead of being cut"). The detail line stays cut.
- **A row that opens in place** (a group of like rows) uses a `button` title with `aria-expanded` and `aria-controls`, and a `.cap-row-chevron` after the time, which turns when it is open. The attention list's group rows are these.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the next row's title, then into that row's actions, if any |
| `j` | Moves focus to the next row's title (from outside the primary list, to its first row) |
| `k` | Moves focus to the previous row's title (from outside the primary list, to its last row) |
| Enter | Follows the focused row's link, or presses its button |
| Enter or Space on a group row's button | Shows or hides the rows it holds |

## Accessibility

- A `ul` with `role="list"`: Safari drops list semantics from a list with `list-style: none` otherwise.
- The list is named by the heading above it (`aria-labelledby`).
- One focus indicator, on the row, as an outline, so it survives forced colours; the critical edge turns CanvasText there.
- The stretched hit area makes the whole row at least `--target` high.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<ul class="cap-rows" data-cap="row-list" role="list" aria-labelledby="attention-h" data-cap-primary>
  <li class="cap-row" data-tone="crit">
    <span class="cap-row-status" id="r1-s"><span class="cap-status" data-tone="crit">[glyph] Critical</span></span>
    <div class="cap-row-title"><a href="/sites/foxhound" aria-describedby="r1-s r1-d">foxhound.app is not answering</a></div>
    <p class="cap-row-detail" id="r1-d">3 failed checks in a row, first at 14:02</p>
    <span class="cap-row-meta"><time class="cap-time" datetime="2026-09-30T14:02Z">11 minutes ago</time></span>
    <div class="cap-row-actions"><button type="button" class="cap-btn">Retry</button></div>
  </li>
</ul>
```

The title may be a `button` instead of an `a` when the detail opens in place (a side panel). `import { enhance, moveRowFocus } from "capsomer/behaviour/row-list"` wires `j` and `k`. In React, `import { RowList, Row } from "capsomer/react/row-list"`: `<RowList labelledBy="attention-h" primary><Row title="..." href="..." status={...} detail="..." meta={...} tone="crit" /></RowList>`; pass `renderLink` to use a router's link.

A group row, whose button opens the rows it holds:

```html
<li class="cap-row">
  <span class="cap-row-status" id="g-s"><span class="cap-status" data-tone="warn">[glyph] Warning</span></span>
  <div class="cap-row-title"><button type="button" aria-expanded="false" aria-controls="g-rows" aria-describedby="g-s g-d">3 pull requests await the seat</button></div>
  <p class="cap-row-detail" id="g-d">capsid, carrel, foxhound</p>
  <span class="cap-row-meta"><time datetime="...">26 minutes ago</time><span class="cap-row-chevron" aria-hidden="true"></span></span>
</li>
```

In React, `<Row expanded={open} controls={id} onOpen={...} />` renders it.

**Provenance.** MIXED, against capsid `master` as of 2026-10-01 (`dashboard/src/styles.css` `.att-row`, `.qrow`, `.frow`, `.rowlink`, `.chev`; `dashboard/src/app/App.tsx` `step`). EXTRACTED: the row's values (6 px by 16 px padding, `--raised` hover, `--sel` with a 1 px `--accent-line` ring on the focused row, the 3 px red edge on critical rows only, 12 px muted detail and time, bold title, one-line ellipsis, the stretched `::after`, the chevron's geometry) and, new in v0.1.1, the title that wraps on a phone and the focus-without-browser-scroll then `scrollIntoView({ block: "nearest" })` step with `k` starting at the last row. REWROTE: the markup (a real link or button in a list, not a focusable `div`), the subgrid columns, the container query, the ring as an outline (it survives forced colours; the Portal draws it with `box-shadow`), the red edge as a pseudo-element for the same reason, and the whole of `row-list.ts` (per-list, framework-free, guarded in fields and by the single-key switch; the Portal's `step` is one function in `App.tsx` over every `[data-row]` in `main`). Where the Portal differs and the audit wins: a row is one tab stop with a real role (patterns.md, "Row that opens a detail"), and the phone keeps the status word (the Portal hides the word and keeps the glyph at 820 px; DEFAULTS.md: shape, word and colour together).

## Exceptions in production

None yet.
