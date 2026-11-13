---
name: row-list
title: Row list
summary: Rows that each open a detail, the title stretched over the row as its one link, with j and k to move between rows.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [mixed worst first, outline and muted variants, sizes, media, comfortable density, critical row, hover, keyboard focus, row with actions, long title cut with an ellipsis, a row that opens in place, phone width with a wrapping title, a row that is read, not opened, a reply opened in a row]
added: 0.1.0
updated: 0.100.0
source: Capsid Portal, dashboard/src/styles.css (.att-row, .qrow, .frow) and dashboard/src/views/shared.tsx (QueueRows, IncidentFeed)
replaces:
  - 'class="(att-row|qrow|frow)'
  - "className=\"(att-row|qrow|frow)"
  - "className=\\{[^}]*(att-row|qrow|frow)"
---

# Row list

## Usage

```html
<ul class="cap-rows" data-cap="row-list" role="list" aria-labelledby="attention-h" data-cap-primary>
  <li class="cap-row" data-tone="crit">
    <span class="cap-row-status" id="r1-s"><span class="cap-status" data-tone="crit">[glyph] Critical</span></span>
    <div class="cap-row-title"><a href="/sites/example-org" aria-describedby="r1-s r1-d">example.org is not answering</a></div>
    <p class="cap-row-detail" id="r1-d">3 failed checks in a row, first at 14:02</p>
    <span class="cap-row-meta"><time class="cap-time" datetime="2026-09-30T14:02Z">11 minutes ago</time></span>
    <div class="cap-row-actions"><button type="button" class="cap-btn">Retry</button></div>
  </li>
</ul>
```

```html
<li class="cap-row">
  <span class="cap-row-status" id="g-s"><span class="cap-status" data-tone="warn">[glyph] Warning</span></span>
  <div class="cap-row-title"><button type="button" aria-expanded="false" aria-controls="g-rows" aria-describedby="g-s g-d">3 pull requests await the seat</button></div>
  <p class="cap-row-detail" id="g-d">web, docs, billing</p>
  <span class="cap-row-meta"><time datetime="...">26 minutes ago</time><span class="cap-row-chevron" aria-hidden="true"></span></span>
</li>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to the next row's title, then into that row's actions, if any |
| `j` | Moves focus to the next row's title (from outside the primary list, to its first row) |
| `k` | Moves focus to the previous row's title (from outside the primary list, to its last row) |
| Enter | Follows the focused row's link, or presses its button |
| Enter or Space on a group row's button | Shows or hides the rows it holds |

- **A reply opens in its row** (`reply`, with `RowReply`): answering a question or saying what unblocked a job happens where the row is, not on another page. The box is labeled for what the words are for ("Your answer, sent to its driver"), takes focus when it opens, says why an empty or refused reply was not sent (announced), sends on Ctrl or Cmd+Enter (not during an IME composition) and cancels on Esc. It sits under the row's text, across the row and above the stretched link.

- A `ul` with `role="list"`: Safari drops list semantics from a list with `list-style: none` otherwise.
- The list is named by the heading above it (`aria-labelledby`).
- One focus indicator, on the row, as an outline, so it survives forced colors; the critical edge turns CanvasText there.
- The stretched hit area makes the whole row at least `--target` high.
