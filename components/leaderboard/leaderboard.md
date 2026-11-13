---
name: leaderboard
title: Leaderboard
summary: Ranked names and scores, highest first, with the reader's own entry marked.
group: pattern
parts: [css, react]
tool: native
states: [ten entries, the reader's own entry, a long name, empty]
added: 0.132.0
source: germomics' game leaderboard (app/routes/games.$slug.tsx, app/lib/scores.server.ts)
replaces:
  - 'Leaderboard'
---

# Leaderboard

## Usage

```html
<ol class="cap-leaderboard" aria-label="Leaderboard">
  <li class="cap-leaderboard-row"><span class="cap-leaderboard-name">Alex</span><span class="cap-leaderboard-score">1,204</span></li>
  <li class="cap-leaderboard-row" aria-current="true">...</li>
</ol>
<p class="cap-leaderboard-empty">No scores yet.</p>   <!-- no entries -->
```

## Accessibility

Nothing to operate.

- The reader's entry is marked by `aria-current`, a tint and bold, not color alone; a forced-colors outline.
