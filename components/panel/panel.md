---
name: panel
title: Panel
summary: A bordered surface with a header on the raised tone, an optional count, source line and link to the full view, and a padded body.
parts: [css, react]
tool: native
states: [card parts (description, action, footer), flush body with a padded block, small size, comfortable density, with a header and a source, with a count and a link to the full view, body only, holding a list with no body padding, a panel that is a link, figures beside the heading, a View all link from its address, reading again, bare]
added: 0.1.0
updated: 0.100.0
source: Capsid Portal, dashboard/src/styles.css ("panels") and dashboard/src/views/shared.tsx (Panel)
replaces:
  - 'class="panel"'
  - "className=\"panel"
  - "className=\\{`panel"
---

# Panel

## Usage

```html
<section class="cap-panel">
  <header class="cap-panel-head">
    <h2>Usage against free limits</h2>
    <span class="cap-panel-src">Cloudflare. Read 6 minutes ago</span>
  </header>
  <div class="cap-panel-body">[content]</div>
</section>

<!-- holding a list or a table -->
<div class="cap-panel-body" data-flush>[a .cap-rows list or a .cap-table-wrap]</div>
```

```html
<section class="cap-panel" id="sites" data-section="Sites">
  <header class="cap-panel-head">
    <h2>Sites</h2>
    <span class="cap-panel-count">6</span>
    <span class="cap-panel-src">Watcher pass 40 seconds ago</span>
    <span class="cap-panel-more"><a href="/sites">All columns in Sites</a></span>
  </header>
  ...
</section>
```

```html
<section class="cap-panel" aria-labelledby="queue-h">
  <header class="cap-panel-head">
    <h2 id="queue-h">Queue</h2>
    <span class="cap-panel-action"><button type="button" class="cap-btn">Edit</button></span>
    <p class="cap-panel-desc">Jobs wait here until a driver takes them.</p>
  </header>
  <div class="cap-panel-body" data-flush>
    <div class="cap-panel-pad"><p>Two jobs are waiting.</p></div>
    [a .cap-rows list or a .cap-table-wrap, edge to edge]
  </div>
  <footer class="cap-panel-foot">[buttons or a link]</footer>
</section>
```

## Accessibility

| Key | Does |
| --- | --- |
| None of its own | A panel holds other components; their keys apply |

- The heading is a real `h2` or `h3`, so screen reader users move between panels by heading.
- Forced colors: the header's tint is removed, so a rule under the header keeps it apart.
