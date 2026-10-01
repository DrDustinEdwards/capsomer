---
name: status
title: Status
summary: A status as a shape, a word and a colour together, as a word or as a pill.
parts: [css, react]
tool: native
states: [critical, warning, notice, ok, running, no data, as a word, as a pill, on a selected row, no data with its reason, no data in a table cell]
added: 0.1.0
source: Capsomer mockup (design/mockup.html, the status symbols); the Capsid Portal's state chips
replaces:
  - 'class="(st|pill|badge|chip-state|state)[ "]'
  - "className=\"(st|pill|badge|state)[ \"]"
---

# Status

How a thing is: critical, warning, notice, ok, running, or no data. Always a glyph whose shape carries the meaning, a word that says it, and the tone's colour on top.

## When to use it

- `.cap-status`, the word: in a row, a table cell, a heading line, a timeline.
- `.cap-pill`, the word on its tone's tint: where the status must stand out from the text around it, such as a session's state or a row's first column.

## When not to

- A count of things in a menu entry is the shell's `.cap-shell-count`.
- An error with something to do about it is an alert (`.cap-alert`) or a banner (`.cap-banner`).
- A category that is not a state (a mention's kind: Reply, Link, Like) is a plain tag, not a status: give it no glyph.

## The default and its reason

- **Shape, word and colour together; never colour alone** (WCAG 1.4.1). Octagon critical, triangle warning, square notice, filled circle with a tick ok, dashed circle no data, an arc running. Glyphs are `aria-hidden`: the word is the accessible text.
- **Four levels: critical, warning, notice, ok** (patterns.md). Running uses the notice tone with the arc glyph; it is a state, not a level.
- **No data is a state with a reason, never a zero.** Put the reason after the word, as `.cap-status-reason`.
- **In a table cell, no data says two words** (`.cap-status` with the reason in a `.cap-sr-only` span after a colon, and the same text in `title` for the pointer): a sentence does not fit a 34 px row, and the full reason is in the row's detail (Portal design D18). The word and the glyph are still there, so the cell is never a blank or a zero.
- **A pill keeps its own tint on a selected row**, so its word keeps its contrast on `--sel`.
- **The no data pill's word is `--muted`, not `--nodata`**: on its own tint the lighter grey would fall under 4.5:1.
- Marks inside a filled glyph are cut out (evenodd) rather than painted in `--surface`, so the glyph reads on a tint.

## Keyboard

| Key | Does |
| --- | --- |
| None | A status is text. It takes no focus and has no keys. |

## Accessibility

- The word is the accessible text; the glyph is hidden. Do not shorten the word to fit ("Crit").
- Each tone's word reaches 4.5:1 on surface, raised, ground and sel, and on its own tint, in both themes (checked as painted).
- Forced colours: the tint is removed, so a pill gains an outline.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<span class="cap-status" data-tone="crit">
  <svg class="cap-status-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z"/></svg>Critical
</span>

<span class="cap-pill" data-tone="warn">[warning glyph]Needs you</span>

<span class="cap-status" data-tone="nodata">[no data glyph]No data</span>
<span class="cap-status-reason">The uptime checker has not reported since 09:00.</span>
```

The six glyphs, each `viewBox="0 0 16 16"`, `aria-hidden="true"`:

| Glyph | Drawing |
| --- | --- |
| Critical | `<path fill="currentColor" fill-rule="evenodd" d="M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z"/>` |
| Warning | `<path fill="currentColor" fill-rule="evenodd" d="M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z"/>` |
| Notice | `<rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="currentColor" d="M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z"/>` |
| Ok | `<path fill="currentColor" fill-rule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z"/>` |
| No data | `<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.6 2.2"/>` |
| Running | `<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6" opacity="0.35"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8 1.8a6.2 6.2 0 0 1 6.2 6.2"/>` |

In a table cell: `<span class="cap-status" data-tone="nodata" title="No Cloudflare token for this site">[no data glyph]No data<span class="cap-sr-only">: no Cloudflare token for this site</span></span>`.

In React, `import { Status, Pill, Glyph } from "capsomer/react/status"`: `<Status tone="nodata" reason="The uptime checker has not reported since 09:00.">No data</Status>`, `<Status tone="nodata" reason="No Cloudflare token for this site" brief>No data</Status>` for a table cell, `<Pill tone="info" running>Working</Pill>`.

**Provenance.** MIXED, against capsid `master` as of 2026-10-01 (`dashboard/src/styles.css` `.st`, `.pill`, `.nodata-cell`; `dashboard/src/ui/icons.tsx` `St`, `Pill`, `NoData`, `SHAPES`). EXTRACTED: the word's and the pill's rules (inline flex, 6 px gap, 12 px, weight 600, no wrap; the pill's 2 by 8 by 2 by 6 px padding, full radius and tone tints) and their tone colours (`ok`, `warn`, `crit`, `nodata`, `run` as `info`). REWROTE: the glyphs. The Portal's `SHAPES` are 14 px drawings with marks painted in `--surface` (a cross in the octagon, a bar in the pill) and opacity tints; Capsomer's six are the mockup's, 16 px, one `currentColor` path with the marks cut out (evenodd), so they read on any tint; the Portal has no notice shape (its "notice" is the no-data circle), where Capsomer has four levels (patterns.md) and a square for notice. The no-data pill's word is `--muted` on its tint in both (EXTRACTED). Brought up to date in v0.1.1: the brief no-data cell (`NoData brief`, "No data" with the reason for a screen reader and on hover, D18). The Portal's `queued`, `blocked` and `done` kinds are not statuses here: they are words a row chooses (patterns.md: four levels, running is a state). Where the Portal and the audit differ, the audit wins: the Portal's hover tooltip (`data-tip`) is a `title` here, since the status takes no focus and Capsomer's tooltip needs a trigger that does.

## Exceptions in production

None yet.
