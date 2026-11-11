---
name: count-up
title: Count-up
summary: A figure that counts from zero to its value when it arrives; the server renders the final figure.
parts: [css, behavior, react]
tool: own JavaScript
states: [counting, final, reduced motion]
added: 0.91.0
source: Foxhound's RecoverableEstimate (app/components/audit/sections.tsx, Recova's RecoverableCountUp)
replaces:
  - 'RecoverableCountUp'
  - 'Math.pow\(1 - t, 3\)'
---

# Count-up

A headline figure (an estimate, a total) that counts up from zero over 600ms with a cubic ease out when it first appears. Only the text changes.

## When to use it

One figure a page leads with, once, when it is the answer the reader came for: an audit's recoverable estimate.

## When not to

- **Several figures at once**, or a table: they all move and none can be read.
- **A figure that updates live**: show the new value; motion on every change is noise.
- **Anything the reader must read while it moves.**

## The default and its reason

- **The server renders the final figure**, so a page with no script, a reader who arrives late and a search engine all read the right number.
- **600ms, ease out cubic** (Recova's): long enough to read as counting, short enough that the figure is still before the eye settles on it.
- **Reduced motion shows the figure still** (`prefers-reduced-motion: reduce`).
- **Tabular figures**, so the width holds while the digits change.
- **Keyed on the figure**, so a re-render that keeps the figure does not restart the count.

## Keyboard

None.

## Accessibility

- Only text changes, and only for 600ms; a screen reader reaching it reads the final figure (no live region, so the counting is not announced).
- Reduced motion is honored.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

```html
<span class="cap-count-up" data-cap="count-up" data-value="12480" data-currency="USD">$12,480</span>
```

React: `useCountUp(key, run, duration)` from `capsomer/react/count-up` gives the progress (0 to 1) to multiply a figure by; the app formats it. A page with no React calls `enhance()` from `capsomer/behavior/count-up`, which counts each figure once it is in view. Load `count-up.css`.

## Exceptions in production

None yet.
