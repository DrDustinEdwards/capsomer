---
name: empty
title: Empty
summary: Which kind of empty an area is, and what a long wait says. The skeleton and the spinner live in their own component.
parts: [css, react]
tool: native
states: [nothing yet, no match, all clear, could not load, with an icon, flush, long wait, comfortable]
added: 0.1.0
updated: 0.2.0
source: Capsomer mockup (design/mockup.html, "Empty, loading and error")
replaces:
  - 'class="(empty|empty-state)[ "]'
  - "className=\"(empty|empty-state)[ \"]"
---

# Empty

What an area shows when it has nothing to show. Loading is the [Skeleton and spinner](../skeleton/skeleton.md).

## When to use it

- `.cap-empty` with `data-kind`:
  - `nothing-yet`: nothing has been added. Say how to add the first, with one action.
  - `no-match`: a filter hides everything. Name the filter and offer Clear.
  - `all-clear`: nothing needs attention. An ok status line, plain, no action.
  - `failed`: the read failed and there is no earlier data to keep. The error in plain words and Try again; `role="alert"`.
- `.cap-empty-wait`: over 10 seconds of loading, the spinner and a line saying how long it usually takes.

## When not to

- While loading, under 10 seconds: a skeleton or a spinner (`.cap-skeleton`, `.cap-spinner`), not an empty area.
- A refresh that fails while there is earlier data is a banner over that data (`.cap-banner`), not `failed`.
- A button's own pending state is the button's `aria-busy="true"` (`.cap-btn-spinner`).

## The default and its reason

- **Say which kind of empty it is** (patterns.md "Empty"). "No results" alone leaves the person guessing whether to add, clear or wait.
- **Centred, with a dashed edge**, as shadcn's Empty: an empty area is a place to put something, and the dashed edge says "drop it here" without a fill. `data-flush` removes the edge for an empty area inside a panel or a table that already has one.
- **Parts**: an optional icon tile (`.cap-empty-media[data-variant="icon"]`, `aria-hidden`, a muted tile), the header (`.cap-empty-header`: `.cap-empty-title` and `.cap-empty-text`), and the action (`.cap-empty-content`, for one or several). The 0.1 markup, with title, text and action as direct children, still works.
- **The failed kind says it in shape, word and colour**: the critical glyph, the words, the critical edge and title.
- **The long wait is a part of this component** (`.cap-empty-wait`), not a fifth kind of empty: it is loading, not empty. It uses the spinner, so load `skeleton.css` with this file.
- Size follows density: the padding is `--pad-card`, the gaps `--gap`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the kind's action (Add, Clear filter, Try again); all clear has none |

## Accessibility

- The title is `--text`, the line under it `--muted`, the failed title `--crit`: 4.5:1 in both themes.
- `failed` is `role="alert"`; add it when the read fails so it is announced.
- The icon tile is decorative (`aria-hidden`); the title carries the meaning.
- Forced colours: the dashed edge and the icon tile take the system text colour.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-empty" data-kind="nothing-yet">
  <div class="cap-empty-media" data-variant="icon" aria-hidden="true"><svg>...</svg></div>
  <div class="cap-empty-header">
    <p class="cap-empty-title">No sites are watched yet</p>
    <p class="cap-empty-text">Add the first one and its checks start on the next pass.</p>
  </div>
  <div class="cap-empty-content"><button type="button" class="cap-btn" data-variant="primary">Add a site</button></div>
</div>

<div class="cap-empty" data-kind="no-match" data-flush>
  <div class="cap-empty-header">
    <p class="cap-empty-title">No jobs match “Blocked”</p>
    <p class="cap-empty-text">14 jobs are hidden by this filter.</p>
  </div>
  <div class="cap-empty-content"><button type="button" class="cap-btn">Clear filter</button></div>
</div>

<div class="cap-empty" data-kind="all-clear">
  <div class="cap-empty-header">
    <p class="cap-empty-title"><span class="cap-status" data-tone="ok">[ok glyph]All clear</span></p>
    <p class="cap-empty-text">No mentions are waiting.</p>
  </div>
</div>

<div class="cap-empty" data-kind="failed" role="alert">
  <div class="cap-empty-header">
    <p class="cap-empty-title">[critical glyph]Could not load the queue</p>
    <p class="cap-empty-text">The server answered with an error (502). Nothing changed on your side.</p>
  </div>
  <div class="cap-empty-content"><button type="button" class="cap-btn">Try again</button></div>
</div>

<div class="cap-empty-wait" aria-busy="true">
  [spinner, labelled "Building the site"]
  <p class="cap-empty-text">This usually takes about 30 seconds.</p>
</div>
```

In React, `import { Empty, Wait } from "capsomer/react/empty"`: `<Empty kind="no-match" title="No jobs match “Blocked”" action={<button className="cap-btn">Clear filter</button>}>14 jobs are hidden by this filter.</Empty>`; `icon` and `flush` are optional. `Skeleton` and `Spinner` are still exported from it; they now live in `capsomer/react/skeleton`.

## The shadcn component it matches

Empty (`empty.tsx`, nova): `Empty`, `EmptyHeader`, `EmptyMedia` (`default` and `icon` variants), `EmptyTitle`, `EmptyDescription`, `EmptyContent`; centred, balanced text, dashed border, `rounded-xl`, 24 px padding. Deliberately different:

- **Kinds.** shadcn's Empty is one layout; Capsomer's `data-kind` says which of four situations it is and sets the role (`alert` for failed) and the tone. The all-clear and failed titles carry the status glyph.
- **The default media is nothing**, as shadcn's, but a kind never relies on an icon: the glyph in the title, not the tile, carries failed and all clear.
- **The title and description are paragraphs**, not `div`s, so a screen reader reads them as text.

## Exceptions in production

None yet.
