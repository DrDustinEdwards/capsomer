// Schedule dialog: a datetime-local field in the Dialog, named by the browser's own time zone, a
// line that says the chosen time in the family's words, and a confirm that sends it as an ISO
// time. A past time is refused beside the field; Cancel and Esc send nothing.

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
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
import { Time } from "../time/time.react.tsx";
import { PAST_TIME, checkSchedule, localValue } from "./schedule-dialog.ts";

const noSubscribe = () => () => {};

// The browser's time zone once hydrated; null on the server and in the render that hydrates.
export function useBrowserZone(): string | null {
  return useSyncExternalStore(
    noSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    () => null,
  );
}

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
  const [value, setValue] = useState(() => (current ? localValue(current) : ""));
  // "Past" is measured when the time is chosen, not on every render.
  const [chosenAt, setChosenAt] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  // The input reads and writes the browser's own zone, so the field names it.
  const zone = useBrowserZone();
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
        {at && !problem ? (
          <p className="cap-schedule-dialog-lead" role="status">
            {lead} <Time at={at} format="exact" />.
          </p>
        ) : null}
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
