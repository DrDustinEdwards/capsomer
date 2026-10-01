---
name: anchor-bar
title: Anchor bar
summary: '"On this page": sticky links to a long view''s sections, the current one marked.'
parts: [css, behaviour, react]
tool: own JavaScript
states: [top of page, scrolled into the third section, blocks marked data-section, short page with no bar]
added: 0.1.0
source: the approved mockup's .onpage bar; Capsid Portal, dashboard/src/ui/anchors.tsx and styles.css (".anchors")
replaces:
  - 'class="onpage"'
  - 'aria-label="On this page"'
---

# Anchor bar

A sticky bar of links to the sections of a long view: its `h2` headings, or the blocks (panels) marked `data-section`. The link for the section being read is marked; following a link scrolls to its section and moves focus to it.

## When to use it

**Only on a view with three or more sections that is taller than two screens.** The module checks both (the number of sections it links to, and the scroll height against the window or the scrolling region) and hides the bar when either fails, unless the bar has `data-always`. It checks again whenever the window or the content changes size, so a view that fills in after it loads gets its bar when it earns one, and loses it when it stops.

## When not to

On a short view the bar is one more thing to read, and the headings are already in sight. Between separate views, use the shell's menu: these links stay on one page. A long form needs its steps, not an index.

## The default and its reason

- **Sticky at the top** (`top: env(safe-area-inset-top, 0px)`), so it is there wherever the reader is. **Quiet**: on the ground tone with no frame, so it does not read as a second header (Portal: "on the ground tone").
- **The bar's own height does not count toward "taller than two screens"**, or showing the bar could tip the rule that showed it (the Portal's finding).
- **The current section's link has `aria-current="location"`**, set by a small IntersectionObserver: the current section is the last section above a line 35% down the view, and the last one once the view is scrolled to its end. It is shown by the text's own colour and a 2 px accent underline, not colour alone.
- **Following a link moves focus to the section** (given `tabindex="-1"`), so a keyboard or screen reader user continues from there, and **replaces** the address's hash with its `#id`: a click on an in-page link is not a place to go Back to (Portal: "replaces the address's hash").
- **A heading scrolled to stops below the bar, never under it** (WCAG 2.4.11): the module measures the bar into `--cap-anchors-h`, and each linked heading gets a matching `scroll-margin-top`.
- **On a phone the links scroll sideways** rather than wrap, and the "On this page" label hides; the bar keeps its name.
- With an empty list, the module fills it from the `[data-section][id]` blocks in its `main` (or `data-cap-scope`), named by their `data-section`; with none of those, from the `h2[id]` headings. It keeps the list in step as sections come and go.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches each link in turn |
| Enter on a link | Scrolls to the section and moves focus to its heading |

## Accessibility

- A `nav` named "On this page"; the visible label beside the links is `aria-hidden` because it repeats that name.
- `aria-current="location"` tells a screen reader which link is the section being read.
- Smooth scrolling only under `prefers-reduced-motion: no-preference`.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<nav class="cap-anchors" aria-label="On this page" data-cap="anchor-bar">
  <span class="cap-anchors-label" aria-hidden="true">On this page</span>
  <ul class="cap-anchors-list">
    <li><a href="#what-it-checks">What it checks</a></li>
    <li><a href="#thresholds">Thresholds</a></li>
    <li><a href="#when-it-alerts">When it alerts</a></li>
  </ul>
</nav>
...
<h2 id="what-it-checks">What it checks</h2>
```

`enhance()` applies the rule, watches the sections and handles the links; `watchSections(headings, onChange)`, `currentSection()`, `meetsRule(headings, scroller, barHeight)`, `sectionsIn(scope)` and `goToSection(section)` are exported. In React, `<AnchorBar sections={[{ id, label }]} />`; each id is the id of an `h2` or of a block.

**Provenance.** MIXED, against capsid `master` as of 2026-10-01 (`dashboard/src/ui/anchors.tsx`, `dashboard/src/styles.css` `.anchors`, `.anchors-label`, `main:has(.anchors)`). At 0.1.0 the Portal had no anchor bar (`.anchors` is not in `366b902`), so the component was REWROTE from the mockup's `.onpage` bar and patterns.md "In-page anchors". It still is, in its markup (a `nav` with a `ul`, not the Portal's `nav` of bare links), its spy (an IntersectionObserver and a line 35% down the view; the Portal's is a scroll listener that takes the last section whose top has passed the bar) and its focus handling (`scroll-margin-top` on each linked section from a measured `--cap-anchors-h`; the Portal sets `scroll-padding-top: 48px` on `main`). EXTRACTED in v0.1.1: the rule's measuring, again whenever the window or the content changes size (`ResizeObserver` and `MutationObserver`), with the bar's own height left out; sections as `data-section` blocks with ids; `replaceState` for the hash; the quiet look (ground tone, no frame, 12 px muted links, current link in `--text` with an accent mark, 11 px upper-case label). Adapted: the current link is marked by an underline where the Portal uses a 2 px bottom border, because a transparent border turns visible in forced colours. Not ported: the Portal's spy line (see above; the 35% line is kept because the bar here is not tied to a fixed 48 px).

## Exceptions in production

None yet.
