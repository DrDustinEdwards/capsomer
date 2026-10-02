---
name: theme-switch
title: Theme switch
summary: Light or Dark, following the system until the person chooses, then remembered in this browser.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [first visit follows the system, light selected, dark selected]
added: 0.1.0
source: Capsid Portal, dashboard/src/lib/prefs.ts (applySavedTheme, toggleTheme, setThemeChoice) and the top bar's theme button
replaces:
  - 'wf-theme'
  - 'applySavedTheme'
  - 'name="theme"'
---

# Theme switch

Two choices, Light and Dark, as a segmented control on radio inputs. A choice sets `data-theme` on `<html>`. It sits in the top bar after the actions, before Settings. There is no "System" choice to pick: the first visit follows the operating system's setting, and from the first choice on the person's choice is remembered.

**Provenance.** MIXED, against the Capsid Portal at master (as of 2026-10-01), `lib/prefs.ts`. The logic is EXTRACTED with renames: `applySavedTheme` is `applyStoredTheme`, `toggleTheme` is `toggleTheme`, `currentTheme` is `effectiveTheme`, and `setThemeChoice` is `applyTheme` (set `data-theme`, remember, tell every switch on the page, as the Portal's listeners do). The Portal's key `wf-theme` is `cap-theme`. The markup is REWRITTEN: a two-radio segmented control, with the choice named in words, where the Portal has a top-bar button with `aria-pressed`. Dustin ruled (PR #13, 2026-10-01) for the two-state Light/Dark control with no System shown, the first visit following the system and the choice remembered after, as the Portal's button behaves. This overrides the audit's Display setting with System, Light and Dark; the 0.1.1 first draft of this page kept three choices, and that is withdrawn. Where this differs from the Portal: the control says "Light" and "Dark" as two named radios and not one button whose pressed state means dark; nothing else.

## When to use it

In every app's top bar, and on a settings page.

## When not to

A public reading page may leave the choice to the system and show no control.

## The default and its reason

- **Two choices on radio inputs**; the arrow keys move between them and each takes effect at once. No "System" is shown (Dustin's ruling above), so a person who wants to go back to following the system clears this browser's site data.
- **The first visit follows the system.** With nothing remembered, `data-theme` is left off, so the system's setting applies and keeps applying, live, if the system changes; the control shows the radio for the theme in effect. Nothing is written to storage until the person chooses.
- **Remembered in this browser** from the first choice, `localStorage` key `cap-theme` (or the switch's `data-cap-pref`), as `light` or `dark`. A `system` that 0.1.0 remembered reads as no choice, so the system's setting still applies.
- **Applied before first paint.** Run `applyStoredTheme()` from a tiny inline script in the `head`, or the page flashes the other theme while the bundle loads. **An app with a Content Security Policy must allow that script**: add its hash to `script-src` (`'sha256-...'`), never `'unsafe-inline'`. The alternative, as dustinedwards.info does, is a cookie: the server reads it and writes `data-theme` and the checked radio into the HTML, so no script runs before paint.
- **`toggleTheme()` switches light and dark** from whatever is showing, and remembers it, for a `t` shortcut registered through the shortcut registry; every switch on the page follows, and so do other tabs.
- **The group has a name, "Theme"**, in a visually hidden `legend`, because a top bar has no room for a visible one.

The inline script, for the default key:

```html
<script>try{var t=localStorage.getItem("cap-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>
```

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the checked choice |
| Left or Right arrow, Up or Down arrow | Checks the other choice and applies it |
| `t` | Switches light and dark, when the app registers it |

## Accessibility

- A `fieldset` named by its `legend`: a screen reader hears "Theme, grouping", then "Light, radio button, checked, 1 of 2".
- The checked choice is shown by the segmented control's tint and weight, not by colour alone.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<fieldset class="cap-seg cap-theme" data-cap="theme-switch">
  <legend class="cap-sr-only">Theme</legend>
  <div class="cap-seg-options">
    <label><input type="radio" name="cap-theme" value="light">Light</label>
    <label><input type="radio" name="cap-theme" value="dark">Dark</label>
  </div>
</fieldset>
```

`enhance()` applies the remembered choice (or, with none, the one checked in the markup, which is how a server that read a cookie says it), else checks the system's theme without applying anything, and applies and remembers each change. `applyTheme(choice)`, `readTheme()`, `effectiveTheme()`, `applyStoredTheme()` and `toggleTheme()` are exported; `themeChoice()` and the `"system"` choice are gone. In React, `<ThemeSwitch />`, with `initial` set from the cookie where the server reads one.

## Exceptions in production

None yet.
