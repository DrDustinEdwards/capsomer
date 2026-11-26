import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { enhance, goToSection, markSections, measureBar, meetsRule, scrollParent, watchSections, } from "./anchor-bar.js";
const orientationAttr = (o) => (o === "vertical" ? "vertical" : undefined);
export function AnchorBar({ sections, always = false, label = "On this page", orientation = "horizontal", }) {
    const bar = { always, label, orientation };
    if (!sections)
        return _jsx(FoundAnchorBar, { ...bar });
    return _jsx(ListedAnchorBar, { sections: sections, ...bar });
}
// The list is the behavior module's: React renders it empty and never touches it. The bar starts hidden (no empty bar before script) and the module shows it.
function FoundAnchorBar({ always, label, orientation }) {
    const nav = useRef(null);
    useEffect(() => {
        const parent = nav.current?.parentElement;
        return parent ? enhance(parent) : undefined;
    }, []);
    return (_jsxs("nav", { ref: nav, className: "cap-anchors", "aria-label": label, "data-cap": "anchor-bar", "data-always": always || undefined, "data-orientation": orientationAttr(orientation), hidden: !always, children: [_jsx("span", { className: "cap-anchors-label", "aria-hidden": "true", children: label }), _jsx("ul", { className: "cap-anchors-list" })] }));
}
function ListedAnchorBar({ sections, always, label, orientation, }) {
    const nav = useRef(null);
    const [shown, setShown] = useState(always);
    const [current, setCurrent] = useState(null);
    const ids = sections.map((s) => s.id).join(" ");
    useEffect(() => {
        const el = nav.current;
        if (!el)
            return;
        const scroller = scrollParent(el);
        const headings = () => sections
            .map((s) => document.getElementById(s.id))
            .filter((h) => h !== null);
        const apply = () => setShown(always || meetsRule(headings(), scroller, el.offsetHeight));
        apply();
        const ro = new ResizeObserver(apply);
        ro.observe(scroller ?? document.documentElement);
        ro.observe(el);
        const scope = el.closest("main") ?? document.body;
        const mo = new MutationObserver(apply);
        mo.observe(scope, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["data-section", "id", "hidden"],
        });
        return () => {
            ro.disconnect();
            mo.disconnect();
        };
        // oxlint-disable-next-line react/exhaustive-deps -- the section ids identify what to watch
    }, [ids, always]);
    useEffect(() => {
        const el = nav.current;
        if (!el || !shown)
            return;
        const scroller = scrollParent(el);
        const headings = sections
            .map((s) => document.getElementById(s.id))
            .filter((h) => h !== null);
        markSections(headings);
        // After the next frame, once the bar is shown and has a height.
        const frame = requestAnimationFrame(() => measureBar(el, scroller));
        const stop = watchSections(headings, setCurrent, scroller);
        return () => {
            stop();
            cancelAnimationFrame(frame);
        };
        // oxlint-disable-next-line react/exhaustive-deps -- the section ids identify what to watch
    }, [ids, shown]);
    return (_jsxs("nav", { ref: nav, className: "cap-anchors", "aria-label": label, "data-cap": "anchor-bar", "data-orientation": orientationAttr(orientation), hidden: !shown, children: [_jsx("span", { className: "cap-anchors-label", "aria-hidden": "true", children: label }), _jsx("ul", { className: "cap-anchors-list", children: sections.map((s) => (_jsx("li", { children: _jsx("a", { href: `#${s.id}`, "aria-current": current === s.id ? "location" : undefined, onClick: (e) => {
                            const h = document.getElementById(s.id);
                            if (!h || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0)
                                return;
                            e.preventDefault();
                            goToSection(h);
                        }, children: s.label }) }, s.id))) })] }));
}
