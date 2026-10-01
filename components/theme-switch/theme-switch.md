---
name: theme-switch
title: Theme switch
summary: System, Light or Dark, remembered in this browser.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [system selected, light selected, dark selected]
added: 0.1.0
source: Capsid Portal, dashboard/src/lib/prefs.ts (applySavedTheme, toggleTheme); the approved mockup's theme control
replaces:
  - 'wf-theme'
  - 'applySavedTheme'
  - 'name="theme"'
---

# Theme switch

Three choices, System, Light and Dark, as a segmented control on radio inputs. Light and Dark set `data-theme` on `<html>`; System removes it, so the operating system's setting applies. It sits in the top bar after the actions, before Settings.

## When to use it

In every app's top bar, and on a settings page.

## When not to

Not as a switch with two states: "off" would not say whether it means light or the system's choice. A public reading page may leave the choice to the system and show no control.

## The default and its reason

- **Three choices on radio inputs** (patterns.md, "Choose one of 2 to 5"); the arrow keys move between them and each takes effect at once.
- **Remembered in this browser**, `localStorage` key `cap-theme` (or the switch's `data-cap-pref`), as `system`, `light` or `dark`.
- **Applied before first paint.** Run `applyStoredTheme()` from a tiny inline script in the `head`, or the page flashes the other theme while the bundle loads. **An app with a Content Security Policy must allow that script**: add its hash to `script-src` (`'sha256-...'`), never `'unsafe-inline'`. The alternative, as dustinedwards.info does, is a cookie: the server reads it and writes `data-theme` and the checked radio into the HTML, so no script runs before paint.
- **`toggleTheme()` switches light and dark** from whatever is showing, for a `t` shortcut registered through the shortcut registry; every switch on the page follows, and so do other tabs.
- **The group has a name, "Theme"**, in a visually hidden `legend`, because a top bar has no room for a visible one.

The inline script, for the default key:

```html
<script>try{var t=localStorage.getItem("cap-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>
```

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the checked choice |
| Left or Right arrow, Up or Down arrow | Checks the next or previous choice and applies it |
| `t` | Switches light and dark, when the app registers it |

## Accessibility

- A `fieldset` named by its `legend`: a screen reader hears "Theme, grouping", then "System, radio button, checked, 1 of 3".
- The checked choice is shown by the segmented control's tint and weight, not by colour alone.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<fieldset class="cap-seg cap-theme" data-cap="theme-switch">
  <legend class="cap-sr-only">Theme</legend>
  <label><input type="radio" name="cap-theme" value="system" checked>System</label>
  <label><input type="radio" name="cap-theme" value="light">Light</label>
  <label><input type="radio" name="cap-theme" value="dark">Dark</label>
</fieldset>
```

`enhance()` checks and applies the remembered choice (or, with none, the one checked in the markup) and applies each change. `applyTheme(choice)`, `readTheme()`, `effectiveTheme()` and `toggleTheme()` are exported. In React, `<ThemeSwitch />`, with `initial` set from the cookie where the server reads one.

## Exceptions in production

None yet.
