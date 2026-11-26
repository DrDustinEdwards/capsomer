import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Children, isValidElement, useLayoutEffect, useRef, useState, } from "react";
import { useRemembered } from "../hooks/hooks.react.js";
import { Switch } from "../switch/switch.react.js";
import { KINDS, KIND_LABEL, STORAGE_KEY, summarize, } from "./authorship.js";
export function Run({ kind, block = false, badge, children }) {
    const label = (_jsxs("span", { className: "cap-run-label", children: [badge, KIND_LABEL[kind]] }));
    return block ? (_jsxs("div", { className: "cap-run", "data-kind": kind, children: [label, children] })) : (_jsxs("span", { className: "cap-run", "data-kind": kind, children: [label, children] }));
}
function collect(node, kind, out) {
    Children.forEach(node, (child) => {
        if (typeof child === "string" || typeof child === "number") {
            if (kind)
                out.push({ kind, text: String(child) });
        }
        else if (isValidElement(child)) {
            const el = child;
            collect(el.props.children, el.type === Run && el.props.kind ? el.props.kind : kind, out);
        }
    });
}
function Meter({ summary }) {
    const bar = useRef(null);
    // Widths go through the CSSOM, never a style prop (style-src 'self').
    useLayoutEffect(() => {
        for (const seg of bar.current?.querySelectorAll(".cap-authorship-seg") ?? []) {
            const share = summary.shares.find((s) => s.kind === seg.dataset.kind);
            seg.style.setProperty("--cap-share", String(share?.percent ?? 0));
        }
    }, [summary]);
    return (_jsxs("div", { className: "cap-meter cap-authorship-summary", "data-cap-part": "summary", children: [_jsx("span", { className: "cap-meter-label", children: "Authorship" }), _jsx("span", { className: "cap-meter-value", "data-cap-part": "text", children: summary.text }), _jsx("span", { className: "cap-meter-bar", "aria-hidden": "true", ref: bar, children: summary.shares.map((s) => (_jsx("span", { className: "cap-authorship-seg", "data-kind": s.kind, "data-share": s.percent }, s.kind))) }), _jsx("span", { className: "cap-meter-note", "data-cap-part": "notes", children: summary.shares
                    .filter((s) => s.words > 0)
                    .map((s) => (_jsxs("span", { children: [KIND_LABEL[s.kind], ": ", s.words.toLocaleString("en"), " ", s.words === 1 ? "word" : "words"] }, s.kind))) })] }));
}
export function Authorship({ shown, onShownChange, defaultShown = true, remember = true, children, }) {
    const [own, setOwn] = useState(defaultShown);
    const [saved, save] = useRemembered(STORAGE_KEY);
    const keep = remember && shown === undefined;
    const on = shown ?? (keep && (saved === "on" || saved === "off") ? saved === "on" : own);
    const runs = [];
    collect(children, null, runs);
    const summary = summarize(runs.filter((r) => KINDS.includes(r.kind)));
    return (_jsxs("div", { className: "cap-authorship", "data-authorship": on ? "on" : "off", children: [_jsxs("div", { className: "cap-authorship-bar", children: [_jsx(Switch, { label: "Show authorship", checked: on, onCheckedChange: (next) => {
                            setOwn(next);
                            if (keep)
                                save(next ? "on" : "off");
                            onShownChange?.(next);
                        } }), _jsx(Meter, { summary: summary })] }), _jsx("div", { className: "cap-authorship-text", children: children })] }));
}
