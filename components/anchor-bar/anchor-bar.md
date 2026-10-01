---
name: anchor-bar
title: Anchor bar
summary: '"On this page": sticky links to a long view''s sections, the current one marked.'
parts: [css, behaviour, react]
tool: own JavaScript
states: [top of page, scrolled into the third section, short page with no bar]
added: 0.1.0
source: the approved mockup's .onpage bar
replaces:
  - 'class="onpage"'
  - 'aria-label="On this page"'
---

# Anchor bar

A sticky bar of links to the `h2` sections of a long view. The link for the section being read is marked; following a link scrolls to its section and moves focus to the heading.

## When to use it

**Only on a view with three or more sections that is taller than two screens.** The module checks both (the number of sections it links to, and the scroll height against the window or the scrolling region) and hides the bar when either fails, unless the bar has `data-always`.

## When not to

On a short view the bar is one more thing to read, and the headings are already in sight. Between separate views, use the shell's menu: these links stay on one page. A long form needs its steps, not an index.

## The default and its reason

- **Sticky at the top** (`top: env(safe-area-inset-top, 0px)`), so it is there wherever the reader is.
- **The current section's link has `aria-current="location"`**, set by a small IntersectionObserver: the current section is the last heading above a line 35% down the view, and the last one once the view is scrolled to its end. It is shown by a tint and an underline, not colour alone.
- **Following a link moves focus to the section's heading** (given `tabindex="-1"`), so a keyboard or screen reader user continues from there, and the address gets the section's `#id`.
- **A heading scrolled to stops below the bar, never under it** (WCAG 2.4.11): the module measures the bar into `--cap-anchors-h`, and each linked heading gets a matching `scroll-margin-top`.
- **On a phone the links scroll sideways** rather than wrap, and the "On this page" label hides; the bar keeps its name.
- With an empty list, the module fills it from the `h2[id]` headings in its `main` (or `data-cap-scope`).

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

`enhance()` applies the rule, watches the sections and handles the links; `watchSections(headings, onChange)`, `currentSection()`, `meetsRule()` and `goToSection(heading)` are exported. In React, `<AnchorBar sections={[{ id, label }]} />`.

## Exceptions in production

None yet.
