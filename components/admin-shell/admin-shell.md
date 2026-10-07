---
name: admin-shell
title: Admin shell
summary: The one structure every admin area, dashboard and site shares: a strip of apps and tools, a grouped menu for the current app, then the content.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [expanded, current app tile, badge on another app, menu collapsed, name shown, account panel open, reading column, comfortable density, phone tab bar, phone sheet]
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
| Strip, top | The apps, each a tile with a badge when it needs them | The site's logo | Their stores, with badges, if more than one |
| Strip, bottom | Search, Inbox, Help, avatar | Search, theme, subscribe | Inbox, Help, avatar |
| Menu | The current app's sections, grouped | The site's sections | The dashboard's sections |
| Content | The page | A centred reading column (`data-measure="reading"`) | The page |

The strip is never an empty column: its bottom tools serve everyone.

## The default and its reason

- **The strip is always shown, one width (`--rail-w-collapsed`).** Hiding the app switcher cost Slack its multi-workspace users, because the other workspaces' badges disappeared. The strip is the only way another app's "needs you" stays visible.
- **The menu is one width (`--rail-w`), collapsible; collapse leaves the strip.** The collapse control is the first thing in the strip, the same place in every app and in both states, with its key `[` in its name's tip (Atlassian found the control hard to discover until it was obvious). The choice is remembered per site (`localStorage`, key `cap-rail` or `data-cap-pref`). The app binds `[` itself, because single-key shortcuts are the app's setting.
- **No badge on the app you are in.** Strip badges are for other apps. Each "needs you" fact appears on a page once as a number and once as an action, not five times.
- **Counts follow one rule: a plain number counts; a violet pill needs you.** `tone: "need"` on an entry, or `count` / `dot` on another app. Red and amber (`crit`, `warn`) are status colours and keep their one meaning.
- **The current page is a dark filled pill in the palette's darkest accent step (`--accent-12`).** The current app's tile is the same dark fill. Color means something: violet marks the current selection, the primary action and "needs you"; nothing else is coloured for decoration.
- **Tiles are neutral and carry the product's mark.** A mark drawn in `currentColor` takes the tile's colour (accent text on a neutral tile, the pill's text on the current one). With no logo yet the tile shows the name's first letter.
- **Icons carry the controls**, one family (24 box, 1.6 stroke), every icon button one size with an accessible name and a tooltip. A tooltip is a child of its control, shows on hover and keyboard focus, and Esc hides it (WCAG 1.4.13).
- **The account panel is the Popover API** (light dismiss, Esc, focus handed back by the platform), opened from the avatar. Sections: who you are, this app (settings, view site), elsewhere (the other apps, listed from `apps`), sign out last.
- **Ctrl or Cmd with 1 to 9 opens the app in that place** (Slack's lesson). Browsers may keep some of these digits for their own tabs; the strip's links always work.
- **The page's own thin bar** (`status`, `actions`) says what is true: "Updated 6 min ago · refreshes itself", never "Live" for data that is minutes old. Page-wide controls (time range, scope, export) go there only on pages whose data actually changes with them.
- **All content is in the server-rendered HTML.** Every menu link, the strip's links and the page are in the markup without a script, so a screen reader or an agent reads them. The shell's behaviour (collapse, remembering it, the account panel's close, the sheet) is added by script; nothing depends on it for reading or reaching a page.
- **On a phone the strip and the menu live in one sheet.** The tab bar holds at most four of the app's top pages and More (rulings, rule 9). More opens the shared dialog as a bottom sheet: the apps first, then the other pages, then the tools and the account.

## Props

| Prop | Is |
| --- | --- |
| `title`, `mark` | The current app's name, a plain title over its menu |
| `apps` | The strip: `id`, `label`, `href`, `logo` or `mono`, `current`, `count`, `dot`, `countNote` |
| `nav` | The menu: entries with `group`, `icon`, `count`, `countNote`, `tone`, `current` |
| `tabs`, `more` | The phone's bar and what sits under More; default the first four and the rest |
| `onSearch`, `inbox`, `onHelp` | The strip's tools; each shows only when given |
| `account` | The avatar's panel: `name`, `initials`, `role`, `email`, `appLinks`, `onSignOut` |
| `status`, `actions` | The page's thin bar |
| `renderLink` | A router's link; other apps' links stay plain anchors where the router cannot reach them |
| `collapsed`, `onCollapsedChange`, `prefKey`, `jumpKeys`, `collapseKey` | Collapse state and keys |

Badge data is a prop: Capsid supplies it, one question per app ("what needs Dustin"), not each app querying the others.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The skip link, the strip (collapse, apps, tools, avatar), the menu, the main region |
| Enter or Space on the collapse control | Collapses or expands the menu |
| Esc | Hides a shown name; closes the account panel; closes the sheet |
| Ctrl or Cmd + 1 to 9 | Opens the app in that place |
| Enter on the avatar | Opens the account panel; focus stays on the avatar, the panel follows in tab order |
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
      <li><button type="button" class="cap-admin-btn" data-cap-part="menu-toggle" aria-label="Collapse menu" aria-expanded="true" aria-controls="cap-admin-menu">[icon]<span class="cap-admin-tip" aria-hidden="true"><span class="cap-admin-tip-text">Collapse menu</span><kbd>[</kbd></span></button></li>
      <li><a class="cap-admin-tile" href="/" aria-current="true">[mark][tip]</a></li>
      <li><a class="cap-admin-tile" href="https://carrel…" aria-label="Carrel, 2 need you">[mark]<span class="cap-admin-badge" aria-hidden="true">2</span>[tip]</a></li>
    </ul>
    <ul class="cap-admin-strip-group"> [search] [inbox] [help] [avatar and its popover] </ul>
  </nav>
  <nav class="cap-admin-menu" id="cap-admin-menu" aria-label="Sections">
    <div class="cap-admin-title">Capsid Portal</div>
    <div class="cap-admin-group" role="group" aria-labelledby="g-watch">
      <div class="cap-admin-group-label" id="g-watch">Watch</div>
      <a href="/" aria-current="page">[icon]<span>Overview</span><span class="cap-admin-count"></span></a>
      <a href="/queue" aria-label="Queue, 5 blocked">[icon]<span>Queue</span><span class="cap-admin-count" data-tone="need">5</span></a>
    </div>
  </nav>
  <main class="cap-admin-main" id="cap-main" tabindex="-1">
    <div class="cap-admin-bar"><div>[status]</div><div class="cap-admin-actions">[actions]</div></div>
    <div class="cap-admin-page">[the view]</div>
  </main>
  <nav class="cap-admin-tabs" aria-label="Sections"> [up to four links] <button type="button" data-cap-part="more" …>More</button></nav>
  <dialog class="cap-dialog cap-admin-sheet" data-cap="dialog" data-placement="bottom" id="cap-admin-sheet">…</dialog>
</div>
```

`import { enhance, toggleMenu, jumpTarget } from "capsomer/behaviour/admin-shell"` wires the collapse control, the remembered choice, the sheet and the keys for markup written by hand. In React, `import { AdminShell } from "capsomer/react/admin-shell"`.

## Density

Capsomer's default stays: compact, `data-density="comfortable"` on the shell or on `<html>` for roomier rows. Row heights and paddings come from `--control`, `--target` and `--pad-card`.

## Deliberately different

- **Dark fill for the current item**, not the soft accent tint the older Shell uses: the current page must be unmistakable at a glance.
- **No top bar.** The strip holds the app switcher and the tools; the page's thin bar sits in the content and holds only what is true of that page.
- **Another app's link is a plain anchor**, even where a router is in use, since another app is another origin.

## Exceptions in production

None yet.
