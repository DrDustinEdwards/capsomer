// The dialog: one native <dialog> opened with showModal(), shared by every Capsomer overlay. The platform gives the top layer,
// inert page, focus trap and Esc; this adds focus placed on open and handed back on close, backdrop click, Esc held while busy,
// a history entry that Back takes away, and a keyboard stop on a scrolling body.
const openers = new WeakMap();
export function rememberOpener(dialog, opener = document.activeElement) {
    openers.set(dialog, opener);
}
// Where focus goes when the opener has gone (a revoked agent loses its Revoke button): data-cap-return, the fallback,
// another open dialog's Close button, then the main region.
function fallbackFor(dialog, fallback) {
    const sel = dialog.dataset.capReturn;
    const named = sel ? document.querySelector(sel) : null;
    let behind = null;
    for (const d of document.querySelectorAll("dialog[open]")) {
        if (d !== dialog)
            behind = d.querySelector("[data-cap-part='close']") ?? behind;
    }
    return [named, fallback ?? null, behind, document.querySelector("main")].filter((x) => !!x);
}
// Hands focus back after the next frame, so the action's changes have rendered. Only when focus is lost: a restored focus
// or a newly opened dialog stands.
export function returnFocus(dialog, fallback) {
    const from = openers.get(dialog);
    openers.delete(dialog);
    requestAnimationFrame(() => {
        const now = document.activeElement;
        const lost = !now || now === document.body || !now.isConnected || dialog.contains(now);
        if (!lost)
            return;
        const candidates = [];
        if (from instanceof HTMLElement && from.isConnected && from !== document.body)
            candidates.push(from);
        candidates.push(...fallbackFor(dialog, fallback));
        for (const el of candidates) {
            el.focus();
            if (document.activeElement === el)
                return;
        }
    });
}
export function isBackdropClick(dialog, e) {
    if (e.target !== dialog)
        return false;
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}
export function errorText(e) {
    if (e instanceof Error && e.message)
        return e.message;
    if (typeof e === "string" && e)
        return e;
    return "Something went wrong and nothing says what.";
}
// Busy while its action runs: Esc, Close, Cancel and the backdrop all refuse.
export function isBusy(dialog) {
    return dialog.getAttribute("aria-busy") === "true";
}
// Close and Cancel say busy with aria-disabled (not disabled), so focus stays where it was.
export function setDialogBusy(dialog, on) {
    for (const el of dialog.querySelectorAll("[data-cap-part='close'], [data-cap-part='cancel']")) {
        if (on)
            el.setAttribute("aria-disabled", "true");
        else
            el.removeAttribute("aria-disabled");
    }
    if (on)
        dialog.setAttribute("aria-busy", "true");
    else
        dialog.removeAttribute("aria-busy");
    syncClosedBy(dialog);
}
// Where the browser has `closedby` (Chrome 134, Firefox 141; not Safari) it does the light dismiss: "any" closes on backdrop or Esc,
// "closerequest" on Esc only (locked and alert dialogs), "none" on neither (busy). Elsewhere wireDialog's click handler does it.
export const NATIVE_LIGHT_DISMISS = typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype;
const OWN_CLOSEDBY = "data-cap-closedby";
export function syncClosedBy(dialog) {
    if (!NATIVE_LIGHT_DISMISS || dialog.hasAttribute(OWN_CLOSEDBY))
        return;
    const value = isBusy(dialog) ? "none" : isLocked(dialog) ? "closerequest" : "any";
    dialog.setAttribute("closedby", value);
}
// True when a click outside (or a swipe down) must not close it: locked, an alert dialog, busy, or unsaved input
// (field.ts marks a changed control data-cap-dirty). Esc, Close and Cancel still close.
export function isLocked(dialog) {
    return (dialog.hasAttribute("data-cap-modal-lock") ||
        dialog.getAttribute("role") === "alertdialog" ||
        isBusy(dialog) ||
        dialog.querySelector("form [data-cap-dirty]") !== null);
}
const states = new WeakMap();
function stateOf(dialog) {
    let s = states.get(dialog);
    if (!s) {
        s = { opts: {}, pushed: false, onPop: null, observer: null, down: false };
        states.set(dialog, s);
    }
    return s;
}
// The address a history-entry dialog pushes: data-cap-history names the prefix, the id comes from data-cap-history-id, data-cap-detail-id or the dialog's id.
export function historyHash(dialog) {
    const prefix = dialog.dataset.capHistory || "dialog";
    return `#${prefix}-${dialog.dataset.capHistoryId ?? dialog.dataset.capDetailId ?? dialog.id}`;
}
const FOCUSABLE = "a[href], button, input:not([type='hidden']), select, textarea, summary, [tabindex]";
function canFocus(el) {
    if (el.matches(":disabled") || el.closest("[hidden], [inert]"))
        return false;
    if (el.getAttribute("tabindex") === "-1")
        return false;
    return el.getClientRects().length > 0;
}
// Puts focus where a person starts: the given element, [autofocus], Cancel for an alert or destructive dialog (Enter on
// arrival must not do the damage), else the first control that is not Close or the scrolling body.
export function focusInitial(dialog, target) {
    const cancel = dialog.querySelector("[data-cap-part='cancel']");
    const destructive = dialog.getAttribute("role") === "alertdialog" || dialog.hasAttribute("data-cap-destructive");
    const all = [...dialog.querySelectorAll(FOCUSABLE)].filter(canFocus);
    const plain = all.filter((el) => el.dataset.capPart !== "close" && !el.hasAttribute("data-cap-scroll"));
    const choice = target ??
        dialog.querySelector("[autofocus]") ??
        (destructive && cancel && canFocus(cancel) ? cancel : null) ??
        plain[0] ??
        dialog.querySelector("[data-cap-part='close']") ??
        all[0] ??
        dialog;
    choice.focus();
    if (document.activeElement !== choice)
        dialog.focus();
}
// A body that overflows takes tabindex="0" so arrow keys scroll it.
export function syncScroll(dialog) {
    const body = dialog.querySelector(".cap-dialog-body");
    if (!body)
        return;
    const over = body.scrollHeight > body.clientHeight + 1;
    if (over && !body.hasAttribute("tabindex")) {
        body.tabIndex = 0;
        body.dataset.capScroll = "";
    }
    else if (!over && body.hasAttribute("data-cap-scroll")) {
        body.removeAttribute("tabindex");
        delete body.dataset.capScroll;
    }
}
// Wires one dialog and returns a function that unwires it. Idempotent.
export function wireDialog(dialog, opts = {}) {
    const s = stateOf(dialog);
    s.opts = { ...s.opts, ...opts };
    if (dialog.dataset.capReady !== undefined && dialog.dataset.capWired !== undefined)
        return () => undefined;
    dialog.dataset.capReady = "";
    dialog.dataset.capWired = "";
    if (dialog.hasAttribute("data-cap-alert") && !dialog.hasAttribute("role"))
        dialog.setAttribute("role", "alertdialog");
    if (NATIVE_LIGHT_DISMISS && dialog.hasAttribute("closedby"))
        dialog.setAttribute(OWN_CLOSEDBY, "");
    syncClosedBy(dialog);
    // A press that starts inside the dialog and ends on the backdrop (selecting text) is not a
    // click on the backdrop.
    const onDown = (e) => {
        s.down = isBackdropClick(dialog, e);
        // A locked dialog keeps focus where it was: the browser would move it to the dialog.
        if (s.down && isLocked(dialog))
            e.preventDefault();
    };
    const onClick = (e) => {
        const t = e.target;
        const closer = t instanceof Element
            ? t.closest("[data-cap-part='close'], [data-cap-part='cancel']")
            : null;
        if (closer && dialog.contains(closer)) {
            // This handler closes it; a closer written with command="close" must not also close it natively while busy.
            e.preventDefault();
            if (isBusy(dialog))
                return;
            // (A Cancel that is a link, so it works with no script, closes the modal instead of leaving: prevented above.)
            return dialog.close(closer.dataset.capPart);
        }
        const wasDown = s.down;
        s.down = false;
        if (NATIVE_LIGHT_DISMISS)
            return;
        if (wasDown && isBackdropClick(dialog, e) && !isLocked(dialog))
            dialog.close("backdrop");
    };
    // Esc while a request is in flight would hide its answer. The keydown is held as well as the
    // cancel event, because a browser may skip a cancel event that the page refused once.
    const onCancel = (e) => {
        if (isBusy(dialog))
            e.preventDefault();
    };
    const onKey = (e) => {
        if (e.key === "Escape" && isBusy(dialog))
            e.preventDefault();
        if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey)
            return;
        const stops = [...dialog.querySelectorAll(FOCUSABLE)].filter(canFocus);
        const first = stops[0];
        const last = stops[stops.length - 1];
        if (!first || !last)
            return;
        const at = document.activeElement;
        if (e.shiftKey && (at === first || at === dialog)) {
            e.preventDefault();
            last.focus();
        }
        else if (!e.shiftKey && at === last) {
            e.preventDefault();
            first.focus();
        }
    };
    const onSubmit = (e) => {
        if (isBusy(dialog) && e.target?.method === "dialog")
            e.preventDefault();
    };
    const onClose = () => {
        // A close event queued before the dialog was opened again is stale.
        if (dialog.open)
            return;
        s.observer?.disconnect();
        s.observer = null;
        if (s.onPop)
            window.removeEventListener("popstate", s.onPop);
        s.onPop = null;
        for (const c of dialog.querySelectorAll("[data-cap-dirty]"))
            delete c.dataset.capDirty;
        syncClosedBy(dialog);
        if (s.pushed) {
            s.pushed = false;
            history.back();
        }
        returnFocus(dialog, s.opts.returnTo);
    };
    const onInput = () => syncClosedBy(dialog);
    for (const t of ["input", "reset"])
        dialog.addEventListener(t, onInput);
    dialog.addEventListener("mousedown", onDown);
    dialog.addEventListener("click", onClick);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("keydown", onKey);
    dialog.addEventListener("submit", onSubmit);
    dialog.addEventListener("close", onClose);
    // Drag to dismiss (dialog-drag.ts) loads when a sheet first takes focus, which it does as it
    // opens, so a page whose sheets stay shut never downloads it.
    let unDrag = () => { };
    let gone = false;
    const onFirstFocus = () => {
        if (!["bottom", "right", "left"].includes(dialog.dataset.placement ?? ""))
            return;
        dialog.removeEventListener("focusin", onFirstFocus);
        // A server build (Vite sets import.meta.env.SSR) drops the chunk: no sheet takes focus there.
        if (import.meta.env?.SSR)
            return;
        void import("./dialog-drag.js").then((m) => {
            if (!gone)
                unDrag = m.wireDrag(dialog);
        });
    };
    dialog.addEventListener("focusin", onFirstFocus);
    return () => {
        gone = true;
        dialog.removeEventListener("focusin", onFirstFocus);
        unDrag();
        for (const t of ["input", "reset"])
            dialog.removeEventListener(t, onInput);
        dialog.removeEventListener("mousedown", onDown);
        dialog.removeEventListener("click", onClick);
        dialog.removeEventListener("cancel", onCancel);
        dialog.removeEventListener("keydown", onKey);
        dialog.removeEventListener("submit", onSubmit);
        dialog.removeEventListener("close", onClose);
        s.observer?.disconnect();
        s.observer = null;
        delete dialog.dataset.capReady;
        delete dialog.dataset.capWired;
        if (!dialog.hasAttribute(OWN_CLOSEDBY))
            dialog.removeAttribute("closedby");
        dialog.removeAttribute(OWN_CLOSEDBY);
    };
}
// Opens a dialog from the control that asked for it, remembering that control; with history, pushes "#<prefix>-<id>".
export function openDialog(dialog, opener = document.activeElement, opts = {}) {
    if (dialog.open && dialog.matches(":modal"))
        return;
    wireDialog(dialog, opts);
    const s = stateOf(dialog);
    rememberOpener(dialog, opener);
    // A dialog left open without showModal() (written with the open attribute) is not modal:
    // drop the attribute so showModal() can run.
    if (dialog.open)
        dialog.removeAttribute("open");
    dialog.showModal();
    focusInitial(dialog, s.opts.focus);
    syncScroll(dialog);
    s.observer?.disconnect();
    if (typeof ResizeObserver !== "undefined") {
        s.observer = new ResizeObserver(() => syncScroll(dialog));
        s.observer.observe(dialog);
        const body = dialog.querySelector(".cap-dialog-body");
        if (body)
            s.observer.observe(body);
    }
    const useHistory = s.opts.history ?? dialog.hasAttribute("data-cap-history");
    if (!useHistory)
        return;
    history.pushState({ capDialog: dialog.dataset.capHistoryId ?? dialog.dataset.capDetailId ?? dialog.id }, "", historyHash(dialog));
    s.pushed = true;
    s.onPop = () => {
        // Back: the entry is already gone, so closing must not go back again.
        s.pushed = false;
        if (dialog.open)
            dialog.close();
    };
    window.addEventListener("popstate", s.onPop);
}
export function closeDialog(dialog, returnValue) {
    if (dialog.open)
        dialog.close(returnValue);
}
// Wires every dialog under root and every [data-cap-dialog-open="<dialog id>"] trigger; a dialog with data-cap-open opens now.
// A trigger that is a link keeps its href for a new tab. Returns a function that detaches them all.
export function enhance(root = document) {
    const undo = [];
    for (const dialog of root.querySelectorAll("dialog[data-cap='dialog']:not([data-cap-ready])")) {
        // Shown in the page with no script (`open`, `data-cap-inline`): script takes it over, so it
        // is closed until a trigger opens it as the modal.
        if (dialog.hasAttribute("data-cap-inline") && dialog.open && !dialog.matches(":modal"))
            dialog.removeAttribute("open");
        undo.push(wireDialog(dialog));
        if (dialog.hasAttribute("data-cap-open") || dialog.hasAttribute("data-specimen-open"))
            openDialog(dialog, null);
    }
    for (const trigger of root.querySelectorAll("[data-cap-dialog-open]:not([data-cap-ready])")) {
        trigger.dataset.capReady = "";
        if (!trigger.hasAttribute("aria-haspopup"))
            trigger.setAttribute("aria-haspopup", "dialog");
        const onClick = (e) => {
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0)
                return;
            const dialog = document.getElementById(trigger.dataset.capDialogOpen ?? "");
            if (!(dialog instanceof HTMLDialogElement))
                return;
            e.preventDefault();
            openDialog(dialog, trigger);
        };
        trigger.addEventListener("click", onClick);
        undo.push(() => {
            trigger.removeEventListener("click", onClick);
            delete trigger.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
