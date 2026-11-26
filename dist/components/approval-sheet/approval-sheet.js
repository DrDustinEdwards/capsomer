// The approval sheet: several waiting gates approved together in one modal dialog (the shared
// dialog does the opening and focus); this adds the Approve count, pending and error states, and the event.
import { plural } from "@drdustinedwards/site-helpers/text";
import { isBusy, openDialog, setDialogBusy, wireDialog } from "../dialog/dialog.js";
export function approveLabel(n, pending = false) {
    return `${pending ? "Approving" : "Approve"} ${plural(n, "gate")}`;
}
export function titleText(n) {
    return n === 1 ? "1 gate is waiting" : `${n} gates are waiting`;
}
const part = (dialog, name) => dialog.querySelector(`[data-cap-part='${name}']`);
export function selection(dialog) {
    return [...dialog.querySelectorAll("input[data-cap-part='include']")]
        .filter((i) => i.checked)
        .map((i) => ({
        id: i.value,
        comment: i
            .closest("fieldset")
            ?.querySelector("[data-cap-part='comment']")
            ?.value.trim() ?? "",
    }));
}
export function isPending(dialog) {
    return (dialog.getAttribute("aria-busy") === "true" ||
        part(dialog, "approve")?.getAttribute("aria-busy") === "true");
}
export function update(dialog) {
    const n = selection(dialog).length;
    const approve = part(dialog, "approve");
    const label = part(dialog, "approve-label");
    const none = part(dialog, "none");
    if (label)
        label.textContent = approveLabel(n, isPending(dialog));
    if (approve) {
        if (n === 0) {
            approve.setAttribute("aria-disabled", "true");
            if (none?.id)
                approve.setAttribute("aria-describedby", none.id);
        }
        else {
            approve.removeAttribute("aria-disabled");
            approve.removeAttribute("aria-describedby");
        }
    }
    if (none)
        none.hidden = n !== 0;
}
// While a request is in flight Approve spins and Esc and the backdrop do nothing.
export function setPending(dialog, on) {
    const approve = part(dialog, "approve");
    if (dialog instanceof HTMLDialogElement)
        setDialogBusy(dialog, on);
    if (approve) {
        if (on) {
            approve.setAttribute("aria-busy", "true");
            if (!approve.querySelector(".cap-btn-spinner")) {
                const spin = document.createElement("span");
                spin.className = "cap-btn-spinner";
                spin.setAttribute("aria-hidden", "true");
                approve.prepend(spin);
            }
        }
        else {
            approve.removeAttribute("aria-busy");
            approve.querySelector(".cap-btn-spinner")?.remove();
        }
    }
    for (const gate of dialog.querySelectorAll("fieldset.cap-approval-gate"))
        gate.disabled = on;
    if (on)
        setError(dialog, null);
    update(dialog);
}
export function setError(dialog, message) {
    const box = part(dialog, "error");
    const text = part(dialog, "error-text");
    if (!box)
        return;
    if (message === null) {
        box.hidden = true;
        return;
    }
    if (text)
        text.textContent = message;
    box.hidden = false;
}
const attached = new WeakMap();
function attach(dialog) {
    const had = attached.get(dialog);
    if (had)
        return had;
    const unwire = wireDialog(dialog);
    update(dialog);
    const onChange = () => update(dialog);
    const onSubmit = (e) => {
        e.preventDefault();
        const gates = selection(dialog);
        if (gates.length === 0 || isPending(dialog) || isBusy(dialog))
            return;
        dialog.dispatchEvent(new CustomEvent("cap-approve", { bubbles: true, detail: { gates } }));
    };
    const form = dialog.querySelector("form");
    dialog.addEventListener("change", onChange);
    form?.addEventListener("submit", onSubmit);
    const detach = () => {
        dialog.removeEventListener("change", onChange);
        form?.removeEventListener("submit", onSubmit);
        unwire();
        attached.delete(dialog);
    };
    attached.set(dialog, detach);
    return detach;
}
// Focus starts on Cancel (the destructive rule); `opener` gets it back on close.
export function open(dialog, opener) {
    attach(dialog);
    update(dialog);
    openDialog(dialog, opener ?? document.activeElement);
}
export function close(dialog) {
    if (!isPending(dialog))
        dialog.close();
}
// Approving dispatches a bubbling "cap-approve" event ({ gates }) on the dialog; the app then calls
// setPending, and closes the sheet or calls setError.
export function enhance(root = document) {
    const undo = [];
    for (const dialog of root.querySelectorAll("dialog[data-cap='approval-sheet']")) {
        if (!attached.has(dialog))
            undo.push(attach(dialog));
    }
    const onOpen = (e) => {
        const btn = e.target.closest("[data-cap-opens]");
        if (!btn)
            return;
        const dialog = document.getElementById(btn.dataset.capOpens ?? "");
        if (dialog instanceof HTMLDialogElement && dialog.dataset.cap === "approval-sheet")
            open(dialog, btn);
    };
    document.addEventListener("click", onOpen);
    undo.push(() => document.removeEventListener("click", onOpen));
    return () => undo.forEach((f) => f());
}
