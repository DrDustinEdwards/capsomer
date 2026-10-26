---
name: admin-shell
title: Admin shell
summary: The one structure every admin area and dashboard shares, under the site header: in your admin a strip of the family's apps and a 232px menu, in a user's dashboard a 288px menu, then the content.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [expanded, current app tile, badge on another app, menu collapsed to icons, collapsed name shown, name shown, account menu open, user variant, user variant collapsed, reading column, comfortable density, page transitions, phone tab bar, phone sheet, phone count past 99]
added: 0.4.0
updated: 0.9.0
source: Dustin's pick of 2026-10-06 (capsomer/research/admin-shell-findings.md); the flagship design canvas "Flagship Shell: Capsid Portal"; the Portal's own App.tsx
replaces:
  - 'class="(app|rail|tabbar)"'
  - "className=\"(app|rail|tabbar)"
---

# Admin shell

One structure in every admin area and dashboard, so nothing structural moves when a person moves between them: the **site header** across the top (components/site-header, 56px, the same header the site's public pages use), then, under it, the **strip** (your admin only), the **menu**, and the **content**. Only the contents change with the audience. It is built once, here, and each app calls it; no app writes its own shell.

Two variants (0.9.0, Dustin's answers of 2026-10-13):

- **`variant="owner"`, your admin** (the default): a 56px strip of the family's app tiles and their badges, then the 232px menu. Search and the inbox sit at the header's right; Help is in the avatar's menu; the header has no switcher, because the strip is the app switcher.
- **`variant="user"`, a customer's dashboard or a reader's area**: no strip, a 288px menu, the business and product switchers in the header. The content starts at the same x in both (56 + 232 = 288).

`Shell` (components/shell) stays as the older top bar and rail; the Portal and every admin area take this one.

## When to use it

An app, an admin area or a dashboard a person moves around in. A public page uses the site header alone. A single-view tool needs neither.

## What goes where

| Place | Your admin (`owner`) | A customer's dashboard (`user`) | A reader's area (`user`) |
| --- | --- | --- | --- |
| Header, left | The app's logo | The site's logo, the business tile, the product | The site's logo |
| Header, right | Search, Inbox, the theme, the avatar | The site's extras, the theme, the avatar | The theme, the avatar |
| Strip | The family's apps (`FAMILY_APPS`), each its own mark, this one marked, others with a badge when they need you | none | none |
| Menu | The collapse control, then the app's sections, grouped (232px) | The dashboard's sections (288px) | The site's sections (288px) |
| Top bar | How fresh the page is, Refresh | The same | The page |
| Content | The page | The page | A centered reading column (`data-measure="reading"`) |

The theme is the header's one icon button, not a switch in the top bar (0.9.0).

## The default and its reason

- **In your admin the strip is always shown, one width (`--rail-w-collapsed`), and holds only app tiles and their badges.** Hiding the app switcher cost Slack its multi-workspace users, because the other workspaces' badges disappeared. The strip is the only way another app's "needs you" stays visible.
- **One strip, the same on every app, configured once here.** `FAMILY_APPS` (`apps.tsx`) lists Capsid Portal, Carrel Desk, dustinedwards.info, germomics, Foxhound, Foxing and Capsomer, in that order (Foxing's tile is a placeholder fox until its mark is drawn), each with its product's own mark redrawn in `currentColor` (never a letter). An app passes `app="carrel"`; the shell marks it and takes the header's logo and the tab title from it; Capsomer's own site passes `app="capsomer"`, so every site marks the app you are in. Other apps' badges come in `badges`, keyed by app. A site outside the family (a public site's one-app strip) passes `apps` and `title` instead. Foxhound keeps the x from its favicon, which reads as close or delete, until Dustin picks; `FOXHOUND_MARKS` offers two alternatives (a paw print, a fox's head), shown beside the x on the states page, and none is shipped.
- **Tiles are neutral and carry the product's mark.** A mark drawn in `currentColor` takes the tile's color (accent text on a neutral tile, the pill's text on the current one).
- **The menu has no title.** The header's logo names the app, so the menu starts with its collapse control and then its groups (0.9.0).
- **The menu is 232px wide open (`--admin-menu-open`, the shared `--rail-w` plus as much as the collapsed column adds to the strip, so its labels keep one line) and collapsible; collapsed it is an icon column (`--admin-menu-collapsed`, 80px, a step wider than the strip, so each icon has room for its count) beside the strip.** Nothing moves: every icon keeps its x and y, and the current row its height and left edge, open and collapsed (one row inset, `--admin-row-pad`, puts each 16px icon in the middle of the collapsed column). Labels and group headings hide but keep their boxes (and their names for a screen reader); a group heading is a short band open and the same band holding a thin divider collapsed, so the groups are one even step apart in both states. Each icon names itself in a tooltip on hover and keyboard focus and keeps its accessible name; the current page keeps its dark fill. A hovered item has a fill a clear step off the menu and an edge at 3:1, in both themes. The collapsed column does not scroll. The collapse control is the menu's first row, "Collapse menu" with its key `[` as a key cap, the same place in both variants and both states; collapsed its words and key hide and its tooltip names it. The choice is remembered per site (`localStorage`, key `cap-rail` or `data-cap-pref`). The app binds `[` itself, because single-key shortcuts are the app's setting.
- **The strip and the menu are two rails.** The strip is a shade apart from the menu in both themes (`--admin-strip-bg`, darker in light, lighter in dark), so collapsed they never read as one column.
- **One tooltip, everywhere.** Every shown name, a strip control's with the menu open or collapsed, a collapsed menu icon's, Refresh's, is Capsomer's tooltip (the shared popover's tooltip variant): in the top layer, so it is above every panel, tile and badge and fully opaque; a raised surface with a visible edge, unlike the selected item's fill in either theme; keys as key caps (`G` `2`). It waits 300 ms on hover, shows at once on keyboard focus, and Esc, a press or using the control hides it. A strip tooltip starts past the strip's edge, so it never covers its control, the control's badge or the controls above and below it. The tests check every corner of every name, its opacity and one look for all of them.
- **No badge on the app you are in.** Strip badges are for other apps. Each "needs you" fact appears on a page once as a number and once as an action, not five times.
- **Every count and badge is one bubble**: one size, one shape, one type, in the strip, the menu and the sheet, open and collapsed, and the same number everywhere, `99+` past 99 (the accessible name keeps the real count). A plain count is a gray bubble (`--muted`, its number in `--ground`) at 3:1 against the menu; violet needs you; red and amber (`crit`, `warn`) are status colors. On an icon every bubble is in one place relative to its glyph: its left edge 2px past the glyph's right edge, its middle on the glyph's top edge, so neither it nor its ring covers the glyph, and in the menu it stays inside the column, never across into the content. **One rule for unread markers: always a number**, how many things need you; a state with nothing to count (one failing check) is 1. There are no dots.
- **The current page is a dark filled pill in the palette's darkest accent step (`--accent-12`)**, here and on Capsomer's own site. The current app's tile is the same dark fill. Color means something: violet marks the current selection, the primary action and "needs you"; nothing else is colored for decoration.
- **One avatar, in the header, last.** The account is the owner's: "DE" for Dustin Edwards (`OWNER`), unless `account` names someone else.
- **One top bar, the same places on every app.** Left: the trail, only on a page below the top level ("Components / Shell"; `trail` and `page`), so it never repeats a page's heading; then the one freshness line every app shows, "Updated 6 minutes ago" (`updated: { at, auto }`, "· refreshes itself" when `auto`); then anything else true of the page (`status`). Right: the page-wide controls (`actions`), then Refresh where the page refreshes (`onRefresh`, `refreshing`). The theme is no longer here: since 0.9.0 it is the header's one icon button (theme-switch's button form), whose name says what it does ("Switch to dark theme"), Light and Dark only (Dustin's answer 2 of 2026-10-13, replacing the switch ruled in PR #13).
- **The tab title is "<page> · <app>"**, set by the shell from `page` and the app's name. An app whose routes set their own titles passes `documentTitle={false}` and the shell never writes `document.title`; the app's name still heads the logo and the phone sheet.
- **The first page is called "Overview"** (`FIRST_PAGE`) in every app: it says what the page is, a summary of the app, and holds whether or not anything needs you. "Needs you" is the Inbox's job across apps; "Home" says where, not what; "Dashboard" is a kind of screen, not its content.
- **The content fills the space to the menu's right**, from the same left edge, open and collapsed, up to 1480px; an app does not center its own narrower column inside it. A reading page opts into the centered column with `data-measure="reading"`.
- **Icons carry the controls**, one family (24 box, 1.6 stroke), every icon button one size with an accessible name and a tooltip. A tooltip is a child of its control, shows on hover and keyboard focus, and Esc hides it (WCAG 1.4.13).
- **The account menu is the header's** (site-header's disclosure panel), opened from the avatar. Sections: who you are; this app's rows under its name (`appLinks`, `appLabel`); View site (`viewSite`) and Help and shortcuts (`onHelp`); Sign out last. The other apps are the strip's, so the menu no longer lists them.
- **G then a number opens the app in that place** (Slack's lesson; the sequence GitHub and Linear use, because Ctrl and a digit belong to the browser's tabs). It does nothing while a person types in a field, never opens the app already open, and an app that lets single keys be switched off passes that setting as `jumpKeys`.
- **The top bar says what is true**: "Updated 6 minutes ago · refreshes itself", never "Live" for data that is minutes old. Page-wide controls (time range, scope, export) go there only on pages whose data actually changes with them.
- **All content is in the server-rendered HTML.** Every menu link, the strip's links and the page are in the markup without a script, so a screen reader or an agent reads them. The shell's behavior (collapse, remembering it, the header's panels and sheet) is added by script; nothing depends on it for reading or reaching a page.
- **On a phone (under 768px) the strip and the menu live in the header's one sheet.** The header is one row: the logo, Search and Inbox (your admin), the theme, the avatar, and the menu button last. The menu button opens the shared dialog as a bottom sheet: the apps first (your admin), the switchers (a dashboard), then every page grouped as the menu groups them; the account rows (this app's rows, View site, Help, Sign out) are pinned under the scrolling list so Sign out is always in view. Every row starts its label in one column, with an icon or without. Opening the sheet puts focus on its heading (`tabindex="-1"`, no ring on a row until a key is pressed). The bottom bar (`SiteTabs`) holds up to five of the app's top pages and no More, because the menu button opens the full list (Dustin's answer 5). The current tab is told by an accent pill behind its icon as well as its color, a tab badge reads `99+` past 99 (the accessible name keeps the real count), and tab labels are 12px.

## Page transitions

An option: `transition` in React, `data-transition="page"` on the shell in markup. When a page changes, the content area cross-fades (the old page out over `--dur-fast`, the new in over `--dur-base`) while the header, the strip, the menu and the phone bar stay exactly where they are: each is given its own `view-transition-name`, so the browser snapshots them apart and, unchanged, they never move.

- **Same-document (an app with a router).** Wrap the update that shows the next page: `startPageTransition(() => flushSync(() => navigate(to)))` (`capsomer/behavior/admin-shell`, also exported from `capsomer/react/admin-shell`). It resolves when the page is shown, and runs the update at once, with no animation and no error, when the browser has no `document.startViewTransition`, when the person asked for reduced motion, or when the shell has not opted in. Focus and scroll are the app's, as without it.
- **Cross-document (pages that load).** The app adds `@view-transition { navigation: auto; }` to its own stylesheet (it is a page-wide rule, so the shell cannot scope it) and `data-transition="page"` to the shell; the same names and animation apply. Browsers without it navigate as usual.
- **Reduced motion turns it off.** Under `prefers-reduced-motion: reduce` the names are not given, the animation is not defined and `startPageTransition` skips the API: the page changes at once.
- **Why a cross-fade and nothing moves.** Motion on a navigation is easy to overdo; a short fade shows that the content changed without hiding the structure that did not. The duration is the tokens' (`--dur-fast`, `--dur-base`), not the shell's own.

## Props

| Prop | Is |
| --- | --- |
| `variant` | `"owner"` (default: the strip and the 232px menu) or `"user"` (no strip, the 288px menu) |
| `app` | Which family app this is (`portal`, `carrel`, `info`, `germomics`, `foxhound`, `foxing`, `capsomer`): the strip marks it, the header's logo and the tab title are its |
| `badges` | Other apps' badges, by app: `count`, `countNote` |
| `page`, `trail` | The page's name (the tab title, and the trail's last step) and the levels above it (the trail, shown only when given) |
| `documentTitle` | `true` (default): the shell writes the tab title "<page> · <app>". `false`: it leaves `document.title` to the app's routes |
| `nav` | The menu: entries with `group`, `icon`, `count`, `countNote`, `tone`, `current` |
| `tabs` | The phone's bottom bar, up to five; default the first five of `nav` |
| `logo`, `band`, `translucent`, `switchers`, `extras` | The header's slots (site-header): a logo other than the app's, the band, the business and product switchers (`user`), the site's own extras |
| `onSearch`, `inbox` | Search and the inbox, at the header's right; each shows only when given |
| `onHelp`, `viewSite` | Help and shortcuts, and View site, in the avatar's menu |
| `account` | The avatar's menu: `role`, `email`, `appLinks`, `appLabel`, `onSignOut`; `name` and `initials` default to the owner's |
| `themePrefKey`, `themeKey` | The header's theme button: where the choice is remembered, and its single key |
| `updated`, `status`, `actions`, `onRefresh`, `refreshing`, `refreshShortcut` | The top bar |
| `renderLink` | A router's link; other apps' links stay plain anchors where the router cannot reach them |
| `collapsed`, `onCollapsedChange`, `prefKey`, `jumpKeys`, `collapseKey` | Collapse state and keys |
| `transition` | Page transitions (above); off by default |
| `title`, `apps` | Only outside the family: the app's own name, and a strip of other apps |

Badge data is a prop: Capsid supplies it, one question per app ("what needs Dustin"), not each app querying the others.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The skip link, the header (logo, switchers, Search, Inbox, the theme, the avatar), the strip's apps, the menu (the collapse control first), the main region |
| Enter or Space on the collapse control | Collapses or expands the menu |
| Esc | Hides a shown name; closes the account menu and returns focus to the avatar; closes the sheet and returns focus to the menu button |
| G, then 1 to 9 | Opens the app in that place |
| Enter or Space on the avatar | Opens the account menu; focus moves to its first item, Up and Down move between items |
| Any link, with transitions on | Moves to the page as without them; the transition does not move focus |
| `[` | Collapses or expands the menu, when the app binds it |

## Accessibility

- The header is the `banner`. The strip, the menu and the phone bar are navigation landmarks with their own names ("Apps", "Sections"); the menu and the bar are never displayed together.
- Every strip control has an accessible name that contains what it shows; a badge says what it counts in the name ("Carrel Desk, 2 AI drafts waiting").
- Names of the current app and page are `aria-current` (`true` on the tile, `page` on the menu link), and not conveyed by color alone (a dark fill, plus an outline in forced colors).
- Menu text, counts and the pill reach their contrast in both themes; the tests measure the painted colors.

## Markup

```html
<div class="cap-admin" data-cap="admin-shell" data-variant="owner">
  [the site header: components/site-header's markup, with Search, Inbox, the theme button and the avatar]
  <nav class="cap-admin-strip" aria-label="Apps">
    <ul class="cap-admin-strip-group">
      <li><a class="cap-admin-tile" href="https://portal.dustinedwards.info/" aria-current="true"><svg class="cap-admin-logo">[the app's mark]</svg>[tip]</a></li>
      <li><a class="cap-admin-tile" href="https://desk.dustinedwards.info/" aria-label="Carrel Desk, 2 need you"><svg class="cap-admin-logo">…</svg><span class="cap-admin-badge" aria-hidden="true">2</span>[tip]</a></li>
      [dustinedwards.info, germomics, Foxhound, Foxing, Capsomer, in that order]
    </ul>
  </nav>
  <nav class="cap-admin-menu" id="cap-admin-menu" aria-label="Sections">
    <button type="button" class="cap-admin-collapse" data-cap-part="menu-toggle" aria-label="Collapse menu" aria-expanded="true" aria-controls="cap-admin-menu">[icon]<span class="cap-admin-label">Collapse menu</span><span class="cap-keys"><kbd>[</kbd></span><span class="cap-admin-tip cap-popover" data-variant="tooltip" data-side="right" data-offset="12" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-admin-tip-text">Collapse menu</span></span></button>
    <div class="cap-admin-group" role="group" aria-labelledby="g-watch">
      <div class="cap-admin-group-label" id="g-watch">Watch</div>
      <a href="/" aria-current="page">[icon]<span>Overview</span> <span class="cap-admin-count"></span></a>
      <a href="/queue" aria-label="Queue, 5 blocked">[icon]<span class="cap-admin-label">Queue</span> <span class="cap-admin-count" data-tone="need">5</span><span class="cap-admin-tip cap-popover" data-variant="tooltip" data-side="right" data-offset="12" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-admin-tip-text">Queue</span></span></a>
    </div>
  </nav>
  <main class="cap-admin-main" id="cap-main" tabindex="-1">
    <div class="cap-admin-bar">
      <div class="cap-admin-bar-text"><nav class="cap-admin-trail" aria-label="Breadcrumb"><ol><li><a href="/components">Components</a></li><li><span aria-current="page">Shell</span></li></ol></nav>[below the top level only]<span class="cap-admin-fresh">Updated <time datetime="…">6 minutes ago</time> · refreshes itself</span><div class="cap-admin-bar-status">[status]</div></div>
      <div class="cap-admin-actions">[actions]<button type="button" class="cap-admin-btn" data-cap-part="refresh" aria-label="Refresh">[icon][tip]</button></div>
    </div>
    <div class="cap-admin-page">[the view]</div>
  </main>
  <nav class="cap-site-tabs" aria-label="Sections">[up to five links]</nav>
</div>
```

`import { enhance, toggleMenu, jumpTarget } from "capsomer/behavior/admin-shell"` wires the collapse control, the remembered choice and the keys for markup written by hand, and calls site-header's `enhance` for the header's panels and sheet. Load `admin-shell.css` with `site-header.css`, `theme-switch.css`, `dialog.css` and `popover.css`. `data-variant="user"` drops the strip and widens the menu to 288px. In React, `import { AdminShell, FIRST_PAGE } from "capsomer/react/admin-shell"` and `<AdminShell app="carrel" page={FIRST_PAGE} nav={…} badges={…} onRefresh={…}>`; `FAMILY_APPS` and `OWNER` are exported from the same module.

## Density

Capsomer's default stays: compact, `data-density="comfortable"` on the shell or on `<html>` for roomier rows. Row heights and paddings come from `--control`, `--target` and `--pad-card`.

## Deliberately different

- **Dark fill for the current item**, not the soft accent tint the older Shell uses: the current page must be unmistakable at a glance.
- **The top bar sits in the content, not across the window.** The header across the window holds the tools; the strip holds the app switcher; the bar holds only what is true of this page.
- **Another app's link is a plain anchor**, even where a router is in use, since another app is another origin.

## Exceptions in production

None yet.
