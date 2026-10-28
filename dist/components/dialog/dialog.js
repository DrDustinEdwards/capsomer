// The dialog: one native <dialog> opened with showModal(), shared by every Capsomer overlay
// (confirm dialog, detail panel, command menu, shortcut sheet, the phone's More sheet). The
// platform gives the top layer, the inert page behind it, the focus trap and Esc; this module
// adds what it does not: focus placed on open and handed back on close, a click on the
// backdrop that closes (unless the dialog is locked or busy), Esc held while a request runs,
// an address entry that Back takes away, and a keyboard stop on a body that scrolls.
// No framework; the React wrapper and the other overlays call the same functions.
// ---------------------------------------------------------------------------------------
// Helpers every overlay shares (confirm-dialog.ts re-exports the first six for 0.1 imports).
const openers = new WeakMap();
// Remembers what had focus before the dialog opened, to hand focus back on close.
export function rememberOpener(dialog, opener = document.activeElement) {
    openers.set(dialog, opener);
}
// Where focus goes when the opener has gone (a revoked agent loses its Revoke button): the
// dialog's data-cap-return selector, the given fallback, the Close button of another dialog
// that is still open behind this one (a detail panel), then the page's main region.
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
// Hands focus back after a dialog closes. After the next frame, so whatever the action
// changed has rendered first (a revoked agent's row, and its button, may be gone). Only when
// focus is lost: if the browser already restored it, or a command opened another dialog,
// that focus stands.
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
// True when a mouse event landed on the dialog's backdrop rather than its content.
export function isBackdropClick(dialog, e) {
    if (e.target !== dialog)
        return false;
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}
// The text of a thrown value, for the error shown inside a dialog.
export function errorText(e) {
    if (e instanceof Error && e.message)
        return e.message;
    if (typeof e === "string" && e)
        return e;
    return "Something went wrong and nothing says what.";
}
let seq = 0;
export function uid(prefix) {
    seq += 1;
    return `${prefix}-${seq}`;
}
// A dialog is busy while its action runs: aria-busy on the dialog. Esc, Close, Cancel and the
// backdrop all refuse until it is cleared.
export function isBusy(dialog) {
    return dialog.getAttribute("aria-busy") === "true";
}
// Sets or clears busy. The Close and Cancel parts say so with aria-disabled (not disabled, so
// focus stays where it was).
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
}
// True when a click outside the dialog must not close it: it is locked, it is an alert
// dialog (one that asks a question the person must answer), or it is busy.
export function isLocked(dialog) {
    return dialog.hasAttribute("data-cap-modal-lock") || dialog.getAttribute("role") === "alertdialog" || isBusy(dialog);
}
// ---------------------------------------------------------------------------------------
// Drag to dismiss a sheet (Vaul). The header of a bottom, right or left sheet is its handle:
// it follows the pointer toward the sheet's edge, and on release the sheet closes, as Close
// would, when it went past a third of its size or was flung (faster than 0.5 px a ms);
// otherwise it springs back. Not while the dialog is locked or busy, nor under reduced motion;
// Esc, Close and focus return are unchanged.
// Whether a released drag dismisses: past a third of the sheet, or flung toward its edge.
function dragDismisses(moved, size, velocity) {
    return moved > size / 3 || (moved > 16 && velocity > 0.5);
}
function wireDrag(dialog) {
    let drag = null;
    const place = (px, dir) => {
        dialog.style.translate = `${px * dir[0]}px ${px * dir[1]}px`;
        dialog.style.setProperty("--cap-drag", String(drag ? Math.min(1, px / drag.size) : 0));
    };
    const onDown = (e) => {
        const placement = dialog.dataset.placement;
        const head = e.target.closest?.(".cap-dialog-header");
        if (e.button !== 0 || !head || head.closest("dialog") !== dialog || !dialog.open)
            return;
        if (!["bottom", "right", "left"].includes(placement ?? "") || isLocked(dialog) || matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
        if (e.target.closest("a, button, input, select, textarea, [contenteditable]"))
            return;
        const r = dialog.getBoundingClientRect();
        // Toward the edge it sits on, whatever the writing direction.
        const dir = placement === "bottom" ? [0, 1] : r.left < innerWidth - r.right ? [-1, 0] : [1, 0];
        drag = { id: e.pointerId, head, x: e.clientX, y: e.clientY, dir, size: placement === "bottom" ? r.height : r.width, moved: 0, t: e.timeStamp, v: 0, on: false };
        head.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
        if (!drag || e.pointerId !== drag.id)
            return;
        const along = (e.clientX - drag.x) * drag.dir[0] + (e.clientY - drag.y) * drag.dir[1];
        // A press that has not moved 4 px is still a click.
        if (!drag.on && Math.abs(along) < 4)
            return;
        drag.on = true;
        dialog.dataset.capDragging = "";
        const moved = Math.max(0, along);
        const dt = e.timeStamp - drag.t;
        if (dt > 0)
            drag.v = (moved - drag.moved) / dt;
        drag.moved = moved;
        drag.t = e.timeStamp;
        place(moved, drag.dir);
    };
    const onUp = (e) => {
        if (!drag || e.pointerId !== drag.id)
            return;
        const d = drag;
        drag = null;
        if (d.head.hasPointerCapture(e.pointerId))
            d.head.releasePointerCapture(e.pointerId);
        if (!d.on)
            return;
        delete dialog.dataset.capDragging;
        const css = getComputedStyle(dialog);
        const ease = (name) => css.getPropertyValue(name).trim() || "ease-out";
        const from = `${d.moved * d.dir[0]}px ${d.moved * d.dir[1]}px`;
        dialog.style.removeProperty("translate");
        dialog.style.removeProperty("--cap-drag");
        // A pointer that stopped before letting go was not flung.
        const v = e.timeStamp - d.t > 100 ? 0 : d.v;
        if (e.type === "pointerup" && dragDismisses(d.moved, d.size, v)) {
            // On out of the edge while it fades, then gone; the close is Close's, so focus returns.
            const off = dialog.animate({ translate: [from, `${d.size * d.dir[0]}px ${d.size * d.dir[1]}px`] }, { duration: parseFloat(css.getPropertyValue("--dur-fast")) || 100, easing: ease("--ease-out"), fill: "forwards" });
            off.onfinish = () => off.cancel();
            dialog.close("drag");
        }
        else {
            dialog.animate({ translate: [from, "0px 0px"] }, { duration: parseFloat(css.getPropertyValue("--dur-slow")) || 400, easing: ease("--ease-spring") });
        }
    };
    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointermove", onMove);
    dialog.addEventListener("pointerup", onUp);
    dialog.addEventListener("pointercancel", onUp);
    return () => {
        dialog.removeEventListener("pointerdown", onDown);
        dialog.removeEventListener("pointermove", onMove);
        dialog.removeEventListener("pointerup", onUp);
        dialog.removeEventListener("pointercancel", onUp);
    };
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
// The address a history-entry dialog pushes: data-cap-history may name the prefix
// ("detail" gives #detail-<id>); the id is data-cap-history-id, data-cap-detail-id or the
// dialog's id.
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
// Puts focus where a person starts: the given element, the [autofocus] one, Cancel when the
// dialog is an alert or marked destructive (Enter on arrival must not do the damage), else
// the first control that is not the Close button or the scrolling body, else Close, the body,
// the dialog itself.
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
// A body that scrolls must be reachable by keyboard: it takes tabindex="0" while it overflows
// (and gives it back when it does not), so arrow keys scroll it.
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
// Wires one dialog: a click on a Close or Cancel part, a click on the backdrop, Esc held
// while busy, and what happens on close (the address entry, focus back to the opener).
// Returns a function that unwires it. Idempotent for a dialog that is already wired.
export function wireDialog(dialog, opts = {}) {
    const s = stateOf(dialog);
    s.opts = { ...s.opts, ...opts };
    if (dialog.dataset.capReady !== undefined && dialog.dataset.capWired !== undefined)
        return () => undefined;
    dialog.dataset.capReady = "";
    dialog.dataset.capWired = "";
    if (dialog.hasAttribute("data-cap-alert") && !dialog.hasAttribute("role"))
        dialog.setAttribute("role", "alertdialog");
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
        const closer = t instanceof Element ? t.closest("[data-cap-part='close'], [data-cap-part='cancel']") : null;
        if (closer && dialog.contains(closer)) {
            if (isBusy(dialog))
                return;
            // A Cancel that is a link (so it works with no script) closes the modal instead of leaving.
            if (closer instanceof HTMLAnchorElement)
                e.preventDefault();
            return dialog.close(closer.dataset.capPart);
        }
        const wasDown = s.down;
        s.down = false;
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
        // Tab past the last control comes back to the first (and the reverse), so focus never
        // leaves for the browser's own controls: the page behind is inert.
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
    // A <form method="dialog"> closes natively; while busy it must not.
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
        // Closed by Esc or Close: take back the entry the dialog pushed, so Back goes where it
        // went before.
        if (s.pushed) {
            s.pushed = false;
            history.back();
        }
        returnFocus(dialog, s.opts.returnTo);
    };
    dialog.addEventListener("mousedown", onDown);
    dialog.addEventListener("click", onClick);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("keydown", onKey);
    dialog.addEventListener("submit", onSubmit);
    dialog.addEventListener("close", onClose);
    const unDrag = wireDrag(dialog);
    return () => {
        unDrag();
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
    };
}
// Opens a dialog from the control that asked for it, remembering that control. Focus is
// placed (see focusInitial); with history, "#<prefix>-<id>" is pushed so Back closes it.
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
// Wires every dialog under root ([data-cap="dialog"]) and every trigger
// [data-cap-dialog-open="<dialog id>"]. A dialog with data-cap-open (or the specimens'
// data-specimen-open) opens now. A dialog with data-cap-inline and `open` is in the page until
// this runs, then closed (see the markup on the doc page). A trigger that is a link keeps its href for a new tab; a plain
// click opens the dialog. Returns a function that detaches them all.
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
