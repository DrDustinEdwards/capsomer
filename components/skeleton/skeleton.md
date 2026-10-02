---
name: skeleton
title: Skeleton and spinner
summary: What a page or a panel shows while it loads: grey shapes for content, a turning arc and a word for one panel, or centred on the page.
parts: [css, react]
tool: native
states: [skeleton, shapes, spinner, spinner in a button, sizes, word hidden, page spinner, reduced motion, comfortable]
added: 0.1.0
updated: 0.2.0
source: Capsomer mockup (design/mockup.html, "Empty, loading and error"); the Capsid Portal's centred page spinner
replaces:
  - 'class="(skel|skeleton|spinner|loader)[ "]'
  - "className=\"(skel|skeleton|spinner|loader)[ \"]"
---

# Skeleton and spinner

What loading looks like, by how long it takes. In 0.1 these lived in the Empty component; they are their own component now, with the same class names.

## When to use it

- `.cap-skeleton`: grey lines standing in for a page's content while it loads, 1 to 10 seconds.
- `.cap-skeleton-block`: one grey shape on its own (shadcn's Skeleton): a block the height of a control, `data-shape="circle"` for an avatar, `data-shape="card"` for a card.
- `.cap-spinner`: a small turning arc and a word, for one panel or inside a button that is working. `data-size="sm"` and `"lg"` change the arc.
- `.cap-spinner[data-layout="page"]`: the arc and its word centred in the space they are given, for a whole page or panel with nothing to show yet (the Portal's page spinner). Give it `role="status"`, and set `aria-busy="true"` on the region it stands for.

## When not to

- Under 1 second, show nothing: a flash of a spinner is worse than a pause.
- Over 10 seconds, say how long it usually takes: `.cap-empty-wait` in [Empty](../empty/empty.md).
- A button's own pending state is the button's `aria-busy="true"` with `.cap-btn-spinner` (button.css draws that ring itself; it does not use this arc, so the two are independent and a button needs only its own CSS).
- A page that failed to load is Empty, `failed`, not a spinner that never ends.

## The default and its reason

- **Loading follows the clock** (patterns.md "Loading"): nothing under 1 s; a spinner for one panel or a skeleton for a page from 1 to 10 s; over 10 s say how long; keep the last good data while reloading.
- **Rotation and the pulse are the only permitted loops.** The skeleton pulses (opacity only) and the arc turns only under `prefers-reduced-motion: no-preference`. Under reduced motion the arc is hidden and the word ("Loading") shows on its own, so nothing moves and the state is still said.
- **A skeleton is `aria-busy="true"` and says "Loading" in hidden text**; its grey shapes are `aria-hidden`. A shape on its own sits inside a busy region that says what is loading.
- **The spinner's word is visible by default.** `data-label="hidden"` keeps it for screen readers only, for a button or an icon with no room; it still shows under reduced motion.
- **The page spinner is a status region** (`role="status"`), centred in at least 60 percent of the viewport height (at most 28 rem), with its word under the arc at the lead size.
- **Size follows the text and density.** The arc is 1.15 em; the skeleton line is the body text's height; a block is `--control` high; the page arc is 1.1 times `--control`.

## Keyboard

| Key | Does |
| --- | --- |
| None | A skeleton and a spinner are not interactive. They take no focus. |

## Accessibility

- The word is the accessible text; the arc is `aria-hidden`.
- The spinner's word is `--muted` (4.5:1); the arc is 3:1 against its background.
- A skeleton's grey shapes carry no information; forced colours paint them in GrayText so they do not vanish.
- Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-skeleton" aria-busy="true">
  <span class="cap-sr-only">Loading</span>
  <span class="cap-skeleton-line" aria-hidden="true"></span>
  <span class="cap-skeleton-line" aria-hidden="true"></span>
  <span class="cap-skeleton-line" aria-hidden="true"></span>
</div>

<div aria-busy="true">
  <span class="cap-sr-only">Loading the mention</span>
  <span class="cap-skeleton-block" data-shape="circle" aria-hidden="true"></span>
  <span class="cap-skeleton-block" aria-hidden="true"></span>
</div>

<span class="cap-spinner">
  <svg class="cap-spinner-arc" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" opacity="0.25"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M8 2a6 6 0 0 1 6 6"/></svg>
  <span class="cap-spinner-label">Loading</span>
</span>

<main aria-busy="true">
  <span class="cap-spinner" data-layout="page" role="status">[arc]<span class="cap-spinner-label">Loading the Portal</span></span>
</main>
```

In React, `import { Skeleton, SkeletonBlock, Spinner } from "capsomer/react/skeleton"`: `<Skeleton lines={4} />`, `<SkeletonBlock shape="circle" />`, `<Spinner label="Saving" hideLabel />`, `<Spinner layout="page" label="Loading the Portal" />`. They are also still exported from `capsomer/react/empty`.

## The shadcn component it matches

Skeleton (`skeleton.tsx`: a muted rounded block with `animate-pulse`) and Spinner (`spinner.tsx`: a 16 px spinning icon with `role="status"` and `aria-label="Loading"`). Deliberately different:

- **The spinner has a visible word**, not only an aria-label, so it is not colour and motion alone; under reduced motion the word replaces the arc.
- **The pulse is slower and shallower** (1.6 s, down to 55 percent opacity, opacity only) than Tailwind's 2 s to 50 percent, and stops under reduced motion; shadcn's keeps pulsing.
- **Lines and blocks are two parts**, since a page's stand-in is usually several lines of different widths, where shadcn leaves sizing to the caller.
- **The page spinner** is not in shadcn; it is the Portal's centred spinner.

## Exceptions in production

None yet.
