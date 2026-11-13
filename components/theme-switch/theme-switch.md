---
name: theme-switch
title: Theme switch
summary: Light or Dark, following the system until the person chooses, then remembered in this browser.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [first visit follows the system, light selected, dark selected, hover, keyboard focus, disabled, comfortable density, phone width, the button form, kept by the site in its cookie and its save]
added: 0.1.0
updated: 0.92.0
source: Capsid Portal, dashboard/src/lib/prefs.ts (applySavedTheme, toggleTheme, setThemeChoice) and the top bar's theme button
replaces:
  - 'wf-theme'
  - 'applySavedTheme'
  - 'name="theme"'
  - "useThemeCookie|useThemeMemory|watchThemeChoice|rememberServerTheme|data-theme-toggle"
  - "safeReturnTo|THEME_BOOT"
---

# Theme switch

## Usage

```html
<fieldset class="cap-theme" data-cap="theme-switch">
  <legend class="cap-sr-only">Theme</legend>
  <div class="cap-theme-options">
    <label><input type="radio" name="cap-theme" value="light"><svg class="cap-theme-icon" viewBox="0 0 16 16" aria-hidden="true">[sun]</svg><span class="cap-theme-text">Light</span></label>
    <label><input type="radio" name="cap-theme" value="dark"><svg class="cap-theme-icon" viewBox="0 0 16 16" aria-hidden="true">[moon]</svg><span class="cap-theme-text">Dark</span></label>
  </div>
</fieldset>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to the checked choice |
| Left or Right arrow, Up or Down arrow | Checks the other choice and applies it |
| `t` | Switches light and dark, when the app registers it |

- A `fieldset` named by its `legend`: a screen reader hears "Theme, grouping", then "Light, radio button, checked, 1 of 2".
- The checked choice is shown by the segmented control's tint and weight, not by color alone.
