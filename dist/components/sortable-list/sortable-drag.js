// A pointer drag, shared with the tree. It starts once the pointer has moved a few pixels
// (so a click stays a click), follows the pointer, and ends on release (drop), or on
// Escape or a canceled pointer (cancel). After a drag, the click the release makes is
// swallowed, so a dragged link is not followed.
export const DRAG_THRESHOLD = 4;
// Puts `node` into `parent` before `ref` (null: at the end). Where the browser has moveBefore (Chrome 133, Firefox
// 144; not Safari) the node keeps its state while it moves: focus, a running transition, an open popover. Elsewhere
// it is the usual remove and insert, after which the caller puts focus back (Modern Web Guidance,
// move-dom-element-without-losing-state).
export function moveNode(parent, node, ref) {
    const p = parent;
    if (typeof p.moveBefore === "function" && node.isConnected && parent.isConnected) {
        try {
            p.moveBefore(node, ref);
            return;
        }
        catch {
            /* a move across documents or shadow roots throws: fall back */
        }
    }
    parent.insertBefore(node, ref);
}
export function startPointerDrag(down, h, threshold = DRAG_THRESHOLD) {
    if (down.button !== 0)
        return;
    const x0 = down.clientX;
    const y0 = down.clientY;
    let started = false;
    const off = () => {
        window.removeEventListener("pointermove", move, true);
        window.removeEventListener("pointerup", up, true);
        window.removeEventListener("pointercancel", cancel, true);
        window.removeEventListener("keydown", key, true);
    };
    const swallowClick = () => {
        const stop = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        window.addEventListener("click", stop, { capture: true, once: true });
        setTimeout(() => window.removeEventListener("click", stop, true), 0);
    };
    // Only the pointer that started the drag moves it: a second finger or a pen is ignored. Capturing it keeps the
    // drag's events coming when the pointer leaves the window (Modern Web Guidance, drag-and-drop).
    const id = down.pointerId;
    const holder = down.target instanceof Element ? down.target : null;
    try {
        holder?.setPointerCapture(id);
    }
    catch {
        /* a pointer already released cannot be captured */
    }
    const move = (e) => {
        if (e.pointerId !== id)
            return;
        if (!started) {
            if (Math.hypot(e.clientX - x0, e.clientY - y0) < threshold)
                return;
            started = true;
            h.onStart();
        }
        e.preventDefault();
        h.onMove(e.clientX, e.clientY);
    };
    const up = (e) => {
        if (e.pointerId !== id)
            return;
        off();
        if (!started)
            return;
        swallowClick();
        h.onDrop(e.clientX, e.clientY);
    };
    const cancel = (e) => {
        if (e.pointerId !== id)
            return;
        off();
        if (started)
            h.onCancel();
    };
    const key = (e) => {
        if (e.key !== "Escape" || !started)
            return;
        e.preventDefault();
        e.stopPropagation();
        off();
        window.addEventListener("pointerup", swallowClick, { capture: true, once: true });
        h.onCancel();
    };
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", cancel, true);
    window.addEventListener("keydown", key, true);
}
