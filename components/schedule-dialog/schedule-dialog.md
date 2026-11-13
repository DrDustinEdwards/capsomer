---
name: schedule-dialog
title: Schedule dialog
summary: A dialog that asks when to publish, names the time zone, and sends nothing until confirmed.
group: pattern
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

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves between the field, Cancel and the confirm, kept inside the dialog |
| Up arrow, Down arrow (field) | Changes the part of the date or time with focus (the browser's own) |
| Enter (confirm) | Sends the time once it is in the future |
| Esc | Closes without sending; focus back on the opener |

- The shared Dialog: modal, named by its title, described by its description, focus kept inside and returned.
- The field is a Field: label, Required, the zone as its description and a past time as its error.
- The line that says the time back is a `status`, so the chosen time is said once it is valid.
- The time is a `<time datetime>` (the Time component), in words, with UTC beside the local time.
