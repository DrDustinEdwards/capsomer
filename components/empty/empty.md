---
name: empty
title: Empty and loading
summary: Which kind of empty an area is, and what loading looks like for how long it takes.
parts: [css, react]
tool: native
states: [nothing yet, no match, all clear, could not load, skeleton, spinner, spinner in a button, long wait]
added: 0.1.0
source: Capsomer mockup (design/mockup.html, "Empty, loading and error")
replaces:
  - 'class="(empty|empty-state|skel|skeleton|spinner|loader)[ "]'
  - "className=\"(empty|empty-state|skel|skeleton|spinner|loader)[ \"]"
---

# Empty and loading

What an area shows when it has nothing to show, and while it waits.

## When to use it

- `.cap-empty` with `data-kind`:
  - `nothing-yet`: nothing has been added. Say how to add the first, with one action.
  - `no-match`: a filter hides everything. Name the filter and offer Clear.
  - `all-clear`: nothing needs attention. An ok status line, plain, no action.
  - `failed`: the read failed and there is no earlier data to keep. The error in plain words and Try again; `role="alert"`.
- `.cap-skeleton`: grey rows standing in for a page's content while it loads, 1 to 10 seconds.
- `.cap-spinner`: a small turning arc for one panel, or inside a button that is working.
- `.cap-empty-wait`: over 10 seconds, the spinner and a line saying how long it usually takes.

## When not to

- Under 1 second, show nothing: a flash of a spinner is worse than a pause.
- A refresh that fails while there is earlier data is a banner over that data (`.cap-banner`), not `failed`.
- A button's own pending state is the button's `aria-busy="true"` (`.cap-btn-spinner`), which may use this arc.

## The default and its reason

- **Say which kind of empty it is** (patterns.md "Empty"). "No results" alone leaves the person guessing whether to add, clear or wait.
- **Loading follows the clock** (patterns.md "Loading"): nothing under 1 s; a spinner for one panel or a skeleton for a page from 1 to 10 s; over 10 s say how long; keep the last good data while reloading.
- **Rotation is the one permitted loop.** The skeleton pulses and the arc turns only under `prefers-reduced-motion: no-preference`. Under reduced motion the arc is hidden and the word ("Loading") shows on its own.
- **A skeleton is `aria-busy="true"` and says "Loading" in hidden text**; its grey rows are `aria-hidden`.
- **The spinner's word is visible by default.** `data-label="hidden"` keeps it for screen readers only, for an icon button with no room; it still shows under reduced motion.
- The long wait is a part of this component (`.cap-empty-wait`), not a fifth kind of empty: it is loading, not empty.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the kind's one action (Add, Clear filter, Try again); all clear has none |

## Accessibility

- The title is `--text`, the line under it `--muted`, the failed title `--crit`: 4.5:1 in both themes.
- `failed` is `role="alert"`; add it when the read fails so it is announced.
- Forced colours: skeleton rows are painted in GrayText so they do not vanish.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-empty" data-kind="no-match">
  <p class="cap-empty-title">No jobs match “Blocked”</p>
  <p class="cap-empty-text">14 jobs are hidden by this filter.</p>
  <button type="button" class="cap-btn">Clear filter</button>
</div>

<div class="cap-empty" data-kind="all-clear">
  <p class="cap-empty-title"><span class="cap-status" data-tone="ok">[ok glyph]All clear</span></p>
  <p class="cap-empty-text">No mentions are waiting.</p>
</div>

<div class="cap-empty" data-kind="failed" role="alert">
  <p class="cap-empty-title">[critical glyph]Could not load the queue</p>
  <p class="cap-empty-text">The server answered with an error (502). Nothing changed on your side.</p>
  <button type="button" class="cap-btn">Try again</button>
</div>

<div class="cap-skeleton" aria-busy="true">
  <span class="cap-sr-only">Loading</span>
  <span class="cap-skeleton-line" aria-hidden="true"></span>
  <span class="cap-skeleton-line" aria-hidden="true"></span>
  <span class="cap-skeleton-line" aria-hidden="true"></span>
</div>

<span class="cap-spinner">
  <svg class="cap-spinner-arc" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" opacity="0.25"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M8 2a6 6 0 0 1 6 6"/></svg>
  <span class="cap-spinner-label">Loading</span>
</span>

<div class="cap-empty-wait" aria-busy="true">
  [spinner, labelled "Building the site"]
  <p class="cap-empty-text">This usually takes about 30 seconds.</p>
</div>
```

In React, `import { Empty, Skeleton, Spinner, Wait } from "capsomer/react/empty"`.

## Exceptions in production

None yet.
