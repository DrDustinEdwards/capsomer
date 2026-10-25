// The automation switch's behaviour. Clicking the switch, or Space on it, does not move it:
// it opens a one-line reason beside it. Enter applies (a reason is required), Esc cancels
// and returns focus to the switch. On apply it dispatches `cap:switch-applied` with
// { checked, reason, waitUntil }, and the switch moves: at once, or, when a listener calls
// waitUntil(promise), once that promise resolves. The app writes its audit row there and
// offers Undo through the message region.
//
// The flow is the Capsid Portal's ui/Switch.tsx (AutomationSwitch and ReasonForm, #216),
// without its API calls: the app's own listener does the sending.
import { clearError, showError } from "../field/field.js";
import { setBusy as setSwitchBusy, setSwitch } from "../switch/switch.js";
export { setSwitch };
export const EVENT = "cap:switch-applied";
export const MISSING = "Type a reason. It is recorded with the change.";
// What the reason is for, as the label's first words: "Turning seat start on". The label
// reads "<verb>. Reason:". An app with a better verb ("Pausing sample-d") sets data-verb-on
// and data-verb-off on the root.
export function verbFor(name, checked) {
    return `Turning ${name} ${checked ? "on" : "off"}`;
}
export function reasonLabel(verb) {
    return `${verb}. Reason:`;
}
export function failedMessage(name, checked, err) {
    const why = err instanceof Error && err.message ? ` ${err.message}` : "";
    return `Could not turn ${name} ${checked ? "on" : "off"}.${why} Try again, or press Esc to cancel.`;
}
function partsOf(root) {
    const sw = root.querySelector("input[role='switch']");
    const label = sw?.closest(".cap-switch");
    const form = root.querySelector("form.cap-switch-reason-form");
    const reason = form?.querySelector("input.cap-input");
    const ask = form?.querySelector(".cap-switch-reason-label");
    if (!sw || !label || !form || !reason || !ask)
        return null;
    return {
        sw,
        label,
        form,
        reason,
        ask,
        apply: form.querySelector("button[type='submit']"),
        cancel: form.querySelector("[data-cap-part='cancel']"),
    };
}
// Attaches to every [data-cap="switch-reason"] under root that is not attached yet.
// data-name on the root is the thing switched, as it reads in the label ("the improve
// loop"); without it, the switch's label is used. Returns a function that detaches them all.
export function enhance(root = document) {
    const undo = [];
    for (const el of root.querySelectorAll("[data-cap='switch-reason']:not([data-cap-ready])")) {
        const p = partsOf(el);
        if (!p)
            continue;
        el.dataset.capReady = "";
        const { sw, label, form, reason, ask, apply, cancel } = p;
        const name = el.dataset.name ?? label.textContent?.replace(/\s+(On|Off)\s*$/, "").trim() ?? "this";
        const verb = (next) => (next ? el.dataset.verbOn : el.dataset.verbOff) ?? verbFor(name, next);
        form.noValidate = true;
        let busy = false;
        // The state the flip asks for, fixed when the field opens, so a poll that lands
        // meanwhile and moves the switch cannot turn "off" into "on".
        let target = null;
        const setBusy = (on) => {
            busy = on;
            reason.readOnly = on;
            setSwitchBusy(label, on);
            if (on) {
                form.setAttribute("aria-busy", "true");
                apply?.setAttribute("aria-busy", "true");
            }
            else {
                form.removeAttribute("aria-busy");
                apply?.removeAttribute("aria-busy");
            }
        };
        // `next` is where the switch would move. A checkbox flips before its click handlers run
        // and is put back when one cancels the click, so inside the handler sw.checked already
        // holds the next state.
        const open = (next) => {
            if (!form.hidden)
                return reason.focus();
            target = next;
            reason.value = "";
            clearError(reason);
            ask.textContent = reasonLabel(verb(next));
            form.hidden = false;
            reason.focus();
        };
        const close = () => {
            form.hidden = true;
            target = null;
            reason.value = "";
            clearError(reason);
            sw.focus();
        };
        // A click (and Space, which clicks) would move the switch: stop it and ask instead.
        const onSwitchClick = (e) => {
            const next = sw.checked;
            e.preventDefault();
            open(next);
        };
        // Held while the request runs, so its answer is not hidden. Stopped here either way, so
        // an Esc that cancels the reason does not also close a panel the switch sits in.
        const onKey = (e) => {
            if (e.key !== "Escape")
                return;
            e.preventDefault();
            e.stopPropagation();
            if (!busy)
                close();
        };
        const onCancel = () => {
            if (!busy)
                close();
        };
        const onSubmit = (e) => {
            e.preventDefault();
            if (busy)
                return;
            // Read from the field, so a value filled in without an input event counts.
            const text = reason.value.trim();
            if (!text) {
                showError(reason, MISSING, true);
                reason.focus();
                return;
            }
            const next = target ?? !sw.checked;
            const held = [];
            const detail = { checked: next, reason: text, waitUntil: (promise) => void held.push(promise) };
            el.dispatchEvent(new CustomEvent(EVENT, { bubbles: true, detail }));
            const done = () => {
                setSwitch(label, next);
                close();
            };
            if (held.length === 0) {
                done();
                return;
            }
            clearError(reason);
            setBusy(true);
            Promise.all(held).then(() => {
                setBusy(false);
                done();
            }, (err) => {
                setBusy(false);
                showError(reason, failedMessage(name, next, err), true);
                reason.focus();
            });
        };
        sw.addEventListener("click", onSwitchClick);
        form.addEventListener("keydown", onKey);
        form.addEventListener("submit", onSubmit);
        cancel?.addEventListener("click", onCancel);
        undo.push(() => {
            sw.removeEventListener("click", onSwitchClick);
            form.removeEventListener("keydown", onKey);
            form.removeEventListener("submit", onSubmit);
            cancel?.removeEventListener("click", onCancel);
            delete el.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
