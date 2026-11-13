---
name: status
title: Status
summary: A status as a shape, a word and a color together, as a word or as a badge; the marks of states and kinds that have a shape of their own; and the badge's variants.
parts: [css, react]
tool: native
states: [critical, warning, notice, ok, running, no data, as a word, as a badge, default, secondary, outline, destructive, ghost, link, link or button badge, hover, disabled, count, comfortable, on a selected row, no data with its reason, no data in a table cell, state marks, a phrase that wraps, a glyph on its own, accent badge, series badge, tag badge]
added: 0.1.0
updated: 0.96.0
source: Capsomer mockup (design/mockup.html, the status symbols); the Capsid Portal's state chips
replaces:
  - 'class="(st|pill|badge|chip-state|state)[ "]'
  - "className=\"(st|pill|badge|state)[ \"]"
  - 'className=\{`(st|pill) \$\{'
  - 'BadgeTone\b'
  - 'rounded-full border[^"]*uppercase'
  - 'className="app-label"'
---

# Status

## Usage

```html
<span class="cap-status" data-tone="crit">
  <svg class="cap-status-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z"/></svg>Critical
</span>

<span class="cap-pill" data-tone="warn">[warning glyph]Needs you</span>

<span class="cap-status" data-tone="nodata">[no data glyph]No data</span>
<span class="cap-status-reason">The uptime checker has not reported since 09:00.</span>
```

```html
<span class="cap-pill" data-variant="secondary">Draft</span>
<a class="cap-pill" data-variant="outline" href="/mentions?state=waiting">Waiting 4</a>
<span class="cap-pill" data-variant="outline" data-tone="ok">[ok glyph]Healthy</span>
```

```html
<span class="cap-status" data-tone="warn" data-wrap>[blocked glyph]Held until a person approves the change</span>
<svg class="cap-status-glyph" data-tone="ok" viewBox="0 0 16 16" aria-hidden="true" focusable="false">...</svg> example.com<span class="cap-sr-only"> is up</span>
<span class="cap-pill" data-variant="accent" data-family="purple">Win-back</span>
<span class="cap-pill" data-variant="outline" data-series="2"><span class="cap-pill-dot" aria-hidden="true"></span>In review</span>
```

## Accessibility

| Key | Does |
| --- | --- |
| None | A status, and a badge that is not a link or a button, is text. It takes no focus and has no keys. |
| Tab | Reaches a link or button badge, in reading order |
| Enter | Follows a link badge or presses a button badge; Space presses a button badge |

- The word is the accessible text; the glyph is hidden. Do not shorten the word to fit ("Crit").
- Each tone's word reaches 4.5:1 on surface, raised, ground and sel, and on its own tint, in both themes (checked as painted).
- Forced colors: the tint is removed, so a badge gains an outline (a link or button badge, the link color).
- A count says what it counts: put the noun in a `.cap-sr-only` span after the number (`3<span class="cap-sr-only"> waiting</span>`).
- A link or button badge's name is its word.
