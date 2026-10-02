---
name: panel
title: Panel
summary: A bordered surface with a header on the raised tone, an optional count, source line and link to the full view, and a padded body.
parts: [css, react]
tool: native
states: [card parts (description, action, footer), flush body with a padded block, small size, comfortable density, with a header and a source, with a count and a link to the full view, body only, holding a list with no body padding]
added: 0.1.0
updated: 0.2.0
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
- **The header is compact: 9 px above and below** (the Portal's, down from 12 px), so an overview's panels and its list fit one screen at 1080 p.
- **A count** (`.cap-panel-count`, "6") sits beside the heading in `--dim`. **A link to the full view** (`.cap-panel-more`, "All columns in Sites") sits at the right of the header, after the source line, so a panel that shows the top of something says where the rest is (patterns.md, "The top few of anything longer, with a link to the full view"). The link's box is at least the target size.
- **A panel the anchor bar links to** takes `id` and `data-section="Sites"` on the `section`; the bar names the link from `data-section`.
- **A panel is a plain `section` with a heading, not a named region.** A console page holds eight panels; eight extra landmarks make the landmark list useless. Headings carry the structure.
- **The heading level follows the page**: `h2` under the page's `h1`, `h3` inside a grouped section.
- **`data-flush` on the body removes its padding**, so a list's or table's rows run to the panel's edges and the hover tint fills the row.
- **A flush body with a padded block** (`.cap-panel-pad`, from the Capsid Portal): the body can be `data-flush` so a table or a list touches the panel's edges, and a block of text, a form or a note sits inside it in `.cap-panel-pad`, which has the body's own padding. Use it for an intro line above a list, or a note under a table.
- **A panel can be named by its title** (React: `headingId`; HTML: `id` on the heading and `aria-labelledby` on the section). That makes the section a named region, a landmark: give it to the panels a person should be able to jump to, not to every panel on the page. The React `Panel` also takes a `ref` (to the `<section>`), for focus, scrolling or measuring.
- **Card parts, as shadcn's Card has them**: a description under the heading (`.cap-panel-desc`, muted), an action at the header's right (`.cap-panel-action`, the shadcn CardAction), a footer band under the body (`.cap-panel-foot`, tinted, under a rule, for the panel's own buttons or a link), `data-size="sm"` for tighter spacing, a picture as the first child running to the edges. In comfortable density the panel takes a faint `--shadow-xs`.
- **Spacing follows density**: the header and body padding come from `--pad-y`, `--pad-card` and `--gap` (compact values are the Portal's 9 and 16 px, 12 px body).
- **The panel clips its content to its rounded corners.** Focus rings inside a panel (row-list, table) are drawn inset so clipping never hides one.

## The shadcn component it matches

Card (`card.tsx`): Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter. Mapping: `.cap-panel`, `.cap-panel-head` with its heading, `.cap-panel-desc`, `.cap-panel-action`, `.cap-panel-body`, `.cap-panel-foot`; size `sm`; the footer tint and rule; the first-child image.

Different on purpose: the header sits on the raised tone (a band) rather than shadcn's header with no tint, as in the Portal; the heading is a real `h2` or `h3`, not a `div`; a plain section, not a landmark, unless given a heading id; the source line, count and link to the full view have no shadcn counterpart.

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

With a count and a link to the full view:

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

In React, `import { Panel } from "capsomer/react/panel"`: `<Panel title="Needs attention" src="Worst first. Read 40 seconds ago" flush>...</Panel>`; `count`, `more` (the link), `description`, `actions`, `footer`, `size="sm"`, `section` (for the anchor bar, with `id`), `headingId` (names the section by its title with `aria-labelledby`) and `ref` (to the `<section>`) are optional.

A flush panel with a padded block, a description and a footer:

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

**Provenance.** EXTRACTED, against capsid `master` as of 2026-10-01 (`dashboard/src/styles.css` `.panel`, `.panel > header`, `.panel .body`, `.src`, `.more`; `dashboard/src/views/shared.tsx` `Panel`). Evidence: the border, the 10 px radius, the raised header with no rule, the 13 px 600 heading with -0.01em, the right-pushed `--dim` source line and the 16 px body padding are the Portal's rules with token names (`.src { font-size: 11px }` is `--fs-label`; the body's 14 px vertical padding is 12 px here, the nearest space token, and its grid gap is Capsomer's, from `--gap`). Brought up to date in v0.1.1: the header's 9 px padding (12 px at `366b902`), the count (`num faint`), and the link to the full view (`.more`, with `.src + .more`). Adapted: the Portal's `Panel` takes `section` and `id` for its anchor bar (`data-section`); this one does too. Not carried: the Portal's `.body` is the markup's own div and has no flush variant (its lists sit directly in the panel); `data-flush` is Capsomer's, and `overflow: clip` for the rounded corners, which the Portal gets from `.attention { overflow: hidden }` on one panel only.

## Exceptions in production

None yet.
