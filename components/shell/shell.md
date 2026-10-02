---
name: shell
title: Shell
summary: The top bar, the left menu and the phone tab bar every app shares.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [expanded, group label, current entry, entry with a count, hover, pressed, keyboard focus, collapsed, collapsed with a shown name, Settings current, comfortable density, phone width, More tab, More sheet open, More tab current]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/app/App.tsx, MoreSheet.tsx and styles.css
replaces:
  - 'class="(app|rail|tabbar)"'
  - "className=\"(app|rail|tabbar)"
---

# Shell

The frame of every app: a top bar, a left menu (the rail) that collapses to icons, the page's main region, and a tab bar on a phone. Capsomer's own site and the Capsid Portal use the same one, so the two visibly belong together.

**Provenance.** MIXED, against the Portal's dashboard/src/styles.css, app/App.tsx and app/MoreSheet.tsx as of capsid master after #226. The CSS rules (the quiet top bar and rail on the ground tone, the 30 px items, the current item on the lit surface, the collapsed dots, the tab bar and its badge, the More list, the page frame) are EXTRACTED from the Portal with renames. The behaviour is REWRITTEN framework-free: the Portal places a script-positioned tip (`.tip`) beside a collapsed entry, and Capsomer shows the entry's own label by CSS, with Esc to hide it (WCAG 1.4.13), so no tooltip script is needed. **0.2.0** rebuilds the look from shadcn/ui's Sidebar (nova) and the More sheet on the shared dialog (`components/dialog`) as a bottom sheet; see Matches shadcn below.

## When to use it

For an app with several views a person moves between: an operations console, an admin, a writing hub, a product's merchant screens.

## When not to

A public reading page (a post, a CV) has no rail; it uses the site's own header and the prose context. A single-view tool needs only the top bar's content, not the shell.

## The default and its reason

