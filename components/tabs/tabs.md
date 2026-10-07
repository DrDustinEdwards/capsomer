---
name: tabs
title: Tabs
summary: A list of tabs that show one panel at a time, or the same list as links to other pages.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [default tray, line variant, vertical, count, disabled tab, manual activation, address follows the tab, links with the current page, narrow list scrolls, comfortable density]
added: 0.3.0
source: The site admin's status tabs (app/components/admin/posts-filters.tsx, .posts-tab) and mention filters (app/routes/admin.mentions.tsx, .admin-chip); shadcn/ui Tabs for the panel form
replaces:
  - 'role="tablist"'
  - 'class="[^"]*\b(posts-tab|tabs?-(list|trigger)|tab-list)\b'
  - 'className="[^"]*\b(posts-tab|tab-list)\b'
---

# Tabs

Two ways to the same look. **Panels**: a `tablist` of buttons and the `tabpanel` each one shows, on one page. **Links**: a `nav` of links where each tab is another URL and the current one says `aria-current="page"`.

**Provenance.** EXTRACTED and REWROTE, against the site admin (dustinedwards.info). The site has no ARIA tab list. Its tabs are links in a `nav` (`.posts-tab`: All, Published, Drafts, Scheduled, each with a count, the current one `aria-current="page"` and a 2 px brand rule; the mention filters are the same idea drawn as chips). That is the links form here, kept whole: the count (hidden from the accessible name there, then read as ", 12 posts") is now part of the name, "Drafts 21", in `.cap-tab-count`, and the rule on the row's hairline is the line variant. The panel form is new, from shadcn/ui Tabs and the WAI-ARIA Authoring Practices, because a page that shows one of several panels in place needs it.

## When to use it

- **Links**: a filter or a section that is its own URL, so Back, a bookmark and a server render all work: Open or Resolved mentions, a post's Draft and History pages. This is the default for the admin: the content a person sees is in the HTML the server sent.
- **Panels**: peers on one page that a person flips between without leaving: a site's Overview, Runs and Settings; a post's Draft and Preview.

## When not to

- **A value, not a view** (a time window, a layout): the segmented control. It is radios and changes a setting, not a panel.
- **Steps in order**: numbered headings or a stepper, not tabs.
- **One long page with sections**: the anchor bar, or headings.
- **Show or hide one thing in place**: a disclosure.
- Tabs inside tabs: the second level is a page of its own.

## The default and its reason

- **Automatic activation.** An arrow key moves focus and chooses the tab at once. The APG recommends it when the panel is already there and shows without delay, which is true of every panel here (they are all in the HTML). `data-activation="manual"` makes the arrows only move focus and Enter or Space choose, for a panel that is slow to show.
- **All panels are in the HTML.** The chosen panel is visible and the others carry `hidden`, so the delivered page is complete for an agent or a search engine and the first paint needs no script. The tab buttons, though, do nothing until `enhance()` runs: where a page must work without script, use the links form.
- **Links form is the better default for admin filters** (Open, Resolved, All): a filter changes what the server returns, so it is a link to a URL, and the count sits in the tab.
- **The chosen tab is drawn three ways at once**: raised on the tray with an accent edge (3:1), a heavier weight, and `aria-selected` or `aria-current`. shadcn's default tray marks it by fill alone, which fails 3:1.
- **Default is shadcn's muted tray, `data-variant="line"` its underline.** The line variant is the site admin's `.posts-tab` look. The tray reads as a control; the line reads as page navigation.
- **The list scrolls, never clips,** on a narrow space; the chosen tab is scrolled into view. shadcn's list does not scroll.
- **A disabled tab is struck through,** passed over by arrow keys, and not chosen by a click.
- **A count is text.** The accessible name reads "Runs 24". Do not hide it from the name: it is part of what the tab is.
- **The address can follow the tab** (`data-sync="hash"`): the panel's id goes after the `#` (replacing the entry, so Back does not step through every click), and a link with that hash opens the tab.

