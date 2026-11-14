// Schedule dialog: a datetime-local field in the Dialog, named by the browser's own time zone, a
// line that says the chosen time in the family's words, and a confirm that sends it as an ISO
// time. A past time is refused beside the field; Cancel and Esc send nothing.

import { useEffect, useId, useState, type ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog/dialog.react.tsx";
import { Field } from "../field/field.react.tsx";
import { toDateTimeLocal } from "../field/field.ts";
import { Time } from "../time/time.react.tsx";
import { PAST_TIME, checkSchedule } from "./schedule-dialog.ts";
import { useBrowserZone } from "../hooks/hooks.react.tsx";

export interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  // Focus goes back here when it closes: the button that opened it.
  returnTo?: HTMLElement | null;
  // Sends the time, as an ISO string; the dialog closes when it resolves, and stays (with the
  // app's message said elsewhere) when it throws.
  onSchedule: (iso: string) => Promise<void> | void;
  title: ReactNode;
  description?: ReactNode;
  // A time already scheduled, as an ISO time: the field starts at it.
  current?: string | null;
  label?: string;
  // The confirm's words. Default "Schedule".
  confirm?: ReactNode;
  // The line under the field once a time is chosen. Default "Goes live" and the time.
  lead?: string;
}

export function ScheduleDialog({
  open,
  onClose,
  returnTo,
  onSchedule,
  title,
  description,
  current = null,
  label = "Publish at",
  confirm = "Schedule",
  lead = "Goes live",
}: ScheduleDialogProps) {
  const titleId = `${useId()}-title`;
  // The input's value: `current` on the browser's wall clock (the runtime's zone before hydration).
  const startValue = () =>
    current
      ? toDateTimeLocal(new Date(current), Intl.DateTimeFormat().resolvedOptions().timeZone)
      : "";
  const [value, setValue] = useState(startValue);
  // "Past" is measured when the time is chosen, not on every render.
  const [chosenAt, setChosenAt] = useState(() => Date.now());
  // The dialog stays mounted while closed: each opening starts again from `current`, which may be
  // another item's, and measures "past" from then.
  useEffect(() => {
    if (!open) return;
    setValue(startValue());
    setChosenAt(Date.now());
    // oxlint-disable-next-line react/exhaustive-deps -- only an opening resets it; `current` is read as it is then
  }, [open]);
  const [busy, setBusy] = useState(false);
  // The input reads and writes the browser's own zone, so the field names it.
  const zone = useBrowserZone(null);
  const { at, problem } = checkSchedule(value, chosenAt);
  const past = problem === PAST_TIME;
  const send = async () => {
    if (!at || problem) return;
    setBusy(true);
    try {
      await onSchedule(at.toISOString());
      onClose();
    } catch {
      // The app says why; the dialog keeps the time for another try.
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      placement="center"
      size="sm"
      returnTo={returnTo}
      aria-labelledby={titleId}
      busy={busy}
    >
      <DialogHeader divider>
        <DialogTitle id={titleId}>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      <DialogBody>
        <Field
          label={label}
          required
          help={zone ? `In your time zone, ${zone}.` : undefined}
          error={past ? PAST_TIME : undefined}
        >
          <input
            className="cap-input"
            type="datetime-local"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setChosenAt(Date.now());
            }}
          />
        </Field>
        {/* On the page from the start and filled, so a screen reader hears the first time too. */}
        <p className="cap-schedule-dialog-lead" role="status">
          {at && !problem ? (
            <>
              {lead} <Time at={at} format="exact" />.
            </>
          ) : null}
        </p>
      </DialogBody>
      <DialogFooter align="between">
        <DialogClose part="cancel">Cancel</DialogClose>
        <Button
          variant="primary"
          pending={busy}
          // Why it is refused is said once, under the field (a past time) or by its Required (no
          // time yet); the button's own reason is its description.
          disabledReason={problem ?? undefined}
          onClick={() => void send()}
        >
          {confirm}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
