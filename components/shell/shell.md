---
name: shell
title: Shell
summary: The top bar, the left menu and the phone tab bar every app shares.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [the site's logo, the logo alone, expanded, group label, current entry, entry with a count, hover, pressed, keyboard focus, collapsed, collapsed with a shown name, Settings current, comfortable density, phone width, More tab, More sheet open, More tab current]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/app/App.tsx, MoreSheet.tsx and styles.css
replaces:
  - 'class="(app|rail|tabbar)"'
  - 'className="(app|rail|tabbar)[ "]'
---

# Shell

## Usage

```html
<div class="cap-shell" data-cap="shell">
  <a class="cap-shell-skip" href="#cap-main">Skip to content</a>
  <header class="cap-shell-top">
    <a class="cap-shell-brand" href="/">[mark] Name</a>
    <div class="cap-shell-spacer"></div>
    [status]
    <div class="cap-shell-actions">[actions] [theme switch]
      <a class="cap-btn cap-shell-settings" data-icon-only data-hide="phone" href="/settings" aria-label="Settings">[icon]</a> [Sign out]</div>
  </header>
  <nav class="cap-shell-rail" id="cap-rail" aria-label="Sections">
    <div class="cap-shell-group" role="group" aria-labelledby="g-watch"> <!-- optional -->
      <div class="cap-shell-group-label" id="g-watch">Watch</div>
      <a href="/" aria-current="page">[icon]<span class="cap-shell-label">Overview</span> <span class="cap-shell-count"></span></a>
      <a href="/queue" aria-label="Queue, 3 blocked">[icon]<span class="cap-shell-label">Queue</span> <span class="cap-shell-count" data-tone="warn">3</span></a>
    </div>
    <div class="cap-shell-foot">
      <div class="cap-shell-hint">
        <button type="button" class="cap-shell-linkish"><span>Command menu</span><span><kbd>Ctrl</kbd> <kbd>K</kbd></span></button>
      </div>
      <button type="button" class="cap-shell-toggle" data-cap-part="rail-toggle" aria-expanded="true" aria-controls="cap-rail">[icon]<span class="cap-shell-label">Collapse menu</span><kbd aria-hidden="true">[</kbd></button>
    </div>
  </nav>
  <main class="cap-shell-main" id="cap-main" tabindex="-1"><div class="cap-shell-page">[the view]</div></main>
  <nav class="cap-shell-tabs" aria-label="Sections">
    <a href="/" aria-current="page">[icon]Overview</a> [... up to four links]
    <button type="button" data-cap-part="more" aria-haspopup="dialog" aria-expanded="false" aria-controls="cap-more">[icon]More</button>
  </nav>
  <dialog class="cap-dialog cap-shell-more" data-cap="dialog" data-placement="bottom" id="cap-more" aria-labelledby="cap-more-title">
    <div class="cap-dialog-header"><h2 class="cap-dialog-title" id="cap-more-title">More views</h2></div>
    <div class="cap-dialog-body">
      <nav aria-labelledby="cap-more-title"><ul class="cap-shell-more-list">
        <li><a href="/namespaces">[icon]<span class="cap-shell-more-name">Namespaces</span> <span class="cap-shell-count">1 paused</span></a></li>
      </ul></nav>
    </div>
    <button type="button" class="cap-btn cap-dialog-close" data-variant="quiet" data-icon-only data-cap-part="close" aria-label="Close">[icon]</button>
  </dialog>
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | The skip link first, then the top bar, the rail, the main region |
| Enter on the skip link | Moves focus to the main region |
| Enter or Space on the collapse button | Collapses or expands the rail |
| Esc | Hides a collapsed entry's shown name until the pointer or focus moves on |
| Enter or Space on More (phone) | Opens the More sheet; focus moves into it |
| Tab, Shift Tab in the More sheet | Moves among its links and Close; focus stays in the sheet |
| Enter or Space on Close in the More sheet, or a press on the backdrop | Closes it; focus returns to More |
| Esc in the More sheet | Closes it; focus returns to More |
| Enter on a link in the More sheet | Goes to that view and closes the sheet |
| `[` | Collapses or expands the rail, when the app binds it through the shortcut registry |

- Two navigation landmarks with the same name ("Sections"); only one is displayed at any width, so a screen reader meets one.
- The More sheet is the shared dialog (a native modal `dialog`) named "More views", so the page behind it is inert, Esc closes it and focus returns to the More button. Its counts are `--muted`, since `--dim` on the active tint is 3.8:1 in dark.
- The More tab states its popup (`aria-haspopup="dialog"`) and whether it is open (`aria-expanded`); the current tab is never conveyed by color alone (the accent plus `aria-current`, and an underline in forced colors).
- Collapsed names are clipped, not removed, so the links keep their names. A shown name is a child of its link, so the pointer can move onto it without it closing, and Esc hides it (WCAG 1.4.13). Because a scrolling box would clip it, a collapsed rail does not scroll; its icons fit the height.
- Counts are part of the link's accessible name.
- The top bar is sticky and the document scrolls, with `scroll-padding-top` for the bar, so a focused control is never hidden under it (WCAG 2.4.11).
- Forced colors: the current entry gains an outline, because its tinted background is removed.
