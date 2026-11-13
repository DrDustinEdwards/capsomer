---
name: leaderboard
title: Leaderboard
summary: Ranked names and scores, highest first, with the reader's own entry marked.
parts: [css, react]
tool: native
states: [ten entries, the reader's own entry, a long name, empty]
added: 0.123.0
source: germomics' game leaderboard (app/routes/games.$slug.tsx, app/lib/scores.server.ts)
replaces:
  - 'Leaderboard'
---

# Leaderboard

An ordered list of names and scores, highest first. The rank is the list's own order, drawn by CSS; the reader's own entry is `aria-current="true"` and tinted.

## When to use it

A game's or a challenge's top scores.

## When not to

- **Data to compare or sort**: a [table](../table/table.md).
- **A chart of the same numbers**: the [chart frame](../chart-frame/chart-frame.md).

## The default and its reason

- **An `ol`**, so a screen reader hears each entry's place; the drawn rank is the counter.
- **Scores in tabular figures**, right-aligned, so they line up.
- **A long name is cut with an ellipsis** and never pushes the score off the row.
- **The ranking and the name rules are the server's** (germomics' `sanitizeName` and score clamp); the component only shows what it is given.

## HTML contract

```html
<ol class="cap-leaderboard" aria-label="Leaderboard">
  <li class="cap-leaderboard-row"><span class="cap-leaderboard-name">Alex</span><span class="cap-leaderboard-score">1,204</span></li>
  <li class="cap-leaderboard-row" aria-current="true">...</li>
</ol>
<p class="cap-leaderboard-empty">No scores yet.</p>   <!-- no entries -->
```

React: `Leaderboard` from `capsomer/react/leaderboard` takes `entries`, `label`, `empty` and `format`.

## Keyboard

Nothing to operate.

## Accessibility

- The reader's entry is marked by `aria-current`, a tint and bold, not color alone; a forced-colors outline.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
