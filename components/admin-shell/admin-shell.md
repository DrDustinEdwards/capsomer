---
name: admin-shell
title: Admin shell
summary: "The shared structure of every admin area and dashboard, with a side menu and the content."
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [expanded, current app tile, badge on another app, menu collapsed to icons, collapsed name shown, name shown, account menu open, user variant, user variant collapsed, reading column, comfortable density, page transitions, phone tab bar, phone sheet, phone count past 99]
added: 0.4.0
updated: 0.100.0
source: Dustin's pick of 2026-10-06 (capsomer/research/admin-shell-findings.md); the flagship design canvas "Flagship Shell: Capsid Portal"; the Portal's own App.tsx
replaces:
  - 'class="(app|rail|tabbar)"'
  - 'className="(app|rail|tabbar)[ "]'
---

# Admin shell

## Usage

```html
<div class="cap-admin" data-cap="admin-shell" data-variant="owner">
  [the site header: components/site-header's markup, with Search, Inbox, the theme button and the avatar]
  <nav class="cap-admin-strip" aria-label="Apps">
    <ul class="cap-admin-strip-group">
      <li><a class="cap-admin-tile" href="https://portal.dustinedwards.info/" aria-current="true"><svg class="cap-admin-logo">[the app's mark]</svg>[tip]</a></li>
      <li><a class="cap-admin-tile" href="https://desk.dustinedwards.info/" aria-label="Carrel Desk, 2 need you"><svg class="cap-admin-logo">…</svg><span class="cap-count cap-admin-badge" data-tone="need" aria-hidden="true">2</span>[tip]</a></li>
      [dustinedwards.info, germomics, Foxhound, Foxing, Capsomer, in that order]
    </ul>
  </nav>
  <nav class="cap-admin-menu" id="cap-admin-menu" aria-label="Sections">
    <button type="button" class="cap-admin-collapse" data-cap-part="menu-toggle" aria-label="Collapse menu" aria-expanded="true" aria-controls="cap-admin-menu">[icon]<span class="cap-admin-label">Collapse menu</span><span class="cap-keys"><kbd>[</kbd></span><span class="cap-admin-tip cap-popover" data-variant="tooltip" data-side="right" data-offset="12" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-admin-tip-text">Collapse menu</span></span></button>
    <div class="cap-admin-group" role="group" aria-labelledby="g-watch">
      <div class="cap-admin-group-label" id="g-watch">Watch</div>
      <a href="/" aria-current="page">[icon]<span>Overview</span> <span class="cap-count cap-admin-count"></span></a>
      <a href="/queue" aria-label="Queue, 5 blocked">[icon]<span class="cap-admin-label">Queue</span><span class="cap-admin-tip cap-popover" data-variant="tooltip" data-side="right" data-offset="12" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-admin-tip-text">Queue</span></span> <span class="cap-count cap-admin-count" data-tone="need">5</span></a>
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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | The skip link, the header (logo, switchers, Search, Inbox, the theme, the avatar), the strip's apps, the menu (the collapse control first), the main region |
| Enter or Space on the collapse control | Collapses or expands the menu |
| Esc | Hides a shown name; closes the account menu and returns focus to the avatar; closes the sheet and returns focus to the menu button |
| G, then 1 to 9 | Opens the app in that place |
| Enter or Space on the avatar | Opens the account menu; focus moves to its first item, Up and Down move between items |
| Any link, with transitions on | Moves to the page as without them; the transition does not move focus |
| `[` | Collapses or expands the menu (not while typing, or with single-key shortcuts off) |

- The header is the `banner`. The strip, the menu and the phone bar are navigation landmarks with their own names ("Apps", "Sections"); the menu and the bar are never displayed together.
- Every strip control has an accessible name that contains what it shows; a badge says what it counts in the name ("Carrel Desk, 2 AI drafts waiting").
- Names of the current app and page are `aria-current` (`true` on the tile, `page` on the menu link), and not conveyed by color alone (a dark fill, plus an outline in forced colors).
- Menu text, counts and the pill reach their contrast in both themes; the tests measure the painted colors.
