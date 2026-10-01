---
name: panel
title: Panel
summary: A bordered surface with a header on the raised tone, an optional source line, and a padded body.
parts: [css, react]
tool: native
states: [with a header and a source, body only, holding a list with no body padding]
added: 0.1.0
source: Capsid Portal, dashboard/src/styles.css ("panels") and dashboard/src/views/shared.tsx (Panel)
replaces:
  - 'class="panel"'
  - "className=\"panel"
  - "className=\\{`panel"
---

# Panel

The box most of a console's content sits in: a surface with a border and a large radius, a header on the raised tone holding the heading and where the data comes from, and a body.

## When to use it

To group one subject on a page of several: usage against limits, the attention list, a table of sites, a form section in Settings.

## When not to

A page with one subject needs no box around it; the page heading is enough. A message about the whole page is a banner (`.cap-banner`), not a panel. A box that opens and closes is a disclosure.

## The default and its reason

- **The header sits on the raised tone, not over a rule.** The tone groups the heading with its source without adding a line to a page that already has row rules (Portal, "A panel's header sits on the raised tone").
- **The source line says where the data came from and how fresh it is**, pushed to the right, in `--dim`: "Cloudflare. Read 6 minutes ago" (patterns.md, "Data that updates itself").
- **A panel is a plain `section` with a heading, not a named region.** A console page holds eight panels; eight extra landmarks make the landmark list useless. Headings carry the structure.
- **The heading level follows the page**: `h2` under the page's `h1`, `h3` inside a grouped section.
- **`data-flush` on the body removes its padding**, so a list's or table's rows run to the panel's edges and the hover tint fills the row.
- **The panel clips its content to its rounded corners.** Focus rings inside a panel (row-list, table) are drawn inset so clipping never hides one.

## Keyboard

| Key | Does |
| --- | --- |
| None of its own | A panel holds other components; their keys apply |

## Accessibility

- The heading is a real `h2` or `h3`, so screen reader users move between panels by heading.
- Forced colours: the header's tint is removed, so a rule under the header keeps it apart.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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

In React, `import { Panel } from "capsomer/react/panel"`: `<Panel title="Needs attention" src="Worst first. Read 40 seconds ago" flush>...</Panel>`.

## Exceptions in production

None yet.
