---
name: theme-switch
title: Theme switch
summary: Light or Dark, following the system until the person chooses, then remembered in this browser.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [first visit follows the system, light selected, dark selected, hover, keyboard focus, disabled, comfortable density, phone width, the button form]
added: 0.1.0
updated: 0.9.0
source: Capsid Portal, dashboard/src/lib/prefs.ts (applySavedTheme, toggleTheme, setThemeChoice) and the top bar's theme button
replaces:
  - 'wf-theme'
  - 'applySavedTheme'
  - 'name="theme"'
---

# Theme switch

Two choices, Light and Dark, as a segmented pair on radio inputs, each with its icon (a sun, a moon). A choice sets `data-theme` on `<html>`. The switch is for a settings page; a header carries the **button form** (0.9.0): one icon button whose name says what it does. There is no "System" choice to pick: the first visit follows the operating system's setting, and from the first choice on the person's choice is remembered.

**Provenance.** MIXED, against the Capsid Portal at master (as of 2026-10-01), `lib/prefs.ts`. The logic is EXTRACTED with renames: `applySavedTheme` is `applyStoredTheme`, `toggleTheme` is `toggleTheme`, `currentTheme` is `effectiveTheme`, and `setThemeChoice` is `applyTheme` (set `data-theme`, remember, tell every switch on the page, as the Portal's listeners do). The Portal's key `wf-theme` is `cap-theme`. The markup is REWRITTEN: a two-radio segmented control, with the choice named in words, where the Portal has a top-bar button with `aria-pressed`. Dustin ruled (PR #13, 2026-10-01) for the two-state Light/Dark control with no System shown, the first visit following the system and the choice remembered after, as the Portal's button behaves. This overrides the audit's Display setting with System, Light and Dark; the 0.1.1 first draft of this page kept three choices, and that is withdrawn. Where this differs from the Portal: the control says "Light" and "Dark" as two named radios and not one button whose pressed state means dark; nothing else.

## When to use it

The switch on a settings page; the button form in the site header (components/site-header), where every page's theme control now sits (Dustin's answer 2 of 2026-10-13).

## The button form

One icon button, `data-variant="button"`: a moon while the page is light, a sun while it is dark, and its name says what pressing it does, "Switch to dark theme" or "Switch to light theme", so nobody has to guess whether a sun means "is light" or "make it light". Light and Dark only, no System, the same remembering as the switch. Its tooltip (the shared tooltip, in the top layer) repeats the name and its key; it adds no description, because the name already says it. It follows the `t` key, other tabs and the system's setting like the switch does. 36px, an 18px glyph, as every header icon.

```html
<button type="button" class="cap-theme-button" data-cap="theme-switch" data-variant="button" aria-label="Switch to dark theme">
  <svg class="cap-theme-icon" data-show="light" viewBox="0 0 24 24" aria-hidden="true">[moon]</svg>
  <svg class="cap-theme-icon" data-show="dark" viewBox="0 0 24 24" aria-hidden="true">[sun]</svg>
  <span class="cap-theme-tip cap-popover" data-variant="tooltip" data-side="bottom" data-offset="6" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-theme-tip-text">Switch to dark theme</span><kbd>T</kbd></span>
</button>
```

`enhance()` wires it; `themeButtonLabel(showing)` gives its name. In React, `<ThemeButton prefKey shortcut />`.

## When not to

A public reading page may leave the choice to the system and show no control.

## The default and its reason

- **A choice crossfades the page** from the old theme to the new in 200 ms (a view transition), where the browser has one and motion is allowed; a choice restored on load, or synced from another tab, paints at once. Why: a cut between light and dark is the harshest change the family makes, and the crossfade shows it as one change.
- **Two choices on radio inputs**; the arrow keys move between them and each takes effect at once. No "System" is shown (Dustin's ruling above), so a person who wants to go back to following the system clears this browser's site data.
- **The first visit follows the system.** With nothing remembered, `data-theme` is left off, so the system's setting applies and keeps applying, live, if the system changes; the control shows the radio for the theme in effect. Nothing is written to storage until the person chooses.
- **Remembered in this browser** from the first choice, `localStorage` key `cap-theme` (or the switch's `data-cap-pref`), as `light` or `dark`. A `system` that 0.1.0 remembered reads as no choice, so the system's setting still applies.
- **Applied before first paint.** Run `applyStoredTheme()` from a tiny inline script in the `head`, or the page flashes the other theme while the bundle loads. **An app with a Content Security Policy must allow that script**: add its hash to `script-src` (`'sha256-...'`), never `'unsafe-inline'`. The alternative, as dustinedwards.info does, is a cookie: the server reads it and writes `data-theme` and the checked radio into the HTML, so no script runs before paint.
- **`toggleTheme()` switches light and dark** from whatever is showing, and remembers it, for a `t` shortcut registered through the shortcut registry; every switch on the page follows, and so do other tabs.
- **The group has a name, "Theme"**, in a visually hidden `legend`, because a top bar has no room for a visible one.
- **A sun and a moon beside the words**, as shadcn's Mode Toggle draws them; on a phone (under 820 px) the words are visually hidden and the icons stay, and a screen reader still hears "Light" and "Dark".
- **The chosen segment has one marker, a fill**: the dark fill of the admin menu's selected page (`--accent-12`, its word in `--ground` and set heavier), over 3:1 against the ground in both themes, so no second mark (an underline) is needed (Dustin, 2026-10-11: one marker). The control's edge is `--line-strong`, which reaches 3:1 and APCA Lc 30 on the ground, the surface and the raised surface (the dark mode plan, 2026-10-29).
- **Density**: the segments are one control tall (`--control`, 44 px on a touch screen), so `data-density="comfortable"` on the top bar or the root makes them larger.

## A server-rendered site

`capsomer/theme-server` is the switch's server half, with no DOM, for a Worker or Node:

- `readThemeCookie(requestOrCookieHeader, name = "theme")`: the remembered choice, or `null` (follow the system). A malformed cookie is `null`, never an error.
- `themeCookie(choice, { name, maxAge, secure })`: the `Set-Cookie` value, a year, `Path=/`, `SameSite=Lax`, `Secure`.
- `colorSchemeContent(choice)`: the `<meta name="color-scheme">` content, the choice or `light dark`.
- `themeColorMeta(choice, { light, dark })`: the `<meta name="theme-color">` tags, so a phone's browser bar takes the page's ground: one tag for a choice, one per scheme with its media query when there is none. Pass the site's `--ground` in each theme. The switch updates every theme-color tag to the chosen theme's ground when the person switches.
- `themeColorTags(choice, { light, dark })`: the same tags as descriptors, `{ name, content, media }[]`, for a React Layout or a `meta()`. React: `<ThemeColor choice={theme} ground={{ light: "#fdfdfe", dark: "#0e0c12" }} />` from `capsomer/react/theme-switch`, in the Layout's head, instead of a hand-written pair. `themeColorMeta` is these tags as HTML.
- `themeScript(key = "cap-theme")`: the inline pre-paint script below, as text, so a site hashes exactly what it sends.

A site keeps its own cookie name (txasm's `txasm_theme`, Foxhound's `fh_theme`) by passing it; the choice its visitors made survives.

**With no script (0.22.0):** a site that keeps the choice in a cookie and must work with no script uses the form, `data-variant="form"` (React `ThemeForm`): two real submit buttons in a `<form method="post" action="/theme">`, each named for what it does, and CSS shows the one that switches away from the theme showing. With no script a press posts to the site's theme route, which sets the cookie and comes back, and the server writes `data-theme` into the next page's first byte. With script, `enhance()` switches at once, writes the cookie named by `data-cap-cookie` (default `theme`) and keeps focus on the button now shown. `prefKey` (`data-cap-pref`) also writes the choice to that localStorage key, for an admin whose shell reads it there. dustinedwards.info's header uses it.

```tsx
<ThemeForm action="/theme" className="cap-site-header-icon" />
```

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
- The checked choice is shown by the segmented control's tint and weight, not by color alone.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<fieldset class="cap-theme" data-cap="theme-switch">
  <legend class="cap-sr-only">Theme</legend>
  <div class="cap-theme-options">
    <label><input type="radio" name="cap-theme" value="light"><svg class="cap-theme-icon" viewBox="0 0 16 16" aria-hidden="true">[sun]</svg><span class="cap-theme-text">Light</span></label>
    <label><input type="radio" name="cap-theme" value="dark"><svg class="cap-theme-icon" viewBox="0 0 16 16" aria-hidden="true">[moon]</svg><span class="cap-theme-text">Dark</span></label>
  </div>
</fieldset>
```

`enhance()` applies the remembered choice (or, with none, the one checked in the markup, which is how a server that read a cookie says it), else checks the system's theme without applying anything, and applies and remembers each change. `applyTheme(choice)`, `readTheme()`, `effectiveTheme()`, `applyStoredTheme()` and `toggleTheme()` are exported; `themeChoice()` and the `"system"` choice are gone. In React, `<ThemeSwitch />`, with `initial` set from the cookie where the server reads one.

## Matches shadcn

Toggle Group in its outline variant with spacing 0 (the items flush in one rounded box, the chosen one filled, one control tall), carrying the sun and moon of the Mode Toggle recipe, and the Toggle's focus ring.

## Deliberately different

- **Two radios, not a toggle group of buttons.** shadcn's Toggle Group is `aria-pressed` buttons; a choice of one of two is a radio group, so the arrow keys, the form and the screen reader's "1 of 2" are the browser's. It also keeps 0.1's markup contract.
- **Two states, no System.** shadcn's Mode Toggle is a menu of Light, Dark and System; Dustin ruled for two (PR #13), and kept two for the header's button (2026-10-13). The first visit follows the system without writing anything.
- **The chosen segment is the selected-item fill**, not shadcn's gray muted fill: one selected style across Capsomer, and over 3:1 against the ground on its own.
- **It no longer uses `.cap-seg`.** The segmented control is a form control on a surface; this one sits on the top bar's ground tone and has icons, so its look is its own, and the two can change independently.

## Exceptions in production

None yet.
