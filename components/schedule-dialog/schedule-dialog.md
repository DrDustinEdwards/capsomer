---
name: schedule-dialog
title: Schedule dialog
summary: A dialog that asks when to publish, with a date and time field named by the browser's own time zone, the chosen time said back in words, a past time refused beside the field, and nothing sent until the confirm.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [closed, open with no time, a past time refused, a future time said back, replacing a time already set, sending]
added: 0.98.0
updated: 0.98.0
source: Carrel, app/components/editor/schedule-dialog.tsx (ScheduleDialog, localValue) and app/lib/hydrated.ts (useBrowserZone)
replaces:
  - "function ScheduleDialog\\b"
  - 'type="datetime-local"'
---

# Schedule dialog

Choosing when something goes live: a post, an update to a live page, a newsletter. A `datetime-local` field in the Dialog, its help naming the browser's own time zone ("In your time zone, America/Chicago."), a line under it that says the chosen time in the family's words ("Goes live Thursday, November 12, 2026, 9:30 AM CST (15:30 UTC)."), and a confirm that sends the time as an ISO string.

**Provenance.** EXTRACTED from Carrel's `ScheduleDialog`: the field and its zone line, the past check measured when the time was chosen (so a time that passes while the dialog is open is not refused under the person's eyes), the "Choose a time first." and "Choose a time in the future." refusals, the exact Time line, and an existing time as the field's start (field's `toDateTimeLocal`, in the browser's zone). REWROTE: the words are the app's (`title`, `description`, `confirm`, `lead`, `label`), where Carrel built them from a post's state; the confirm shows its pending state and closes the dialog when `onSchedule` resolves, and keeps the time for another try when it throws; the zone hook is part of the component.

## When to use it

Any one-way action that happens at a chosen time: publishing a post, an update to a live page, a send.

## When not to

- Choosing a date with no time (a deadline, a range): the date picker.
- Changing a time inline in a table or form: a Field with a `datetime-local` input.
- An action that happens now: its own button, with the publish gate where checks apply.

## The default and its reason

- **The field is the browser's own `datetime-local`**, which reads and writes the browser's zone and shows the time in its format. So the help names the zone, and the line under the field says the time again in the family's exact form, with UTC beside it.
- **A past time is refused beside the field**, with `aria-invalid`, and the confirm says why as its description; a missing time is said by the field's Required. "Past" is measured when the time is chosen.
- **Nothing is sent until the confirm.** Cancel, Esc and the close button send nothing, and focus returns to the button that opened it.
- **The confirm is pending while the app sends**, and the dialog closes when `onSchedule` resolves. When it throws, the dialog stays open with the time kept, and the app says why in its message region.
- **The confirm's words name the action**: "Schedule", "Schedule update", "Replace the update".

## Keyboard

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves between the field, Cancel and the confirm, kept inside the dialog |
| Up arrow, Down arrow (field) | Changes the part of the date or time with focus (the browser's own) |
| Enter (confirm) | Sends the time once it is in the future |
| Esc | Closes without sending; focus back on the opener |

## Accessibility

- The shared Dialog: modal, named by its title, described by its description, focus kept inside and returned.
- The field is a Field: label, Required, the zone as its description and a past time as its error.
- The line that says the time back is a `status`, so the chosen time is said once it is valid.
- The time is a `<time datetime>` (the Time component), in words, with UTC beside the local time.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

React only: the dialog's state is the chosen time.

```tsx
import { ScheduleDialog } from "capsomer/react/schedule-dialog";

<ScheduleDialog
  open={open}
  onClose={() => setOpen(false)}
  returnTo={opener}
  title="Schedule this post"
  description="The site publishes it at the time you choose. Revert to draft takes it back."
  current={pendingUpdate?.publishAt}
  onSchedule={async (iso) => {
    const result = await send("schedule", { publishAt: iso });
    if (!result.ok) throw new Error(result.message);
  }}
/>;
```

Props: `open`, `onClose`, `returnTo`, `onSchedule(iso)`, `title`, `description`, `current` (an ISO time the field starts at), `label` (default "Publish at"), `confirm` (default "Schedule") and `lead` (default "Goes live"). The zone comes from `useBrowserZone` in `capsomer/react/hooks`. `capsomer/behavior/schedule-dialog` holds the pure part: `checkSchedule(value, now)`, `NO_TIME` and `PAST_TIME`.

## Exceptions in production

None yet. Carrel's dialog is its source.
