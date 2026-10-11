---
name: admin-shell
title: Admin shell
summary: The one structure every admin area, dashboard and site shares: a strip of apps and tools, a grouped menu for the current app, then the content.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [expanded, current app tile, badge on another app, menu collapsed to icons, collapsed name shown, name shown, account panel open, reading column, comfortable density, page transitions, phone tab bar, phone sheet, phone count past 99]
added: 0.4.0
source: Dustin's pick of 2026-10-06 (capsomer/research/admin-shell-findings.md); the flagship design canvas "Flagship Shell: Capsid Portal"; the Portal's own App.tsx
replaces:
  - 'class="(app|rail|tabbar)"'
  - "className=\"(app|rail|tabbar)"
---

# Admin shell

One structure in every app, admin area, dashboard and public site, so nothing structural moves when a person moves between them: the **strip** (far left, one fixed width), the **menu** beside it (one fixed width), then the **content**. Only the contents change with the audience. It is built once, here, and each app calls it; no app writes its own shell.

`Shell` (components/shell) stays as the older top bar and rail; the Portal and every admin area take this one.

## When to use it

An app, an admin area or a dashboard a person moves around in, and, with a one-app strip, a public site whose sections are the menu. A single-view tool needs neither.

## What goes where

| Place | The owner | A reader of a public site | A merchant |
| --- | --- | --- | --- |
| Strip, top | The family's admin apps (`FAMILY_APPS`), each its own logo, this one marked, others with a badge when they need you | The site's logo | Their stores, with badges, if more than one |
| Strip, bottom | Search, Inbox, Help, avatar | Search, theme, subscribe | Inbox, Help, avatar |
| Menu | The current app's sections, grouped | The site's sections | The dashboard's sections |
| Top bar | The page, how fresh it is, Refresh, the theme | The page, the theme | The page, the theme |
| Content | The page | A centred reading column (`data-measure="reading"`) | The page |

The strip is never an empty column: its bottom tools serve everyone.

## The default and its reason

