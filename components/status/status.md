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

How a thing is: critical, warning, notice, ok, running, or no data. Always a glyph whose shape carries the meaning, a word that says it, and the tone's color on top.

## When to use it

- `.cap-status`, the word: in a row, a table cell, a heading line, a timeline.
- `.cap-pill` (also written `.cap-badge`), the badge: the word on its tone's tint, where the status must stand out from the text around it, such as a session's state or a row's first column.
- `.cap-pill` with a `data-variant`, for a label that is not a status: a count, a filter chip that links, a tag. The variants are shadcn's Badge: `default` (solid primary), `secondary`, `outline`, `destructive`, `ghost`, `link`; and Capsomer's `accent`, the family's accent tint with no glyph, for a category (a kind of attribution, a plan).
- A mark of its own (`glyph`): a state or a kind of item whose shape says more than its tone's (a queued job, one that is unknown, one that is blocked; a question, a pull request, a report, a proposal, a site that is down). The tone still sets the color.
- A label a person colored (a status list's labels): an outline badge with a series dot (`data-series="1"` to `"8"`).

## When not to

- A count of things in a menu entry is the shell's `.cap-shell-count`.
- An error with something to do about it is an alert (`.cap-alert`) or a banner (`.cap-banner`).
- A category that is not a state (a mention's kind: Reply, Link, Like) is a badge with a variant and no tone and no glyph, not a status.
- A control that changes something is a button (`.cap-btn`); a badge that is a link goes somewhere, a badge button filters or toggles a view, nothing more.

## The default and its reason

- **Shape, word and color together; never color alone** (WCAG 1.4.1). Octagon critical, triangle warning, square notice, filled circle with a tick ok, an empty circle with a bar no data, an arc running. Glyphs are `aria-hidden`: the word is the accessible text.
- **Four levels: critical, warning, notice, ok** (patterns.md). Running uses the notice tone with the arc glyph; it is a state, not a level. `muted` is the quiet gray for a state that is neither good nor bad (queued, could not be measured); it draws the no data circle unless the state has a mark of its own.
- **A state or kind may have a shape of its own.** Beyond the six glyphs, `queued` (a ring), `unknown` (a ring with a question mark: could not be measured, so never read as a pass or a failure), `blocked` (a rounded square with a pause), and the kinds an inbox shows: `question`, `pr`, `report`, `proposal`, `site-down`. A mark is chosen by `glyph`, the color by `data-tone` (the Portal: warning for a person who must act, critical for a machine fault). A glyph is never the only carrier: the word is beside it.
- **A glyph may stand alone** beside a name, with the state said in words that are visually hidden (`<svg class="cap-status-glyph" data-tone="ok">` and `<span class="cap-sr-only"> is up</span>`), where the row's column says it already (the Portal's status column).
- **A phrase wraps** with `data-wrap` on the word (a hold reason): it takes the width it has and wraps, the glyph staying at the first line.
- **No data is a state with a reason, never a zero.** Put the reason after the word, as `.cap-status-reason`.
- **In a table cell, no data says two words** (`.cap-status` with the reason in a `.cap-sr-only` span after a colon, and the same text in `title` for the pointer): a sentence does not fit a 34 px row, and the full reason is in the row's detail (Portal design D18). The word and the glyph are still there, so the cell is never a blank or a zero.
- **A tone always draws its glyph.** A badge with `data-tone` and a glyph is a status; a badge with only a `data-variant` is a label, and has no glyph. So a variant never turns into color alone.
- **Unless the site's badges are words alone.** `glyph={false}` leaves the glyph out of a toned badge, for a site whose badges have always been words on their tint (Foxhound): the word must then say the state on its own ("Retries automatically", "Failed"), so the color still never carries it alone (WCAG 1.4.1).
- **A tag** (`data-variant="tag"`) is a badge set in the site's tag face: the tone's tint with an edge in the word's own color, or a quiet hairline label with no tone, or a family's accent with `data-family`. `--tag-face`, `--tag-size`, `--tag-weight`, `--tag-case`, `--tag-tracking` and `--tag-edge` (how much of the word's color the edge takes) set it; each defaults to the badge's look.
- **Tone and variant together.** `outline` and `ghost` keep the tone's color for the word and drop the tint; `default`, `secondary`, `destructive` and `link` use their own fill. `destructive` is the critical tone's tint, with the critical glyph.
- **A link or button badge** gets a focus ring (`--ring`, 3 px), a hover color change, a dashed edge when disabled, and a hit area grown to `--target` by a pseudo-element, so the badge keeps its 20 px look.
- **Size follows density**: 20 px high and 12 px text at the compact default, 22.5 px and 13 px with `data-density="comfortable"`.
- **A series dot repeats a color the person chose; the word carries the meaning.** `data-series="1"` to `"8"` on a badge, with an `aria-hidden` `.cap-pill-dot` before the word, draws the dot in `--series-1` to `--series-8` (in forced colors, the text color). Use it with `outline`, the quiet edge. Carrel's status labels.
- **The accent variant takes its hue from the family in scope.** `data-family="purple"` (any of Capsomer's families) on the badge gives it that family's accent for a site's second hue, kept in tokens (Foxhound's win-back purple) and not in the component.
- **A pill keeps its own tint on a selected row**, so its word keeps its contrast on `--sel`.
- **The no data pill's word is `--muted`, not `--nodata`**: on its own tint the lighter gray would fall under 4.5:1.
- Marks inside a filled glyph are cut out (evenodd) rather than painted in `--surface`, so the glyph reads on a tint.

## Keyboard

| Key | Does |
| --- | --- |
| None | A status, and a badge that is not a link or a button, is text. It takes no focus and has no keys. |
| Tab | Reaches a link or button badge, in reading order |
| Enter | Follows a link badge or presses a button badge; Space presses a button badge |

## Accessibility

- The word is the accessible text; the glyph is hidden. Do not shorten the word to fit ("Crit").
- Each tone's word reaches 4.5:1 on surface, raised, ground and sel, and on its own tint, in both themes (checked as painted).
- Forced colors: the tint is removed, so a badge gains an outline (a link or button badge, the link color).
- A count says what it counts: put the noun in a `.cap-sr-only` span after the number (`3<span class="cap-sr-only"> waiting</span>`).
- A link or button badge's name is its word.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

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
| No data | `<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 8h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>` |
| Running | `<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6" opacity="0.35"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8 1.8a6.2 6.2 0 0 1 6.2 6.2"/>` |

The marks of states and kinds, same box and rules (`glyph` in React): queued `<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/>`; unknown the same ring with a question mark (`<path d="M6.1 6.4a1.95 1.95 0 1 1 2.9 1.7c-.6.3-1 .7-1 1.4" .../><circle cx="8" cy="11.7" r=".9"/>`), `question` the same on a tinted ring; blocked a rounded square with a pause cut out; `pr`, `report` (a flag), `proposal` (a page) drawn as strokes; `site-down` a filled circle with a down arrow cut out. The specimen page has every drawing.

In a table cell: `<span class="cap-status" data-tone="nodata" title="No Cloudflare token for this site">[no data glyph]No data<span class="cap-sr-only">: no Cloudflare token for this site</span></span>`.

A badge with a variant:

```html
<span class="cap-pill" data-variant="secondary">Draft</span>
<a class="cap-pill" data-variant="outline" href="/mentions?state=waiting">Waiting 4</a>
<span class="cap-pill" data-variant="outline" data-tone="ok">[ok glyph]Healthy</span>
```

A phrase that wraps, a glyph on its own, an accent badge and a series badge:

```html
<span class="cap-status" data-tone="warn" data-wrap>[blocked glyph]Held until a person approves the change</span>
<svg class="cap-status-glyph" data-tone="ok" viewBox="0 0 16 16" aria-hidden="true" focusable="false">...</svg> example.com<span class="cap-sr-only"> is up</span>
<span class="cap-pill" data-variant="accent" data-family="purple">Win-back</span>
<span class="cap-pill" data-variant="outline" data-series="2"><span class="cap-pill-dot" aria-hidden="true"></span>In review</span>
```

In React, `import { Status, Pill, Glyph } from "capsomer/react/status"`: `<Status tone="nodata" reason="The uptime checker has not reported since 09:00.">No data</Status>`, `<Status tone="nodata" reason="No Cloudflare token for this site" brief>No data</Status>` for a table cell, `<Pill tone="info" running>Working</Pill>`, `<Pill variant="secondary">Draft</Pill>`, `<Pill variant="outline" href="/mentions">Mentions</Pill>`, `<Status tone="warn" glyph="blocked" wrap>Held until a person approves</Status>`, `<Glyph name="ok" tone="ok" />`, `<Pill variant="accent" family="purple">Win-back</Pill>`, `<Pill variant="outline" series={2}>In review</Pill>`, `<Pill variant="tag" tone="ok" glyph={false}>Retries automatically</Pill>`. The Portal's `done` is the `ok` tone, `run` is `info` with `running`, `queued` is `muted` with `glyph="queued"`, `blocked` is `warn` with `glyph="blocked"`.

Without React (a static page, a server-rendered table, a drawing), `import { statusHtml, glyphParts, outcomeStatus } from "capsomer/behavior/status"`: `statusHtml("nodata", "No data", { reason, brief: true })` writes the same markup, with the label and reason escaped. `glyphParts(name)` is a glyph's inner elements for a page that draws it inside its own `<svg>` (a box in a graph). The shapes are one table, `STATUS_GLYPH`, which React's `Glyph` draws too.

**A run's conclusion is one status everywhere** (`outcomeStatus(conclusion, labels?)`), from GitHub's check-run conclusions and Cloudflare's build outcomes: `success` and `neutral` are ok, `skipped` is no data (it did not run), `cancelled`, `timed_out`, `stale` and `action_required` are a warning (it stopped before an answer), no conclusion yet is running, and every other conclusion failed (critical). A page words a state its own way with `labels` (`{ success: "Built" }`); the tone does not change. <!-- codespell:ignore -->

**The shadcn component it matches:** Badge (`badge.tsx`, nova style): 20 px pill, 12 px text, `default`, `secondary`, `outline`, `destructive`, `ghost`, `link`, link badges with hover, focus ring.

**Deliberately different.** Status badges (tone and glyph) are not in shadcn: Capsomer's rule is shape, word and color together. `destructive` is the critical tint rather than shadcn's 10 percent red, so its word keeps 4.5:1 in both themes. A link or button badge gets a 24 px hit area (WCAG 2.5.8), which shadcn's 20 px badge does not. The edge of an outline badge is `--line-strong` (3:1) rather than shadcn's soft border, because a badge that is a link or a button is a control. The glyph is the status shape, not an icon slot, and sits 1 em tall instead of 12 px so it follows density.

**Provenance.** MIXED, against capsid `master` as of 2026-10-01 (`dashboard/src/styles.css` `.st`, `.pill`, `.nodata-cell`; `dashboard/src/ui/icons.tsx` `St`, `Pill`, `NoData`, `SHAPES`). EXTRACTED: the word's and the pill's rules (inline flex, 6 px gap, 12 px, weight 600, no wrap; the pill's 2 by 8 by 2 by 6 px padding, full radius and tone tints) and their tone colors (`ok`, `warn`, `crit`, `nodata`, `run` as `info`). REWROTE: the glyphs. The Portal's `SHAPES` are 14 px drawings with marks painted in `--surface` (a cross in the octagon, a bar in the pill) and opacity tints; Capsomer's six are the mockup's, 16 px, one `currentColor` path with the marks cut out (evenodd), so they read on any tint; the Portal has no notice shape (its "notice" is the no-data circle), where Capsomer has four levels (patterns.md) and a square for notice. The no-data pill's word is `--muted` on its tint in both (EXTRACTED). Brought up to date in v0.1.1: the brief no-data cell (`NoData brief`, "No data" with the reason for a screen reader and on hover, D18). The Portal's `queued`, `blocked` and `done` kinds are not statuses here: they are words a row chooses (patterns.md: four levels, running is a state). Where the Portal and the audit differ, the audit wins: the Portal's hover tooltip (`data-tip`) is a `title` here, since the status takes no focus and Capsomer's tooltip needs a trigger that does.

## Exceptions in production

None yet.
