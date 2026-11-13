---
name: settings-row
title: Settings row
summary: One setting per line, its name and line at the start and its control at the end, and the settings page around the rows.
parts: [css, react]
tool: native
states: [a switch row, a switch that sends its form at once, owner only with its reason, another control, the page with its back link]
added: 0.117.0
source: Foxhound, app/components/settings-toggle-row.tsx, routes/app/settings/disputes.tsx (the switch's own form) and settings-back-link.tsx with the eight settings pages' page head
replaces:
  - 'function ToggleRow'
  - 'SettingsBackLink'
---

# Settings row

`SettingsRow` puts a setting's name and one line on what it does at the start, and its control at the end, with a rule between rows. `SwitchRow` is the row whose control is a switch. `SettingsLayout` is the page: the page head, and on a phone a link back to the settings index above it.

## When to use it

Settings pages: one control per setting, each taking effect at once (a switch) or saved with the page's form.

## When not to

- A form of many fields saved together: the schema form or the field parts in a form.
- A switch that starts or stops automation and needs a reason: switch-reason.

## The default and its reason

- **The row's words are the control's name and description** (`aria-labelledby`, `aria-describedby`), so the switch is "Failure alerts, switch, on, An email the moment a check fails."
- **`submitOnChange`** sends the switch's form when it is flipped (`requestSubmit`, so the form's own checks and handlers run), because a switch takes effect at once; `form` places it in a form elsewhere on the page. With no script a Save button for that form stands in. A switch that is on posts `name=on`; off posts nothing.
- **Disabled says why.** `disabledReason` disables the switch and adds the reason to the row's line, in the text color, never a dimmed switch with no reason.
- **The back link shows below 48rem**, where the settings menu is hidden, at least `var(--target)` tall.

## Keyboard

The control's own; the back link is a link.

## Accessibility

A switch is Capsomer's switch (a checkbox with `role="switch"`). The page head holds the one `h1`.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-settings-row">
  <div class="cap-settings-row-text">
    <span class="cap-settings-row-label" id="r1-label">Failure alerts</span>
    <p class="cap-settings-row-help" id="r1-help">An email the moment a check fails.</p>
  </div>
  <div class="cap-settings-row-control">
    <label class="cap-switch"><input type="checkbox" role="switch" name="alerts" aria-labelledby="r1-label" aria-describedby="r1-help" checked /> <span class="cap-switch-state" aria-hidden="true">On</span></label>
  </div>
</div>
```

React: `import { SettingsLayout, SettingsRow, SwitchRow } from "capsomer/react/settings-row"`.

## Exceptions in production

None yet.
