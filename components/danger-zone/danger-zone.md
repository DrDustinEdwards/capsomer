---
name: danger-zone
title: Danger zone
summary: The risky controls of a form or a detail, set apart from the safe ones under a "Danger" label at the end.
group: pattern
parts: [css, react]
tool: native
states: [one control with a note, two controls, button hover]
added: 0.94.0
source: the Capsid Portal's Danger (dashboard/src/views/shared.tsx, the UX audit's M9)
replaces:
  - 'data-danger=""'
  - 'aria-label="Danger"'
---

# Danger zone

## Usage

```html
<div class="cap-danger" role="group" aria-labelledby="danger-1">
  <p class="cap-danger-title" id="danger-1">Danger</p>
  <div class="cap-danger-actions">
    <button type="button" class="cap-btn" data-variant="danger">Remove site</button>
    <span class="cap-danger-note">The watcher stops probing it. Its history stays.</span>
  </div>
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to each control in the zone, in order |

- `role="group"` named by its visible label (`aria-labelledby`).
- The label and the note reach 4.5:1 on `--crit-soft` (checked in the spec).
- In forced colors the border stays, so the zone is still framed.
