---
name: tabs
title: Tabs
summary: A list of tabs that show one panel at a time, or the same list as links to other pages.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [default tray, line variant, pill variant dragged, vertical, count, disabled tab, manual activation, address follows the tab, progressive and remembered, links with the current page, page tabs, narrow list scrolls, comfortable density]
added: 0.3.0
updated: 0.95.0
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

Two ways to the same look. **Panels**: a `tablist` of buttons and the `tabpanel` each one shows, on one page. **Links**: a `nav` of links where each tab is another URL and the current one says `aria-current="page"`.

**Provenance.** EXTRACTED and REWROTE, against the site admin (dustinedwards.info). The site has no ARIA tab list. Its tabs are links in a `nav` (`.posts-tab`: All, Published, Drafts, Scheduled, each with a count, the current one `aria-current="page"` and a 2 px brand rule; the mention filters are the same idea drawn as chips). That is the links form here, kept whole: the count (hidden from the accessible name there, then read as ", 12 posts") is now part of the name, "Drafts 21", in `.cap-tab-count`, and the rule on the row's hairline is the line variant. The panel form is new, from shadcn/ui Tabs and the WAI-ARIA Authoring Practices, because a page that shows one of several panels in place needs it.

## When to use it

- **Links**: a filter or a section that is its own URL, so Back, a bookmark and a server render all work: Open or Resolved mentions, a post's Draft and History pages. This is the default for the admin: the content a person sees is in the HTML the server sent.
- **Panels**: peers on one page that a person flips between without leaving: a site's Overview, Runs and Settings; a post's Draft and Preview.

## When not to

- **A value, not a view** (a time window, a layout): the segmented control. It is radios and changes a setting, not a panel.
- **Steps in order**: the step indicator (components/step-indicator) over one step per page, not tabs.
- **One long page with sections**: the anchor bar, or headings.
- **Show or hide one thing in place**: a disclosure.
- Tabs inside tabs: the second level is a page of its own.

## The default and its reason

- **Automatic activation.** An arrow key moves focus and chooses the tab at once. The APG recommends it when the panel is already there and shows without delay, which is true of every panel here (they are all in the HTML). `data-activation="manual"` makes the arrows only move focus and Enter or Space choose, for a panel that is slow to show.
- **The chosen mark slides.** The raised tab, or the line, moves and resizes to the new tab over 200 ms: one mark, the list's `::before`, tethered to the chosen tab with CSS anchor positioning, so it needs no script and works for the React wrapper and a client-side router alike. Where anchor positioning (with `anchor-scope`) is missing, under reduced motion and in forced colors the chosen tab draws its own mark and nothing moves.
- **All panels are in the HTML.** The chosen panel is visible and the others carry `hidden`, so the delivered page is complete for an agent or a search engine and the first paint needs no script. The tab buttons, though, do nothing until `enhance()` runs: where a page must work without script, use the links form.
- **Links form is the better default for admin filters** (Open, Resolved, All): a filter changes what the server returns, so it is a link to a URL, and the count sits in the tab.
- **The chosen tab is drawn three ways at once**: raised on the tray with an accent edge (3:1), a heavier weight, and `aria-selected` or `aria-current`. shadcn's default tray marks it by fill alone, which fails 3:1.
- **Default is shadcn's muted tray, `data-variant="line"` its underline.** The line variant is the site admin's `.posts-tab` look. The tray reads as a control; the line reads as page navigation.
- **The list scrolls, never clips,** on a narrow space; the chosen tab is scrolled into view. shadcn's list does not scroll.
- **A disabled tab is struck through,** passed over by arrow keys, and not chosen by a click.
- **A count is text.** The accessible name reads "Runs 24". Do not hide it from the name: it is part of what the tab is.
- **Progressive tabs work with no script** (`data-progressive`). The server sends the list as links to the panels (`href="#id"`) and every panel showing, each under its own name (`.cap-tabs-panel-label`): the whole page with script off, on paper and for a machine. `enhance()` turns the links into tabs; the label goes, since the tab names the panel. A print shows every panel again.
- **A remembered choice** (`data-remember="<key>"`): the reader's choice is kept on the device and chosen in every set, on every page, that names the same key, and in other open windows. With nothing kept, `data-remember-guess="platform"` starts on the reader's system (a tab whose `data-value` is `windows`, `macos` or `linux`), else the first tab. A tab's value is its `data-value`, else its panel's id. Storage that is refused leaves the choice to the page. An address with the panel's hash still wins.
- **The pill can be dragged** (`data-variant="pill"`, horizontal). A press that moves slides the pill with the pointer, held between the first and last tab, the tab under it drawn as it will be; letting go chooses the tab nearest the pill, which settles on it with a little spring. A press that does not move is a click. Arrow keys, Home and End are the keyboard's way, the same as every tab list, so the drag is never the only way (WCAG 2.5.7, Dragging Movements). A sideways drag is the pill's; an up or down swipe still scrolls the page. Each tab's `data-tone` (`accent`, `info`, `ok`, `warn`, `crit`) colors the pill while it is chosen; the label stays in the text color, so its contrast holds. For two to four short tabs: a list that has to scroll is the tray's.
- **Page tabs are links to the page itself with `?tab=`** (`PageTabs`): the first tab is the bare address, every other query parameter is kept, so Back, a bookmark, a reload and an alert's link all reach a tab. The line variant by default.
- **The address can follow the tab** (`data-sync="hash"`): the panel's id goes after the `#` (replacing the entry, so Back does not step through every click), and a link with that hash opens the tab.

