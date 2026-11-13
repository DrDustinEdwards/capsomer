import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Schedule dialog: a datetime-local field in the Dialog, named by the browser's own time zone, a
// line that says the chosen time in the family's words, and a confirm that sends it as an ISO
// time. A past time is refused beside the field; Cancel and Esc send nothing.
import { useId, useState } from "react";
import { Button } from "../button/button.react.js";
import { Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "../dialog/dialog.react.js";
import { Field } from "../field/field.react.js";
import { Time } from "../time/time.react.js";
import { toDateTimeLocal } from "../field/field.js";
import { PAST_TIME, checkSchedule } from "./schedule-dialog.js";
import { useBrowserZone } from "../hooks/hooks.react.js";
export function ScheduleDialog({ open, onClose, returnTo, onSchedule, title, description, current = null, label = "Publish at", confirm = "Schedule", lead = "Goes live", }) {
    const titleId = `${useId()}-title`;
    const [value, setValue] = useState(() => current
        ? toDateTimeLocal(new Date(current), Intl.DateTimeFormat().resolvedOptions().timeZone)
        : "");
    // "Past" is measured when the time is chosen, not on every render.
    const [chosenAt, setChosenAt] = useState(() => Date.now());
    const [busy, setBusy] = useState(false);
    // The input reads and writes the browser's own zone, so the field names it.
    const zone = useBrowserZone(null);
    const { at, problem } = checkSchedule(value, chosenAt);
    const past = problem === PAST_TIME;
    const send = async () => {
        if (!at || problem)
            return;
        setBusy(true);
        try {
            await onSchedule(at.toISOString());
            onClose();
        }
        catch {
            // The app says why; the dialog keeps the time for another try.
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: (o) => !o && onClose(), placement: "center", size: "sm", returnTo: returnTo, "aria-labelledby": titleId, busy: busy, children: [_jsxs(DialogHeader, { divider: true, children: [_jsx(DialogTitle, { id: titleId, children: title }), description ? _jsx(DialogDescription, { children: description }) : null] }), _jsxs(DialogBody, { children: [_jsx(Field, { label: label, required: true, help: zone ? `In your time zone, ${zone}.` : undefined, error: past ? PAST_TIME : undefined, children: _jsx("input", { className: "cap-input", type: "datetime-local", value: value, onChange: (e) => {
                                setValue(e.target.value);
                                setChosenAt(Date.now());
                            } }) }), at && !problem ? (_jsxs("p", { className: "cap-schedule-dialog-lead", role: "status", children: [lead, " ", _jsx(Time, { at: at, format: "exact" }), "."] })) : null] }), _jsxs(DialogFooter, { align: "between", children: [_jsx(DialogClose, { part: "cancel", children: "Cancel" }), _jsx(Button, { variant: "primary", pending: busy, 
                        // Why it is refused is said once, under the field (a past time) or by its Required (no
                        // time yet); the button's own reason is its description.
                        disabledReason: problem ?? undefined, onClick: () => void send(), children: confirm })] })] }));
}
