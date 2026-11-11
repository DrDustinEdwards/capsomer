---
name: danger-zone
title: Danger zone
summary: The risky controls of a form or a detail, set apart from the safe ones under a "Danger" label at the end.
parts: [css, react]
tool: native
states: [one control with a note, two controls, button hover]
added: 0.91.0
source: the Capsid Portal's Danger (dashboard/src/views/shared.tsx, the UX audit's M9)
replaces:
  - 'data-danger=""'
  - 'aria-label="Danger"'
---

# Danger zone

A red-edged area, last in a form or a detail view, holding the controls that remove, delete or fail something. Its own label says what it is, so a Remove is never the button beside Edit or Resume.

## When to use it

Any view with a control that destroys or ends something: remove a site, delete a project, mark a job failed, revoke a key.

## When not to

- **One destructive action in a list row**: a danger button in the row's menu, with a confirm dialog.
- **A warning with no control**: a banner.

## The default and its reason

- **Last on the page or form**, after Save and every safe control (GOV.UK and GitHub settings put it last): the reader reaches it on purpose.
- **Labeled "Danger"** in small capitals, and the group is named by that label, so a screen reader announces the group before its buttons.
- **The edge is `--crit`, the ground `--crit-soft`**; the label and text stay `--text`, never red text on red ground.
- **Each control still previews and confirms** (the confirm dialog or confirm page). The zone sets them apart; it does not make them safe.
- **A note beside the controls** says what is kept ("Its history stays."), in `--muted`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to each control in the zone, in order |

## Accessibility

- `role="group"` named by its visible label (`aria-labelledby`).
- The label and the note reach 4.5:1 on `--crit-soft` (checked in the spec).
- In forced colors the border stays, so the zone is still framed.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

```html
<div class="cap-danger" role="group" aria-labelledby="danger-1">
  <p class="cap-danger-title" id="danger-1">Danger</p>
  <div class="cap-danger-actions">
    <button type="button" class="cap-btn" data-variant="danger">Remove site</button>
    <span class="cap-danger-note">The watcher stops probing it. Its history stays.</span>
  </div>
</div>
```

React: `DangerZone` from `capsomer/react/danger-zone` takes `title` (default "Danger"), `note` and the controls as `children`. Load `danger-zone.css` and `button.css`.

## Exceptions in production

None yet.
