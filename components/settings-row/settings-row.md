---
name: settings-row
title: Settings row
summary: One setting per line, with its name at the start and its control at the end, plus the page.
group: pattern
parts: [css, react]
tool: native
states: [a switch row, a switch that sends its form at once, owner only with its reason, another control, the page with its back link]
added: 0.118.0
source: Foxhound, app/components/settings-toggle-row.tsx, routes/app/settings/disputes.tsx (the switch's own form) and settings-back-link.tsx with the eight settings pages' page head
replaces:
  - 'function ToggleRow'
  - 'SettingsBackLink'
---

# Settings row

## Usage

```html
<div class="cap-settings-row">
  <div class="cap-settings-row-text">
    <span class="cap-settings-row-label" id="r1-label">Failure alerts</span>
  </div>
  <div class="cap-settings-row-control">
    <label class="cap-switch"><input type="checkbox" role="switch" name="alerts" aria-labelledby="r1-label" checked /> <span class="cap-switch-state" aria-hidden="true">On</span></label>
  </div>
</div>
<!-- A setting the viewer cannot change: the reason under its name describes the disabled control. -->
<div class="cap-settings-row">
  <div class="cap-settings-row-text">
    <span class="cap-settings-row-label" id="r2-label">Send without review</span>
    <p class="cap-settings-row-reason" id="r2-reason">Only the account owner can change this.</p>
  </div>
  <div class="cap-settings-row-control">
    <label class="cap-switch"><input type="checkbox" role="switch" name="auto" aria-labelledby="r2-label" aria-describedby="r2-reason" disabled /> <span class="cap-switch-state" aria-hidden="true">Off</span></label>
  </div>
</div>
```

## Accessibility

The control's own; the back link is a link.

A switch is Capsomer's switch (a checkbox with `role="switch"`). The page head holds the one `h1`.
