---
name: shell
title: Shell
summary: The top bar, the left menu and the phone tab bar every app shares.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [expanded, current entry, entry with a count, hover, keyboard focus, collapsed, collapsed with a shown name, phone width]
added: 0.1.0
source: Capsid Portal, dashboard/src/app/App.tsx and styles.css
replaces:
  - 'class="(app|rail|tabbar)"'
  - "className=\"(app|rail|tabbar)"
---

# Shell

The frame of every app: a top bar, a left menu (the rail) that collapses to icons, the page's main region, and a tab bar on a phone. Capsomer's own site and the Capsid Portal use the same one, so the two visibly belong together.

## When to use it

For an app with several views a person moves between: an operations console, an admin, a writing hub, a product's merchant screens.

## When not to

A public reading page (a post, a CV) has no rail; it uses the site's own header and the prose context. A single-view tool needs only the top bar's content, not the shell.

## The default and its reason

- **The rail lists views, at most two levels deep, each a real link with `aria-current="page"`.** Buttons that change the address break Back, middle-click and screen readers' link lists (APG Link; patterns.md "Move between views").
- **The top bar holds, left to right: the brand, a status (how fresh the data is), actions, the theme switch, Settings, then Sign out.** Settings is a place you visit rarely, so it moves out of the rail into the top bar (ruled with capsid job_28cc5d296fdb).
- **The rail collapses to icons, and the choice is remembered in this browser** (`localStorage`, key `cap-rail` or the shell's `data-cap-pref`). Collapsed, each name stays in the accessibility tree and shows beside its icon on hover and on keyboard focus; a count becomes a dot.
- **On a phone the rail gives way to a tab bar of at most five entries, the last one More** (rulings.md, rule 9).
- **A count says what it counts in the entry's name**: "Queue, 3 blocked", not "Queue 3".
- **A skip link is the first tab stop.**

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The skip link first, then the top bar, the rail, the main region |
| Enter on the skip link | Moves focus to the main region |
| Enter or Space on the collapse button | Collapses or expands the rail |
| Esc | Hides a collapsed entry's shown name until the pointer or focus moves on |
| `[` | Collapses or expands the rail, when the app binds it through the shortcut registry |

## Accessibility

- Two navigation landmarks with the same name ("Sections"); only one is displayed at any width, so a screen reader meets one.
- Collapsed names are clipped, not removed, so the links keep their names.
- Counts are part of the link's accessible name.
- The top bar is sticky and the main region scrolls on its own, so a focused control is never hidden under the bar (WCAG 2.4.11).
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
    <div class="cap-shell-actions">[actions] [theme switch] [Settings] [Sign out]</div>
  </header>
  <nav class="cap-shell-rail" id="cap-rail" aria-label="Sections">
    <a href="/" aria-current="page">[icon]<span class="cap-shell-label">Overview</span><span class="cap-shell-count"></span></a>
    <a href="/queue" aria-label="Queue, 3 blocked">[icon]<span class="cap-shell-label">Queue</span><span class="cap-shell-count" data-tone="warn">3</span></a>
    <div class="cap-shell-foot">
      <button type="button" class="cap-shell-toggle" data-cap-part="rail-toggle" aria-expanded="true" aria-controls="cap-rail">[icon]<span class="cap-shell-label">Collapse menu</span><kbd aria-hidden="true">[</kbd></button>
    </div>
  </nav>
  <main class="cap-shell-main" id="cap-main" tabindex="-1">[the view]</main>
  <nav class="cap-shell-tabs" aria-label="Sections">[at most five links, the last More]</nav>
</div>
```

`import { enhance, toggleRail } from "capsomer/behaviour/shell"` wires the collapse button. In React, `import { Shell } from "capsomer/react/shell"`; pass `renderLink` to use a router's link.

## Exceptions in production

None yet.