- **The strip is always shown, one width (`--rail-w-collapsed`).** Hiding the app switcher cost Slack its multi-workspace users, because the other workspaces' badges disappeared. The strip is the only way another app's "needs you" stays visible.
- **One strip, the same on every app, configured once here.** `FAMILY_APPS` (`apps.tsx`) lists Capsid Portal, Carrel, dustinedwards.info, germomics, Foxhound and Capsomer, in that order, each with its product's own mark redrawn in `currentColor` (never a letter). An app passes `app="carrel"`; the shell marks it and takes the menu's title from it; Capsomer's own site passes `app="capsomer"`, so every site marks the app you are in. Other apps' badges come in `badges`, keyed by app. A site outside the family (a public site's one-app strip) passes `apps` and `title` instead. Foxhound's favicon is an x, which reads as close or delete; its mark is one of `FOXHOUND_MARKS` (a paw print, a fox's head, a recovery arrow) until Dustin picks.
- **Tiles are neutral and carry the product's mark.** A mark drawn in `currentColor` takes the tile's color (accent text on a neutral tile, the pill's text on the current one).
- **The menu's title is the app's name, in one style, and nothing else.** Open, the logo is the marked tile in the strip beside it, so the mark is never shown twice (Dustin, 2026-10-11). Collapsed, the name hides and the column shows the app's mark at its top, over the icons, so the column still says which app it is.
- **The menu is `--rail-w` wide, collapsible; collapsed it is an icon column (`--admin-menu-collapsed`, 80px, a step wider than the strip, so each icon has room for its count) beside the strip.** Nothing moves: every icon keeps its x and y, and the current row its height and left edge, open and collapsed (one row inset, `--admin-row-pad`, puts each 16px icon in the middle of the collapsed column). Labels and group headings hide but keep their boxes (and their names for a screen reader); a group heading is a short band open and the same band holding a thin divider collapsed, so the groups are one even step apart in both states. Each icon names itself in a tooltip on hover and keyboard focus and keeps its accessible name; the current page keeps its dark fill. A hovered item has a fill a clear step off the menu and an edge at 3:1, in both themes. The collapsed column does not scroll. The collapse control is the first thing in the strip, the same place in every app and in both states, with its key `[` in its tooltip. The choice is remembered per site (`localStorage`, key `cap-rail` or `data-cap-pref`). The app binds `[` itself, because single-key shortcuts are the app's setting.
- **The strip and the menu are two rails.** The strip is a shade apart from the menu in both themes (`--admin-strip-bg`, darker in light, lighter in dark), so collapsed they never read as one column.
- **One tooltip, everywhere.** Every shown name, a strip control's with the menu open or collapsed, a collapsed menu icon's, Refresh's, is Capsomer's tooltip (the shared popover's tooltip variant): in the top layer, so it is above every panel, tile and badge and fully opaque; a raised surface with a visible edge, unlike the selected item's fill in either theme; keys as key caps (`G` `2`). It waits 300 ms on hover, shows at once on keyboard focus, and Esc, a press or using the control hides it. A strip tooltip starts past the strip's edge, so it never covers its control, the control's badge or the controls above and below it. The tests check every corner of every name, its opacity and one look for all of them.
- **No badge on the app you are in.** Strip badges are for other apps. Each "needs you" fact appears on a page once as a number and once as an action, not five times.
- **Every count and badge is one bubble**: one size, one shape, one type, in the strip, the menu and the sheet, open and collapsed, and the same number everywhere, `99+` past 99 (the accessible name keeps the real count). A plain count is a grey bubble (`--muted`, its number in `--ground`) at 3:1 against the menu; violet needs you; red and amber (`crit`, `warn`) are status colors. On an icon every bubble is in one place relative to its glyph: its left edge 2px past the glyph's right edge, its middle on the glyph's top edge, so neither it nor its ring covers the glyph, and in the menu it stays inside the column, never across into the content. **One rule for unread markers: always a number**, how many things need you; a state with nothing to count (one failing check) is 1. There are no dots.
- **The current page is a dark filled pill in the palette's darkest accent step (`--accent-12`)**, here and on Capsomer's own site. The current app's tile is the same dark fill. Color means something: violet marks the current selection, the primary action and "needs you"; nothing else is colored for decoration.
- **One avatar.** The account is the owner's: "DE" for Dustin Edwards (`OWNER`), unless `account` names someone else.
- **One top bar, the same places on every app.** Left: the trail, only on a page below the top level ("Components / Shell"; `trail` and `page`), so it never repeats a page's heading; then the one freshness line every app shows, "Updated 6 minutes ago" (`updated: { at, auto }`, "· refreshes itself" when `auto`); then anything else true of the page (`status`). Right: the page-wide controls (`actions`), Refresh where the page refreshes (`onRefresh`, `refreshing`), then the theme switch, always last. The theme control is the Light and Dark switch (`theme-switch`), not an icon button: it names both choices in words, so nobody has to guess whether a sun means "is light" or "make it light", and it is the control Dustin ruled for (PR #13, 2026-10-01). Its chosen choice has one marker, the selected-item fill. On a phone its words hide and the icons stay.
- **The tab title is "<page> · <app>"**, set by the shell from `page` and the app's name.
- **The first page is called "Overview"** (`FIRST_PAGE`) in every app: it says what the page is, a summary of the app, and holds whether or not anything needs you. "Needs you" is the Inbox's job across apps; "Home" says where, not what; "Dashboard" is a kind of screen, not its content.
- **The content fills the space to the menu's right**, from the same left edge, open and collapsed, up to 1480px; an app does not centre its own narrower column inside it. A reading page opts into the centred column with `data-measure="reading"`.
- **Icons carry the controls**, one family (24 box, 1.6 stroke), every icon button one size with an accessible name and a tooltip. A tooltip is a child of its control, shows on hover and keyboard focus, and Esc hides it (WCAG 1.4.13).
- **The account panel is the Popover API** (light dismiss, Esc, focus handed back by the platform), opened from the avatar. Sections: who you are, this app (settings, view site), elsewhere (the other apps, listed from `apps`), sign out last.
- **G then a number opens the app in that place** (Slack's lesson; the sequence GitHub and Linear use, because Ctrl and a digit belong to the browser's tabs). It does nothing while a person types in a field, never opens the app already open, and an app that lets single keys be switched off passes that setting as `jumpKeys`.
- **The top bar says what is true**: "Updated 6 minutes ago · refreshes itself", never "Live" for data that is minutes old. Page-wide controls (time range, scope, export) go there only on pages whose data actually changes with them.
- **All content is in the server-rendered HTML.** Every menu link, the strip's links and the page are in the markup without a script, so a screen reader or an agent reads them. The shell's behaviour (collapse, remembering it, the account panel's close, the sheet) is added by script; nothing depends on it for reading or reaching a page.
- **On a phone the strip and the menu live in one sheet.** The tab bar holds at most four of the app's top pages and More (rulings, rule 9). More opens the shared dialog as a bottom sheet: the apps first, then the other pages, then the tools; the account rows (settings, shortcuts, Sign out) are pinned under the scrolling list so Sign out is always in view. Every row starts its label in one column, with an icon or without. Opening the sheet puts focus on its heading (`tabindex="-1"`, no ring on a row until a key is pressed). The current tab is told by an accent pill behind its icon as well as its colour, a tab badge reads `99+` past 99 (the accessible name keeps the real count), tab labels are 12px, and on a phone the thin bar names the current app at the left.

## Page transitions

An option: `transition` in React, `data-transition="page"` on the shell in markup. When a page changes, the content area cross-fades (the old page out over `--dur-fast`, the new in over `--dur-base`) while the strip, the menu and the phone bar stay exactly where they are: each is given its own `view-transition-name`, so the browser snapshots them apart and, unchanged, they never move.

- **Same-document (an app with a router).** Wrap the update that shows the next page: `startPageTransition(() => flushSync(() => navigate(to)))` (`capsomer/behaviour/admin-shell`, also exported from `capsomer/react/admin-shell`). It resolves when the page is shown, and runs the update at once, with no animation and no error, when the browser has no `document.startViewTransition`, when the person asked for reduced motion, or when the shell has not opted in. Focus and scroll are the app's, as without it.
- **Cross-document (pages that load).** The app adds `@view-transition { navigation: auto; }` to its own stylesheet (it is a page-wide rule, so the shell cannot scope it) and `data-transition="page"` to the shell; the same names and animation apply. Browsers without it navigate as usual.
- **Reduced motion turns it off.** Under `prefers-reduced-motion: reduce` the names are not given, the animation is not defined and `startPageTransition` skips the API: the page changes at once.
- **Why a cross-fade and nothing moves.** Motion on a navigation is easy to overdo; a short fade shows that the content changed without hiding the structure that did not. The duration is the tokens' (`--dur-fast`, `--dur-base`), not the shell's own.

## Props

| Prop | Is |
| --- | --- |
| `app` | Which family app this is (`portal`, `carrel`, `info`, `germomics`, `foxhound`): the strip marks it, the menu's title is its name |
| `badges` | Other apps' badges, by app: `count`, `countNote` |
| `page`, `trail` | The page's name (the tab title, and the trail's last step) and the levels above it (the trail, shown only when given) |
| `nav` | The menu: entries with `group`, `icon`, `count`, `countNote`, `tone`, `current` |
| `tabs`, `more` | The phone's bar and what sits under More; default the first four and the rest |
| `onSearch`, `inbox`, `onHelp` | The strip's tools; each shows only when given |
| `account` | The avatar's panel: `role`, `email`, `appLinks`, `onSignOut`; `name` and `initials` default to the owner's |
| `updated`, `status`, `actions`, `onRefresh`, `refreshing`, `refreshShortcut`, `themePrefKey` | The top bar |
| `renderLink` | A router's link; other apps' links stay plain anchors where the router cannot reach them |
| `collapsed`, `onCollapsedChange`, `prefKey`, `jumpKeys`, `collapseKey` | Collapse state and keys |
| `transition` | Page transitions (above); off by default |
| `title`, `apps` | Only outside the family: a public site's own title and one-app strip |

Badge data is a prop: Capsid supplies it, one question per app ("what needs Dustin"), not each app querying the others.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The skip link, the strip (collapse, apps, tools, avatar), the menu, the main region |
| Enter or Space on the collapse control | Collapses or expands the menu |
| Esc | Hides a shown name; closes the account panel; closes the sheet |
| G, then 1 to 9 | Opens the app in that place |
| Enter on the avatar | Opens the account panel; focus stays on the avatar, the panel follows in tab order |
| Any link, with transitions on | Moves to the page as without them; the transition does not move focus |
| `[` | Collapses or expands the menu, when the app binds it |

## Accessibility

- The strip, the menu and the phone bar are navigation landmarks with their own names ("Apps and tools", "Sections"); the menu and the bar are never displayed together.
- Every strip control has an accessible name that contains what it shows; a badge says what it counts in the name ("Carrel, 2 AI drafts waiting").
- Names of the current app and page are `aria-current` (`true` on the tile, `page` on the menu link), and not conveyed by colour alone (a dark fill, plus an outline in forced colours).
- Menu text, counts and the pill reach their contrast in both themes; the tests measure the painted colours.

## Markup

```html
<div class="cap-admin" data-cap="admin-shell">
  <a class="cap-admin-skip" href="#cap-main">Skip to content</a>
  <nav class="cap-admin-strip" aria-label="Apps and tools">
    <ul class="cap-admin-strip-group">
      <li><button type="button" class="cap-admin-btn" data-cap-part="menu-toggle" aria-label="Collapse menu" aria-expanded="true" aria-controls="cap-admin-menu">[icon]<span class="cap-admin-tip cap-popover" data-variant="tooltip" data-side="right" data-offset="20" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-admin-tip-text">Collapse menu</span><span class="cap-keys"><kbd>[</kbd></span></span></button></li>
      <li><a class="cap-admin-tile" href="https://portal.dustinedwards.info/" aria-current="true"><svg class="cap-admin-logo">[the app's mark]</svg>[tip]</a></li>
      <li><a class="cap-admin-tile" href="https://carrel.dustinedwards.info/" aria-label="Carrel, 2 need you"><svg class="cap-admin-logo">…</svg><span class="cap-admin-badge" aria-hidden="true">2</span>[tip]</a></li>
      [dustinedwards.info, germomics, Foxhound, in that order]
    </ul>
    <ul class="cap-admin-strip-group"> [search] [inbox] [help] [avatar and its popover] </ul>
  </nav>
  <nav class="cap-admin-menu" id="cap-admin-menu" aria-label="Sections">
    <div class="cap-admin-title"><span class="cap-admin-title-mark" aria-hidden="true">[the app's mark, collapsed only]</span><span class="cap-admin-title-text">Capsid Portal</span></div>
    <div class="cap-admin-group" role="group" aria-labelledby="g-watch">
      <div class="cap-admin-group-label" id="g-watch">Watch</div>
      <a href="/" aria-current="page">[icon]<span>Overview</span><span class="cap-admin-count"></span></a>
      <a href="/queue" aria-label="Queue, 5 blocked">[icon]<span class="cap-admin-label">Queue</span><span class="cap-admin-count" data-tone="need">5</span><span class="cap-admin-tip cap-popover" data-variant="tooltip" data-side="right" data-offset="12" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-admin-tip-text">Queue</span></span></a>
    </div>
  </nav>
  <main class="cap-admin-main" id="cap-main" tabindex="-1">
    <div class="cap-admin-bar">
      <div class="cap-admin-bar-text"><strong class="cap-admin-bar-app">[app name, phone only]</strong><nav class="cap-admin-trail" aria-label="Breadcrumb"><ol><li><a href="/components">Components</a></li><li><span aria-current="page">Shell</span></li></ol></nav>[below the top level only]<span class="cap-admin-fresh">Updated <time datetime="…">6 minutes ago</time> · refreshes itself</span><div class="cap-admin-bar-status">[status]</div></div>
      <div class="cap-admin-actions">[actions]<button type="button" class="cap-admin-btn" data-cap-part="refresh" aria-label="Refresh">[icon][tip]</button>[theme-switch fieldset]</div>
    </div>
    <div class="cap-admin-page">[the view]</div>
  </main>
  <nav class="cap-admin-tabs" aria-label="Sections"> [up to four links] <button type="button" data-cap-part="more" …>More</button></nav>
  <dialog class="cap-dialog cap-admin-sheet" data-cap="dialog" data-placement="bottom" id="cap-admin-sheet">[header with h2#cap-admin-sheet-title tabindex=-1] [body: apps, pages, tools] <nav class="cap-admin-sheet-account" aria-label="Account">…</nav></dialog>
</div>
```

`import { enhance, toggleMenu, jumpTarget } from "capsomer/behaviour/admin-shell"` wires the collapse control, the remembered choice, the sheet and the keys for markup written by hand. In React, `import { AdminShell, FIRST_PAGE } from "capsomer/react/admin-shell"` and `<AdminShell app="carrel" page={FIRST_PAGE} nav={…} badges={…} onRefresh={…}>`; `FAMILY_APPS` and `OWNER` are exported from the same module.

## Density

Capsomer's default stays: compact, `data-density="comfortable"` on the shell or on `<html>` for roomier rows. Row heights and paddings come from `--control`, `--target` and `--pad-card`.

## Deliberately different

- **Dark fill for the current item**, not the soft accent tint the older Shell uses: the current page must be unmistakable at a glance.
- **The top bar sits in the content, not across the window.** The strip holds the app switcher and the tools; the bar holds only what is true of this page, then the theme.
- **Another app's link is a plain anchor**, even where a router is in use, since another app is another origin.

## Exceptions in production

None yet.
