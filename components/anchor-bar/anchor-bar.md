---
name: anchor-bar
title: Anchor bar
summary: "\"On this page\": sticky links to a long view's sections, the current one marked."
parts: [css, behavior, react]
tool: own JavaScript
states: [link states (rest, current, hover, pressed), top of page, scrolled into the third section, blocks marked data-section, short page with no bar, vertical]
added: 0.1.0
updated: 0.132.0
source: the approved mockup's .onpage bar; Capsid Portal, dashboard/src/ui/anchors.tsx and styles.css (".anchors")
replaces:
  - 'class="onpage"'
  - 'aria-label="On this page"'
  - 'aria-label="Sections" className="sticky'
---

# Anchor bar

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches each link in turn |
| Enter on a link | Scrolls to the section and moves focus to its heading |

- A `nav` named "On this page"; the visible label beside the links is `aria-hidden` because it repeats that name.
- `aria-current="location"` tells a screen reader which link is the section being read.
- Smooth scrolling only under `prefers-reduced-motion: no-preference`.
