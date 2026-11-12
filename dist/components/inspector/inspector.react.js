import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// The inspector: everything about a text that is not the text (its details, checks, comments, search
// fields, history), in tabs beside the writing on a wide screen and in a sheet from the bottom on a
// phone, so the writing comes first everywhere. An editor, a book file and an AI draft page that use
// it put the same tab in the same place.
//
// `head` (saving and publishing) stays in the page on a phone, under the text, where it is reached by
// scrolling; only the tabs go in the sheet. One copy of the tabs is drawn at a time, so no field is in
// the page twice.
import { useEffect, useState } from "react";
import { Button } from "../button/button.react.js";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog.react.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs/tabs.react.js";
/** The width from which the tabs sit beside the text; below it they open in a sheet. */
export const INSPECTOR_WIDE = "(min-width: 1100px)";
// The server draws the wide layout; a narrow screen moves the tabs into the sheet once it is live.
function useWide(query) {
    const [wide, setWide] = useState(true);
    useEffect(() => {
        const q = window.matchMedia(query);
        const update = () => setWide(q.matches);
        update();
        q.addEventListener("change", update);
        return () => q.removeEventListener("change", update);
    }, [query]);
    return wide;
}
export function Inspector({ label, head, tabs, defaultTab, initialTab, wideQuery = INSPECTOR_WIDE, className, }) {
    const wide = useWide(wideQuery);
    const shown = tabs.filter((t) => t.content !== null && t.content !== undefined && t.content !== false);
    const asked = shown.find((t) => t.value === initialTab)?.value;
    const [tab, setTab] = useState(asked ?? defaultTab ?? shown[0]?.value ?? "");
    const [open, setOpen] = useState(asked !== undefined);
    const current = shown.some((t) => t.value === tab) ? tab : (shown[0]?.value ?? "");
    const needs = shown.reduce((n, t) => n + (t.count ?? 0), 0);
    const body = (_jsxs(Tabs, { value: current, onValueChange: setTab, className: "cap-inspector-tabs", children: [_jsx(TabsList, { "aria-label": label, variant: "line", size: "sm", children: shown.map((t) => (_jsx(TabsTrigger, { value: t.value, count: t.count || undefined, children: t.label }, t.value))) }), shown.map((t) => (_jsx(TabsContent, { value: t.value, className: "cap-inspector-panel", children: t.content }, t.value)))] }));
    return (_jsxs("aside", { className: className ? `cap-inspector ${className}` : "cap-inspector", "data-cap": "inspector", "aria-label": label, children: [head, wide ? (body) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "cap-inspector-open", children: [shown.map((t) => (_jsxs(Button, { size: "sm", onClick: () => {
                                    setTab(t.value);
                                    setOpen(true);
                                }, children: [t.label, t.count ? (_jsxs("span", { className: "cap-tab-count", children: [_jsx("span", { className: "cap-sr-only", children: ", " }), t.count] })) : null] }, t.value))), needs > 0 ? _jsxs("span", { className: "cap-sr-only", children: [needs, " need you"] }) : null] }), _jsxs(Dialog, { open: open, onOpenChange: setOpen, placement: "bottom", className: "cap-inspector-sheet", "aria-label": label, children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: label }) }), _jsx(DialogBody, { children: body })] })] }))] }));
}
