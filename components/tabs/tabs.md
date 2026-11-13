---
name: tabs
title: Tabs
summary: A list of tabs that show one panel at a time, or the same list as links to other pages.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [default tray, line variant, pill variant dragged, vertical, count, disabled tab, manual activation, address follows the tab, progressive and remembered, links with the current page, page tabs, narrow list scrolls, comfortable density]
added: 0.3.0
updated: 0.102.0
source: The site admin's status tabs (app/components/admin/posts-filters.tsx, .posts-tab) and mention filters (app/routes/admin.mentions.tsx, .admin-chip); shadcn/ui Tabs for the panel form; dustinedwards.info's remembered platform tabs (app/enhance/platforms.ts); bsw's draggable pill switcher (app/islands/editing-demo.ts); the Capsid Portal's ?tab= page tabs (dashboard/src/ui/pagetabs.tsx)
replaces:
  - 'role="tablist"'
  - 'class="(?:[^"]*\s)?(posts-tab|tabs?-(list|trigger)|tab-list)[\s"]'
  - 'className="(?:[^"]*\s)?(posts-tab|tab-list)[\s"]'
  - 'data-platforms|procedure-platform-tabs'
  - 'psms-(glass-track|pill|track-label)'
  - 'export function (PageTabs|TabLink)\b'
---

# Tabs

## Usage

```html
<div class="cap-tabs" data-cap="tabs">
  <div class="cap-tabs-list" role="tablist" aria-label="Site sections">
    <button type="button" class="cap-tab" role="tab" id="t-overview" aria-selected="true" aria-controls="p-overview" tabindex="0">Overview</button>
    <button type="button" class="cap-tab" role="tab" id="t-runs" aria-selected="false" aria-controls="p-runs" tabindex="-1">Runs<span class="cap-tab-count">24</span></button>
  </div>
  <div class="cap-tabs-panel" role="tabpanel" id="p-overview" aria-labelledby="t-overview" tabindex="0">...</div>
  <div class="cap-tabs-panel" role="tabpanel" id="p-runs" aria-labelledby="t-runs" tabindex="0" hidden>...</div>
</div>

<nav class="cap-tabs-list" data-variant="line" aria-label="Filter posts by status">
  <a class="cap-tab" href="/admin/posts" aria-current="page">All<span class="cap-tab-count">312</span></a>
  <a class="cap-tab" href="/admin/posts?status=draft">Drafts<span class="cap-tab-count">21</span></a>
</nav>
```

```html
<div class="cap-tabs" data-cap="tabs" data-progressive data-remember="platform" data-remember-guess="platform">
  <div class="cap-tabs-list" data-variant="line" data-label="Platform">
    <a class="cap-tab" href="#install-macos" data-value="macos">macOS</a>
    <a class="cap-tab" href="#install-windows" data-value="windows">Windows</a>
  </div>
  <div class="cap-tabs-panel" id="install-macos"><p class="cap-tabs-panel-label">macOS</p>...</div>
  <div class="cap-tabs-panel" id="install-windows"><p class="cap-tabs-panel-label">Windows</p>...</div>
</div>
```

```tsx
<Tabs defaultValue="overview">
  <TabsList aria-label="Site sections" variant="line">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="runs" count={24}>Runs</TabsTrigger>
    <TabsTrigger value="alerts" disabled>Alerts</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="runs">...</TabsContent>
</Tabs>

<TabsNav aria-label="Filter mentions by status">
  <TabLink href="?status=open" current count={12}>Open</TabLink>
  <TabLink href="?status=resolved" count={48}>Resolved</TabLink>
</TabsNav>
```

```tsx
<Tabs defaultValue="macos" remember="platform" rememberGuess="platform">...</Tabs>

<Tabs defaultValue="simple">
  <TabsList aria-label="Markup view" variant="pill">
    <TabsTrigger value="original" tone="info">Original</TabsTrigger>
    <TabsTrigger value="simple" tone="ok">Simple markup</TabsTrigger>
  </TabsList>
  ...
</Tabs>

const search = useLocation().search;
<PageTabs aria-label="Agents" path="/agents" search={search} current={tabParam(search) ?? "active"}
  tabs={[{ id: "active", label: "Active", count: 3 }, { id: "history", label: "History" }]}
  renderLink={({ href, ...props }) => <Link to={href} {...props} />} />
```

```tsx
import { TabsNav, TabLink } from "capsomer/react/tabs";
import { Link } from "react-router";

<TabsNav aria-label="Filter mentions by status" renderLink={({ href, ...props }) => <Link to={href} {...props} />}>
  <TabLink href="/mentions/all" current={status === "all"} count={24}>All</TabLink>
  <TabLink href="/mentions/waiting" current={status === "waiting"} count={5}>Waiting</TabLink>
</TabsNav>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Enters the list on the chosen tab, then moves on to the panel |
| Right arrow, Left arrow | Moves to the next or previous tab and, with automatic activation, chooses it. At the ends it wraps. Down and Up in a vertical list. In a right-to-left page the arrows swap |
| Home, End | First or last tab |
| Enter, Space | Chooses the focused tab (manual activation) |

| Key | Does |
| --- | --- |
| Tab | Each link is a tab stop |
| Enter | Follows the link |

Panels:

A disabled tab is skipped by every key above. Progressive tabs and the pill take the same keys. The pill's drag is for a pointer only and is never the only way to choose.

Links (and page tabs):

- Panels: `role="tablist"` named by `aria-label`, `role="tab"` with `aria-selected` and `aria-controls`, `role="tabpanel"` with `aria-labelledby`. A roving `tabindex`: the chosen tab is 0, the rest -1. A vertical list also has `aria-orientation="vertical"`. A panel has `tabindex="0"`, so a person who tabs past the list lands on its content even when it holds nothing focusable.
- Links: a `nav` named by `aria-label`, the current link `aria-current="page"`. No tab roles: they are links.
- Progressive: before script, links to the panels (in-page links, each panel under its own visible name); after, the full tab roles above, the list named by its `data-label` (or `aria-label`). The links keep their `href`; a click chooses the tab and does not jump the page.
- Pill: the drag is a pointer's extra (WCAG 2.5.7): a click and the arrow keys choose every tab. The chosen tab is still marked by its edge and weight, not by the tone alone.
- A disabled tab has `aria-disabled="true"`. It is not removed from the page.
- Contrast: tab text 4.5:1 on the tray and on the raised tab; the chosen tab's edge and the line variant's rule 3:1.
- Hit areas are at least `var(--target)`; forced colors draw the chosen tab in Highlight.
