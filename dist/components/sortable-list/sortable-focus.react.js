// Where focus goes after a list changes: back to the control that had it when React moves or remakes it, to the
// neighbor after Remove, into the new item after Add (sortable-list.react.tsx keeps the refs and says when).
import { useLayoutEffect } from "react";
import { locate } from "./sortable-list.js";
export function useSortFocus({ wantFocusRef, afterRemoveRef, addedRef, live, handles, controls, itemEls, addRef, total, laneIds, byId, getLabel, say, text, }) {
    // React may move or remake the focused element when it reorders: put focus back where it was.
    useLayoutEffect(() => {
        const w = wantFocusRef.current;
        if (!w)
            return;
        wantFocusRef.current = null;
        if (w.el?.isConnected) {
            if (document.activeElement !== w.el)
                w.el.focus({ preventScroll: true });
            return;
        }
        const at = locate(live.current, w.id);
        let part = w.part;
        if (at && part === "up" && at.index === 0)
            part = "down";
        if (at && part === "down" && at.index === (live.current[at.list]?.length ?? 0) - 1)
            part = "up";
        const el = part === "handle"
            ? (handles.current.get(w.id) ?? controls.current.get(`${w.id}:up`))
            : controls.current.get(`${w.id}:${part}`);
        if (el && document.activeElement !== el)
            el.focus({ preventScroll: true });
    });
    // After Remove: focus goes to the item that took the removed one's place, or the one before it,
    // or the Add button; after Add: into the new item's first field.
    useLayoutEffect(() => {
        const r = afterRemoveRef.current;
        if (r && total < r.total) {
            afterRemoveRef.current = null;
            const left = live.current[r.list] ?? [];
            const id = left[Math.min(r.index, left.length - 1)];
            // With no grip, the item's first button takes focus.
            const el = id === undefined
                ? addRef.current
                : (handles.current.get(id) ??
                    itemEls.current
                        .get(id)
                        ?.querySelector(".cap-sortable-steps button:enabled"));
            el?.focus({ preventScroll: true });
        }
        const a = addedRef.current;
        if (a && total > a.ids.size) {
            addedRef.current = null;
            const fresh = laneIds.flatMap((l) => live.current[l] ?? []).filter((id) => !a.ids.has(id));
            const id = fresh[fresh.length - 1];
            if (id !== undefined) {
                const body = itemEls.current
                    .get(id)
                    ?.querySelector(".cap-sortable-body :is(input, select, textarea, [contenteditable='true'], [tabindex='0'])");
                (body ?? handles.current.get(id) ?? controls.current.get(`${id}:up`))?.focus();
                const it = byId.get(id);
                if (it !== undefined)
                    say(text.added(getLabel(it), total));
            }
        }
    });
}
