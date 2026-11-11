import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useState } from "react";
import { Glyph } from "../status/status.react.js";
import { allVisibleSelected, failedIds, toggleAllVisible, toggleOne, visibleSelection, countText, fillCount, orderOutcomes, outcomeSummary, performBulk, } from "./bulk-bar.js";
import { useHydrated } from "../hooks/hooks.react.js";
export function BulkBar({ items, actions, onClear, total, onSelectAll, detail, position = "bottom", returnTo, children, label = "Bulk actions", form, prompt, outcomes = [], onDismissOutcomes, }) {
    // False on the server and while hydrating, true once hydrated.
    const mounted = useHydrated();
    const resultsId = `${useId().replace(/[^a-zA-Z0-9]/g, "")}-results`;
    const showing = outcomes.length > 0;
    const n = items.length;
    // A status region that is shown and filled in one step is often missed: the count is written
    // a frame after the bar appears.
    const [shown, setShown] = useState(n);
    useEffect(() => {
        if (n === 0) {
            // oxlint-disable-next-line react/set-state-in-effect -- the count is written a frame after the bar appears, so screen readers hear it
            setShown(0);
            return;
        }
        if (shown > 0) {
            setShown(n);
            return;
        }
        const f = requestAnimationFrame(() => setShown(n));
        return () => cancelAnimationFrame(f);
    }, [n, shown]);
    const run = async (a) => {
        const ok = await performBulk({
            action: typeof a.label === "string" ? a.label : a.id,
            items,
            run: a.run ?? (() => undefined),
            undo: a.undo,
            destructive: a.destructive,
            confirmTitle: a.confirmTitle,
            confirmLead: a.confirmLead,
            confirmAction: a.confirmAction,
            said: a.said,
            undone: a.undone,
            returnTo,
        });
        if (ok)
            onClear();
    };
    return (_jsxs("div", { className: "cap-bulk", "data-cap": "bulk-bar", role: "region", "aria-label": label, "data-position": position === "top" ? "top" : undefined, hidden: (form ? mounted && n === 0 : n === 0) && !showing, onKeyDown: (e) => {
            if (e.key === "Escape" && !e.defaultPrevented && n > 0) {
                e.preventDefault();
                onClear();
            }
        }, children: [_jsxs("p", { className: "cap-bulk-count", role: "status", children: [shown > 0
                        ? countText(shown)
                        : !mounted && form && prompt
                            ? prompt
                            : showing && mounted
                                ? "Nothing selected"
                                : "", shown > 0 && detail ? (_jsxs(_Fragment, { children: [" ", _jsx("span", { className: "cap-bulk-detail", children: detail })] })) : null] }), onSelectAll && total != null && n < total ? (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "quiet", "data-cap-part": "select-all", onClick: onSelectAll, children: fillCount("Select all {n} in view", total) })) : null, _jsxs("div", { className: "cap-bulk-actions", children: [children, actions.map((a) => a.submit ? (_jsx("button", { type: "submit", form: form, name: "intent", value: a.id, className: "cap-btn", "data-variant": a.destructive ? "danger" : undefined, "aria-disabled": a.disabled || undefined, children: a.label }, a.id)) : (_jsx("button", { type: "button", className: "cap-btn", "data-variant": a.destructive ? "danger" : undefined, "data-cap-bulk-action": a.id, "aria-disabled": a.disabled || undefined, onClick: () => (a.disabled ? undefined : void run(a)), children: a.label }, a.id)))] }), _jsx("button", { type: "button", className: "cap-btn cap-bulk-clear", "data-variant": "quiet", onClick: onClear, children: "Clear selection" }), showing ? (_jsxs("div", { className: "cap-bulk-results", "data-cap-part": "results", role: "group", "aria-labelledby": resultsId, children: [_jsx("p", { className: "cap-bulk-results-summary", id: resultsId, children: outcomeSummary(outcomes) }), _jsx("ul", { className: "cap-bulk-results-list", children: orderOutcomes(outcomes).map((o) => (_jsxs("li", { "data-ok": String(o.ok), children: [_jsxs("span", { className: "cap-status", "data-tone": o.ok ? "ok" : "crit", children: [_jsx(Glyph, { name: o.ok ? "ok" : "crit" }), o.ok ? "Done" : "Not done"] }), " ", _jsx("span", { className: "cap-bulk-result-label", children: o.label }), o.message ? (_jsxs(_Fragment, { children: [" ", _jsx("span", { className: "cap-bulk-result-message", children: o.message })] })) : null, o.usedBy?.length ? (_jsx("ul", { className: "cap-bulk-result-uses", children: o.usedBy.map((u) => (_jsx("li", { children: u }, u))) })) : null] }, o.id))) }), onDismissOutcomes ? (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "quiet", "data-size": "sm", "data-cap-part": "dismiss-results", hidden: !mounted, onClick: onDismissOutcomes, children: "Dismiss results" })) : null] })) : null] }));
}
// A React list's selection: stored ids, read through what is in view, so a filter or a new page
// never leaves a hidden row selected.
export function useBulkSelection(rows) {
    const [selected, setSelected] = useState(() => new Set());
    const ids = visibleSelection(selected, rows);
    const allSelected = allVisibleSelected(selected, rows);
    return {
        ids,
        has: (id) => selected.has(id) && rows.some((r) => r.id === id),
        toggle: (id) => setSelected((s) => toggleOne(s, id)),
        toggleAll: () => setSelected((s) => toggleAllVisible(s, rows)),
        allSelected,
        someSelected: ids.length > 0 && !allSelected,
        clear: () => setSelected(new Set()),
        keepFailed: (outcomes) => setSelected(failedIds(outcomes)),
    };
}
