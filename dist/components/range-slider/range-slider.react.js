import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { COMMIT_DELAY_MS, clampPair, rangeFill, trackPick } from "./range-slider.js";
// The HTML contract in range-slider.md.
export function RangeSlider({ label, min, max, low, high, step, names, handleLabels = [`Minimum ${label.toLowerCase()}`, `Maximum ${label.toLowerCase()}`], format = (v) => String(v), onCommit, className, }) {
    const id = useId();
    const root = useRef(null);
    const timer = useRef(null);
    const handles = useRef([]);
    const [lo, setLo] = useState(low);
    const [hi, setHi] = useState(high);
    // New values from the page move the handles (React's "storing information from previous renders").
    const [from, setFrom] = useState({ low, high });
    if (from.low !== low || from.high !== high) {
        setFrom({ low, high });
        setLo(low);
        setHi(high);
    }
    useEffect(() => {
        root.current?.style.setProperty("--cap-range-lo", rangeFill(lo, min, max));
        root.current?.style.setProperty("--cap-range-hi", rangeFill(hi, min, max));
    }, [lo, hi, min, max]);
    useEffect(() => () => {
        if (timer.current)
            clearTimeout(timer.current);
    }, []);
    const move = (value, which) => {
        const [a, b] = clampPair(which === "low" ? value : lo, which === "high" ? value : hi, { min, max, step }, which);
        setLo(a);
        setHi(b);
        if (!onCommit)
            return;
        if (timer.current)
            clearTimeout(timer.current);
        timer.current = setTimeout(() => onCommit(a, b), COMMIT_DELAY_MS);
    };
    return (_jsxs("div", { ref: root, className: className ? `cap-range-slider ${className}` : "cap-range-slider", role: "group", "aria-labelledby": `${id}-l`, children: [_jsxs("div", { className: "cap-range-slider-head", children: [_jsx("span", { className: "cap-range-slider-label", id: `${id}-l`, children: label }), _jsxs("output", { className: "cap-range-slider-value", "aria-hidden": "true", children: [format(lo, "low"), " \u2013 ", format(hi, "high")] })] }), _jsx("div", { className: "cap-range-slider-track", 
                // A press on the track away from the thumbs moves the nearer handle there (WCAG 2.5.7);
                // the keyboard has each handle's own keys, so the track itself takes no focus.
                onPointerDown: (e) => {
                    if (e.target !== e.currentTarget || e.button !== 0)
                        return;
                    e.preventDefault();
                    const { which, value } = trackPick(e.currentTarget, e.clientX, [lo, hi], {
                        min,
                        max,
                        step,
                    });
                    move(value, which);
                    handles.current[which === "low" ? 0 : 1]?.focus();
                }, children: ["low", "high"].map((which, i) => (_jsx("input", { ref: (el) => {
                        handles.current[i] = el;
                    }, type: "range", className: "cap-range cap-range-slider-input", name: names[i], min: min, max: max, step: step, value: which === "low" ? lo : hi, "aria-label": handleLabels[i], "aria-valuetext": format(which === "low" ? lo : hi, which), onChange: (e) => move(Number(e.target.value), which) }, which))) }), _jsxs("div", { className: "cap-range-slider-ends", "aria-hidden": "true", children: [_jsx("span", { children: format(min, "low") }), _jsx("span", { children: format(max, "high") })] })] }));
}