- **A link slot, so a tab link can be an app's router link.** `TabsNav` takes `renderLink` (and a `TabLink` takes its own, which wins): a function given a plain `<a>`'s props with `href` always set, the tab's class (`cap-tab`) and `aria-current="page"` already on it, and the count inside; the app returns its router's `<Link to={props.href} {...props} />`. The tab keeps its look, its count and its current state, and a click navigates in the app with no page load, the router's way. Without `renderLink` a `TabLink` is a plain `<a>`, as before. Same shape as the shell's `renderLink`.

## The shadcn component it matches

Tabs (`tabs.tsx`: Tabs, TabsList, TabsTrigger, TabsContent), Base UI flavour, nova style. Matched: the default muted tray with the chosen tab raised, the `line` variant, horizontal and vertical, the sizes of the list, `fill`. Different on purpose: the chosen tab has an edge, not only a fill; the list scrolls; panels are always in the HTML; a links form exists; a count has its own part.

## Keyboard

Panels:

| Key | Does |
| --- | --- |
| Tab | Enters the list on the chosen tab, then moves on to the panel |
| Right arrow, Left arrow | Moves to the next or previous tab and, with automatic activation, chooses it. At the ends it wraps. Down and Up in a vertical list. In a right-to-left page the arrows swap |
| Home, End | First or last tab |
| Enter, Space | Chooses the focused tab (manual activation) |

A disabled tab is skipped by every key above.

Links:

| Key | Does |
| --- | --- |
| Tab | Each link is a tab stop |
| Enter | Follows the link |

## Accessibility

- Panels: `role="tablist"` named by `aria-label`, `role="tab"` with `aria-selected` and `aria-controls`, `role="tabpanel"` with `aria-labelledby`. A roving `tabindex`: the chosen tab is 0, the rest -1. A vertical list also has `aria-orientation="vertical"`. A panel has `tabindex="0"`, so a person who tabs past the list lands on its content even when it holds nothing focusable.
- Links: a `nav` named by `aria-label`, the current link `aria-current="page"`. No tab roles: they are links.
- A disabled tab has `aria-disabled="true"`. It is not removed from the page.
- Contrast: tab text 4.5:1 on the tray and on the raised tab; the chosen tab's edge and the line variant's rule 3:1.
- Hit areas are at least `var(--target)`; forced colours draw the chosen tab in Highlight.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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

Attributes: on `.cap-tabs` `data-orientation="vertical"`, `data-activation="manual"`, `data-sync="hash"`; on `.cap-tabs-list` `data-variant="line"`, `data-size="sm|lg"`, `data-fill`. `import { enhance, select, nextTab } from "capsomer/behaviour/tabs"`: `enhance()` attaches every `[data-cap="tabs"]`; `select(root, tab)` chooses one from script. A choice fires `cap:tabs-change` (bubbles; `detail.tab`, `detail.panel`).

In React, `import { Tabs, TabsList, TabsTrigger, TabsContent, TabsNav, TabLink } from "capsomer/react/tabs"`:

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

`value` and `onValueChange` control the chosen tab. With a router's link component, give it `className="cap-tab"` and `aria-current`, and wrap the links in `TabsNav`.

A router link in React:

```tsx
import { TabsNav, TabLink } from "capsomer/react/tabs";
import { Link } from "react-router";

<TabsNav aria-label="Filter mentions by status" renderLink={({ href, ...props }) => <Link to={href} {...props} />}>
  <TabLink href="/mentions/all" current={status === "all"} count={24}>All</TabLink>
  <TabLink href="/mentions/waiting" current={status === "waiting"} count={5}>Waiting</TabLink>
</TabsNav>
```

## Deliberately different

- The chosen tab has an accent edge and a heavier weight as well as its fill (shadcn: fill only).
- The list scrolls on a narrow space and keeps the chosen tab in view.
- Every panel is in the HTML, the inactive ones `hidden`.
- A links form with `aria-current="page"` shares the look, because a status filter is a URL.
- A disabled tab is struck through, not dimmed.

## Exceptions in production

None yet.
