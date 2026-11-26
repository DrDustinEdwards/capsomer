// The confirm dialog: preview, then perform, for an action that cannot be undone. An alert dialog on
// the shared dialog (focus starts on Cancel; a click outside does nothing, so a typed reason is never lost).
import { isImeEnter } from "../shortcuts/shortcuts.js";
import { errorText, isBusy, openDialog, setDialogBusy, wireDialog } from "../dialog/dialog.js";
// The typed-word guard lives in confirm-server.ts, which a Worker imports without the DOM code.
import { wordMatches } from "./confirm-server.js";
import { svgGlyph, buildConfirm } from "./confirm-build.js";
export { buildConfirm } from "./confirm-build.js";
// The typed-word guard as an HTML `pattern` for the no-script form (each letter a class of both
// cases). The browser does not trim, and markup is not a guard: the server must still check the word.
export function wordPattern(word) {
    return Array.from(word.trim())
        .map((ch) => /[a-z]/i.test(ch)
        ? `[${ch.toUpperCase()}${ch.toLowerCase()}]`
        : ch.replace(/[\^$.*+?()[\]{}|/]/g, "\\$&"))
        .join("");
}
const performs = new WeakMap();
const performedFlags = new WeakSet();
const part = (dialog, name) => dialog.querySelector(`[data-cap-part='${name}']`);
// Read from the field itself, so text filled in without an input event still counts.
export function reasonOf(dialog) {
    return part(dialog, "reason")?.value.trim() ?? "";
}
function markReason(dialog, invalid) {
    const field = part(dialog, "reason");
    if (!field)
        return;
    const note = part(dialog, "reason-note")?.id;
    const errorId = part(dialog, "error")?.id;
    if (invalid) {
        field.setAttribute("aria-invalid", "true");
        const ids = [errorId, note].filter(Boolean).join(" ");
        if (ids)
            field.setAttribute("aria-describedby", ids);
    }
    else {
        field.removeAttribute("aria-invalid");
        if (note)
            field.setAttribute("aria-describedby", note);
        else
            field.removeAttribute("aria-describedby");
    }
}
// The perform button keeps the action's name; while the guard word is not typed it is aria-disabled.
function syncGuard(dialog) {
    const perform = part(dialog, "perform");
    if (!perform || isBusy(dialog))
        return;
    const input = part(dialog, "typed");
    const word = input?.dataset.capWord;
    if (!input || !word) {
        perform.removeAttribute("aria-disabled");
        return;
    }
    if (wordMatches(input.value, word)) {
        perform.removeAttribute("aria-disabled");
        perform.removeAttribute("aria-describedby");
    }
    else {
        perform.setAttribute("aria-disabled", "true");
        const label = dialog.querySelector(`label[for='${CSS.escape(input.id)}']`);
        if (label?.id)
            perform.setAttribute("aria-describedby", label.id);
    }
}
// Busy: aria-disabled rather than disabled, so focus stays on the button that was pressed.
export function setBusy(dialog, on) {
    const perform = part(dialog, "perform");
    const input = part(dialog, "typed");
    const reason = part(dialog, "reason");
    setDialogBusy(dialog, on);
    if (on) {
        perform?.setAttribute("aria-busy", "true");
        perform?.setAttribute("aria-disabled", "true");
        if (input)
            input.readOnly = true;
        if (reason)
            reason.readOnly = true;
    }
    else {
        perform?.removeAttribute("aria-busy");
        perform?.removeAttribute("aria-disabled");
        if (input)
            input.readOnly = false;
        if (reason)
            reason.readOnly = false;
        syncGuard(dialog);
    }
}
export function showError(dialog, message) {
    const box = part(dialog, "error");
    const perform = part(dialog, "perform");
    if (box) {
        const lead = document.createElement("p");
        lead.className = "cap-confirm-error-lead";
        lead.append(glyph(), document.createTextNode("Not done. Nothing was changed."));
        const why = document.createElement("p");
        why.textContent = message;
        box.replaceChildren(lead, why);
    }
    if (perform) {
        if (!perform.dataset.capLabel)
            perform.dataset.capLabel = perform.textContent ?? "";
        perform.textContent = "Try again";
    }
}
// An empty reason: nothing was tried, so no "Not done" is shown; mark the field and focus it.
export function showReasonError(dialog) {
    const box = part(dialog, "error");
    if (box) {
        const lead = document.createElement("p");
        lead.className = "cap-confirm-error-lead";
        lead.append(glyph(), document.createTextNode("A reason is required."));
        const why = document.createElement("p");
        why.textContent = "Type what you are doing and why, then try again. Nothing was changed.";
        box.replaceChildren(lead, why);
    }
    markReason(dialog, true);
    part(dialog, "reason")?.focus();
}
export function clearError(dialog) {
    part(dialog, "error")?.replaceChildren();
    markReason(dialog, false);
    const perform = part(dialog, "perform");
    if (perform?.dataset.capLabel) {
        perform.textContent = perform.dataset.capLabel;
        delete perform.dataset.capLabel;
    }
}
const ERROR_GLYPH = "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4v5h1.6V4zM7.2 10.4V12h1.6v-1.6z";
const glyph = () => svgGlyph(ERROR_GLYPH, 14);
export function bindPerform(dialog, perform) {
    performs.set(dialog, perform);
}
export function openConfirm(dialog, opener = document.activeElement) {
    if (dialog.open)
        return;
    if (!wired.has(dialog))
        wire(dialog);
    performedFlags.delete(dialog);
    syncGuard(dialog);
    openDialog(dialog, opener, { focus: part(dialog, "cancel") });
}
export function wasPerformed(dialog) {
    return performedFlags.has(dialog);
}
const wired = new WeakMap();
// Wires one dialog on the shared dialog's rules, then the perform button, guard and reason. Idempotent.
export function wire(dialog, fallback) {
    const had = wired.get(dialog);
    if (had)
        return had;
    if (!dialog.hasAttribute("role"))
        dialog.setAttribute("role", "alertdialog");
    const unwireBase = wireDialog(dialog, { returnTo: fallback ?? null });
    const perform = part(dialog, "perform");
    const input = part(dialog, "typed");
    const reason = part(dialog, "reason");
    syncGuard(dialog);
    const run = async (e) => {
        if (isBusy(dialog))
            return e.preventDefault();
        if (perform?.getAttribute("aria-disabled") === "true") {
            e.preventDefault();
            input?.focus();
            return;
        }
        // A required reason is never a silently disabled button: the press says what is missing.
        if (reason && !reasonOf(dialog)) {
            e.preventDefault();
            clearError(dialog);
            showReasonError(dialog);
            return;
        }
        const fn = performs.get(dialog);
        if (!fn) {
            if (perform?.type === "submit" && perform.form)
                setBusy(dialog, true);
            return;
        }
        e.preventDefault();
        clearError(dialog);
        setBusy(dialog, true);
        try {
            await fn(reasonOf(dialog));
            performedFlags.add(dialog);
            setBusy(dialog, false);
            dialog.close("performed");
        }
        catch (err) {
            setBusy(dialog, false);
            showError(dialog, errorText(err));
            perform?.focus();
        }
    };
    const onPerform = (e) => void run(e);
    const onKey = (e) => {
        // legacy-scan:keep ime-safe-enter-submit isImeEnter (shortcuts.ts) checks isComposing and keyCode 229; the scanner cannot follow it.
        if (e.key === "Enter" && e.target === input && !isImeEnter(e)) {
            e.preventDefault();
            if (input && wordMatches(input.value, input.dataset.capWord))
                perform?.click();
        }
        // Ctrl or Cmd with Enter performs from the reason field; a plain Enter is a new line.
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.target === reason) {
            e.preventDefault();
            perform?.click();
        }
    };
    const onInput = () => syncGuard(dialog);
    const onClose = () => {
        if (input)
            input.value = "";
        if (reason)
            reason.value = "";
        clearError(dialog);
        syncGuard(dialog);
    };
    perform?.addEventListener("click", onPerform);
    dialog.addEventListener("keydown", onKey);
    input?.addEventListener("input", onInput);
    dialog.addEventListener("close", onClose);
    const off = () => {
        perform?.removeEventListener("click", onPerform);
        dialog.removeEventListener("keydown", onKey);
        input?.removeEventListener("input", onInput);
        dialog.removeEventListener("close", onClose);
        unwireBase();
        wired.delete(dialog);
    };
    wired.set(dialog, off);
    return off;
}
export function confirm(o) {
    const opener = document.activeElement;
    const dialog = buildConfirm(o);
    document.body.append(dialog);
    bindPerform(dialog, o.perform);
    const unwire = wire(dialog, o.returnTo);
    return new Promise((resolve) => {
        dialog.addEventListener("close", () => {
            const done = wasPerformed(dialog);
            unwire();
            dialog.remove();
            resolve(done);
        }, { once: true });
        openConfirm(dialog, opener);
    });
}
const approved = new WeakSet();
// In place of window.confirm on a form: holds the submit, asks, then sends the form again (with the same
// button) once the action is chosen.
export function confirmSubmit(e, o) {
    const target = e.currentTarget;
    if (approved.delete(target))
        return;
    const form = target instanceof HTMLFormElement ? target : target.form;
    if (!form)
        return;
    e.preventDefault();
    const submitter = e.submitter ??
        e.nativeEvent?.submitter ??
        null;
    void confirm({ body: [], ...o, perform: () => Promise.resolve() }).then((yes) => {
        if (!yes)
            return;
        if (target === form)
            approved.add(form);
        form.requestSubmit(target === form ? submitter : target);
    });
}
export function enhance(root = document) {
    const undo = [];
    for (const dialog of root.querySelectorAll("dialog[data-cap='confirm-dialog']:not([data-cap-ready])")) {
        undo.push(wire(dialog));
    }
    for (const trigger of root.querySelectorAll("[data-cap-confirm-open]:not([data-cap-ready])")) {
        trigger.dataset.capReady = "";
        const onClick = (e) => {
            const dialog = document.getElementById(trigger.dataset.capConfirmOpen ?? "");
            if (!(dialog instanceof HTMLDialogElement))
                return;
            e.preventDefault();
            openConfirm(dialog, trigger);
        };
        trigger.addEventListener("click", onClick);
        undo.push(() => {
            trigger.removeEventListener("click", onClick);
            delete trigger.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