- **The rail lists views, at most two levels deep, each a real link with `aria-current="page"`.** Buttons that change the address break Back, middle-click and screen readers' link lists (APG Link; patterns.md "Move between views").
- **The top bar holds, left to right: the brand, a status (how fresh the data is), actions, the theme switch, Settings, then Sign out.** Settings is a place you visit rarely, so it moves out of the rail into the top bar (ruled with capsid job_28cc5d296fdb).
- **The rail collapses to icons, and the choice is remembered in this browser** (`localStorage`, key `cap-rail` or the shell's `data-cap-pref`). Collapsed, each name stays in the accessibility tree and shows beside its icon on hover and on keyboard focus; a count becomes a dot.
- **The top bar and the rail are quiet: on the ground tone, no rule between them and the page.** The current entry is lifted onto the lit surface with a hairline, and its icon takes the accent; the page's panels are the surface (Portal design D4, D5, #215). The top bar is 44 px. The current item is tinted with the accent tint and set in `--accent-text` (4.5:1) in medium weight, which is the active menu item's job in Capsomer's step table; its icon follows the text colour.
- **Settings is an icon link in the top bar** (`.cap-shell-settings`, hidden on a phone with `data-hide="phone"`), current on the Settings view with `aria-current="page"`, with a tooltip that names its shortcut. It is not in the rail.
- **On a phone the rail gives way to a tab bar of at most five entries: four views and More** (rulings.md, rule 9). More is a button that opens the shared dialog (`components/dialog`, `data-placement="bottom"`) listing every other view with its count, so no view needs the command menu to be reached. When the current view is one of those, the More tab is `aria-current="true"` and takes the accent (the Portal's `button.cur`).
- **The rail's foot holds the shortcut hints, then the collapse button.** Expanded, Command menu and Shortcuts are quiet rows with their keys (`.cap-shell-linkish`); collapsed, they are icon buttons (`.cap-shell-railbtn`) whose names show like an entry's. The app renders the form that matches the rail's state, as the Portal does.
- **The page frame** (`.cap-shell-page`) gives a view its padding, a 14 px rhythm and a 1480 px measure. The document scrolls, so the phone tab bar is sticky, not fixed, and the page needs no bottom padding to clear it.
- **Groups are optional**: `.cap-shell-group` with a `.cap-shell-group-label` over its entries (`role="group"` named by the label), as Sidebar's group. Collapsed, the label is hidden and a hairline sets the groups apart.
- **A count is a small pill** (Sidebar's menu badge), red or amber on their own soft tint; collapsed it is a dot.
- **A count says what it counts in the entry's name**: "Queue, 3 blocked", not "Queue 3".
- **A skip link is the first tab stop.**

## Keyboard

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

## Accessibility

- Two navigation landmarks with the same name ("Sections"); only one is displayed at any width, so a screen reader meets one.
- The More sheet is the shared dialog (a native modal `dialog`) named "More views", so the page behind it is inert, Esc closes it and focus returns to the More button. Its counts are `--muted`, since `--dim` on the active tint is 3.8:1 in dark.
- The More tab states its popup (`aria-haspopup="dialog"`) and whether it is open (`aria-expanded`); the current tab is never conveyed by colour alone (the accent plus `aria-current`, and an underline in forced colours).
- Collapsed names are clipped, not removed, so the links keep their names. A shown name is a child of its link, so the pointer can move onto it without it closing, and Esc hides it (WCAG 1.4.13). Because a scrolling box would clip it, a collapsed rail does not scroll; its icons fit the height.
- Counts are part of the link's accessible name.
- The top bar is sticky and the document scrolls, with `scroll-padding-top` for the bar, so a focused control is never hidden under it (WCAG 2.4.11).
- Forced colours: the current entry gains an outline, because its tinted background is removed.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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
      <a href="/" aria-current="page">[icon]<span class="cap-shell-label">Overview</span><span class="cap-shell-count"></span></a>
      <a href="/queue" aria-label="Queue, 3 blocked">[icon]<span class="cap-shell-label">Queue</span><span class="cap-shell-count" data-tone="warn">3</span></a>
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
        <li><a href="/namespaces">[icon]<span class="cap-shell-more-name">Namespaces</span><span class="cap-shell-count">1 paused</span></a></li>
      </ul></nav>
    </div>
    <button type="button" class="cap-btn cap-dialog-close" data-variant="quiet" data-icon-only data-cap-part="close" aria-label="Close">[icon]</button>
  </dialog>
</div>
```

`import { enhance, toggleRail, openMore, closeMore } from "capsomer/behaviour/shell"` wires the collapse button and the More sheet (through the dialog's `wireDialog`, so the sheet needs no separate `enhance()`). `readPref` and `writePref` are exported too: the theme switch and the shortcuts share them. In React, `import { Shell } from "capsomer/react/shell"`; pass `renderLink` to use a router's link, `tabs` (at most four), `more`, `moreLabel` and `moreIcon` for the phone tab bar and its sheet, and `group` on an entry to put it under a group label. The top bar's Settings link and the rail's hints go in `actions` and `railFoot`.

## Density

`data-density="compact"` (the default) or `"comfortable"` on the shell, or on `<html>` for the whole app, sets the item height (`--control`), the page padding and the type sizes. The shell exports `readDensity()`, `applyDensity("comfortable")` and `applyStoredDensity()`: the choice goes on `<html>` as `data-density` and is remembered in this browser (`localStorage` key `cap-density`, read and written in try/catch) the way the theme is. An app puts a two-choice control (Compact, Comfortable) on its Settings page, calls `applyDensity` on change, and runs `applyStoredDensity()` from the same early inline script as `applyStoredTheme()`. With no choice, nothing is written and the default applies. The shell has no Settings page of its own, so it does not draw the control.

## Matches shadcn

Sidebar (Base UI flavour, nova): the menu button (one control tall, a 16 px icon and 8 px gap, a rounded 6 px hover, a current item tinted and set in medium weight), the group and its label, the menu badge, the icon-only collapsed rail whose names show in a tooltip to the right (inverted surface, 6 px radius, 12 by 6 padding, an arrow, fade and an 8 px slide in 100 ms), the footer with the collapse trigger, and the focus ring on every item. The phone's sheet is Sidebar's mobile Sheet, here the bottom sheet of the shared dialog with the list of views.

## Deliberately different

- **The current item is on the accent tint with `--accent-text`**, not Sidebar's grey: Capsomer's menu item job is step 11, and the tint is the family's.
- **No width animation on the rail.** Sidebar animates its width over 200 ms; Capsomer moves only transform, opacity and colour, so the rail changes size at once. The tooltip and the colour changes are animated.
- **The collapsed rail does not scroll** (it is `overflow: visible`), so the tooltips are not clipped; Sidebar portals its tooltips instead. The rail's few icons fit the height.
- **Tooltips here are CSS labels, not the Tooltip component**, so a collapsed link has its name with no script and the link's accessible name is its own text; they show on hover and on keyboard focus with no delay, since the label is the only name on screen.
- **The More sheet slides up from the bottom** (a phone's thumb), where Sidebar's mobile sheet is a left side sheet; and it has the dialog's corner Close button instead of a footer Close.
- **The top bar and the rail are on the ground tone** (Sidebar's `bg-sidebar` has no counterpart), and the top bar is 44 px.

Needs from shared code: `--top-h` in tokens/scale.css is 56 px and the shell sets 44 px itself until it is changed there.

## Exceptions in production

None yet.