- **A link slot, so a tab link can be an app's router link.** `TabsNav` takes `renderLink` (and a `TabLink` takes its own, which wins): a function given a plain `<a>`'s props with `href` always set, the tab's class (`cap-tab`) and `aria-current="page"` already on it, and the count inside; the app returns its router's `<Link to={props.href} {...props} />`. The tab keeps its look, its count and its current state, and a click navigates in the app with no page load, the router's way. Without `renderLink` a `TabLink` is a plain `<a>`, as before. Same shape as the shell's `renderLink`.

## The shadcn component it matches

Tabs (`tabs.tsx`: Tabs, TabsList, TabsTrigger, TabsContent), Base UI flavor, nova style. Matched: the default muted tray with the chosen tab raised, the `line` variant, horizontal and vertical, the sizes of the list, `fill`. Different on purpose: the chosen tab has an edge, not only a fill; the list scrolls; panels are always in the HTML; a links form exists; a count has its own part.

## Keyboard

Panels:

| Key | Does |
| --- | --- |
| Tab | Enters the list on the chosen tab, then moves on to the panel |
| Right arrow, Left arrow | Moves to the next or previous tab and, with automatic activation, chooses it. At the ends it wraps. Down and Up in a vertical list. In a right-to-left page the arrows swap |
| Home, End | First or last tab |
| Enter, Space | Chooses the focused tab (manual activation) |

A disabled tab is skipped by every key above. Progressive tabs and the pill take the same keys. The pill's drag is for a pointer only and is never the only way to choose.

Links (and page tabs):

| Key | Does |
| --- | --- |
| Tab | Each link is a tab stop |
| Enter | Follows the link |

## Accessibility

- Panels: `role="tablist"` named by `aria-label`, `role="tab"` with `aria-selected` and `aria-controls`, `role="tabpanel"` with `aria-labelledby`. A roving `tabindex`: the chosen tab is 0, the rest -1. A vertical list also has `aria-orientation="vertical"`. A panel has `tabindex="0"`, so a person who tabs past the list lands on its content even when it holds nothing focusable.
- Links: a `nav` named by `aria-label`, the current link `aria-current="page"`. No tab roles: they are links.
- Progressive: before script, links to the panels (in-page links, each panel under its own visible name); after, the full tab roles above, the list named by its `data-label` (or `aria-label`). The links keep their `href`; a click chooses the tab and does not jump the page.
- Pill: the drag is a pointer's extra (WCAG 2.5.7): a click and the arrow keys choose every tab. The chosen tab is still marked by its edge and weight, not by the tone alone.
- A disabled tab has `aria-disabled="true"`. It is not removed from the page.
- Contrast: tab text 4.5:1 on the tray and on the raised tab; the chosen tab's edge and the line variant's rule 3:1.
- Hit areas are at least `var(--target)`; forced colors draw the chosen tab in Highlight.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

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

A panel is usually a child of `.cap-tabs`; a layout may wrap the panels (a column of notes beside them), so long as no tab set nested inside holds them.

Progressive and remembered (the server's HTML; `enhance()` adds the roles, `tabindex`, `aria-selected` and `hidden`):

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

The pill: `data-variant="pill"` on the list, `data-tone` on a tab. A site's look: `--cap-tabs-tray` (the tray's background, a gradient is fine), `--cap-tab-mark` (the pill's fill, a color: a tone is mixed into it), `--cap-tab-mark-edge`, `--cap-tab-mark-shadow`, set on the list or above it.

Attributes: on `.cap-tabs` `data-orientation="vertical"`, `data-activation="manual"`, `data-sync="hash"`, `data-progressive`, `data-remember="<key>"`, `data-remember-guess="platform"`; on `.cap-tabs-list` `data-variant="line|pill"`, `data-size="sm|lg"`, `data-fill`, `data-label`; on `.cap-tab` `data-value`, `data-tone`. `import { enhance, select, nextTab, upgrade, attachPillDrag, readRemembered, writeRemembered, onRemembered, guessPlatform, tabParam, pageTabHref } from "capsomer/behavior/tabs"`: `enhance()` attaches every `[data-cap="tabs"]`; `select(root, tab)` chooses one from script. A choice fires `cap:tabs-change` (bubbles; `detail.tab`, `detail.panel`). The storage is `localStorage["capsomer.tabs.<key>"]`, in try/catch, with a page-long memory where storage is refused, through `readStored`, `writeStored` and `subscribeStored` from `capsomer/behavior/hooks`.

In React, `import { Tabs, TabsList, TabsTrigger, TabsContent, TabsNav, TabLink, PageTabs } from "capsomer/react/tabs"`:

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

Remembered, a pill, and page tabs in React:

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

`Tabs` reads a remembered choice after hydration, so the server's tab paints first and the reader's follows.

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
- Every panel is in the HTML, the inactive ones `hidden`. Once enhanced, where the browser has it (Chrome, Edge, Firefox 148; not Safari), an inactive panel becomes `hidden="until-found"`: find-in-page and text-fragment links reach its text, and a match chooses its tab. It leaves the Tab order while hidden. A disabled tab's panel stays plainly `hidden`.
- A links form with `aria-current="page"` shares the look, because a status filter is a URL.
- A disabled tab is struck through, not dimmed.

## Exceptions in production

None yet.
