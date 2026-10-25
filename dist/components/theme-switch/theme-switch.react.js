import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { attach as attachTip } from "../tooltip/tooltip.js";
import { applyTheme, effectiveTheme, readTheme, themeButtonLabel, THEME_PREF, toggleTheme } from "./theme-switch.js";
const Sun = () => (_jsxs("svg", { className: "cap-theme-icon", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: [_jsx("circle", { cx: "8", cy: "8", r: "3" }), _jsx("path", { d: "M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" })] }));
const Moon = () => (_jsx("svg", { className: "cap-theme-icon", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: "M13.5 9.3A5.5 5.5 0 0 1 6.7 2.5a5.5 5.5 0 1 0 6.8 6.8z" }) }));
const CHOICES = [
    { value: "light", label: "Light", icon: _jsx(Sun, {}) },
    { value: "dark", label: "Dark", icon: _jsx(Moon, {}) },
];
export function ThemeSwitch({ prefKey = THEME_PREF, legend = "Theme", initial }) {
    const name = useId();
    const [choice, setChoice] = useState(initial ?? null);
    useEffect(() => {
        // Remembered, else what the page shows: the system's theme on a first visit.
        setChoice(readTheme(prefKey) ?? effectiveTheme());
        const onTheme = (e) => {
            const c = e.detail?.choice;
            if (c)
                setChoice(c);
        };
        document.addEventListener("cap-theme", onTheme);
        return () => document.removeEventListener("cap-theme", onTheme);
    }, [prefKey]);
    return (_jsxs("fieldset", { className: "cap-theme", "data-cap": "theme-switch", children: [_jsx("legend", { className: "cap-sr-only", children: legend }), _jsx("div", { className: "cap-theme-options", children: CHOICES.map((c) => (_jsxs("label", { children: [_jsx("input", { type: "radio", name: name, value: c.value, checked: choice === c.value, onChange: () => {
                                setChoice(c.value);
                                applyTheme(c.value, { key: prefKey });
                            } }), c.icon, _jsx("span", { className: "cap-theme-text", children: c.label })] }, c.value))) })] }));
}
// The 24-box icons the header's controls use (1.6 stroke): a moon while the page is light (press
// for dark), a sun while it is dark. Both are in the markup; CSS shows the one for the theme that
// is showing, so the picture is right before any script runs.
const BUTTON_MOON = (_jsx("svg", { className: "cap-theme-icon", "data-show": "light", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" }) }));
const BUTTON_SUN = (_jsxs("svg", { className: "cap-theme-icon", "data-show": "dark", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", children: [_jsx("circle", { cx: "12", cy: "12", r: "4" }), _jsx("path", { d: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" })] }));
// The theme as one icon button (the site header's theme control, Dustin's answer 2 of
// 2026-10-13): Light and Dark only, no System; it says what it does, "Switch to dark theme", in
// its name and its tip.
export function ThemeButton({ prefKey = THEME_PREF, shortcut, className, initial }) {
    const [showing, setShowing] = useState(initial ?? "light");
    const button = useRef(null);
    const tip = useRef(null);
    useEffect(() => {
        const t = readTheme(prefKey);
        if (t)
            applyTheme(t, { key: prefKey, remember: false });
        setShowing(effectiveTheme());
        const onTheme = (e) => setShowing(e.detail?.choice ?? effectiveTheme());
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onSystem = () => setShowing(effectiveTheme());
        document.addEventListener("cap-theme", onTheme);
        media.addEventListener("change", onSystem);
        return () => {
            document.removeEventListener("cap-theme", onTheme);
            media.removeEventListener("change", onSystem);
        };
    }, [prefKey]);
    useEffect(() => {
        const b = button.current;
        if (!b || !tip.current)
            return;
        const detach = attachTip(b, tip.current);
        b.removeAttribute("aria-describedby");
        return detach;
    }, []);
    const label = themeButtonLabel(showing);
    return (_jsxs("button", { ref: button, type: "button", className: className ? `cap-theme-button ${className}` : "cap-theme-button", "data-cap": "theme-switch", "data-variant": "button", "data-cap-ready": "", "aria-label": label, onClick: () => setShowing(toggleTheme(prefKey)), children: [BUTTON_MOON, BUTTON_SUN, _jsxs("span", { ref: tip, className: "cap-theme-tip cap-popover", "data-variant": "tooltip", "data-side": "bottom", "data-offset": "6", popover: "manual", role: "tooltip", "aria-hidden": "true", children: [_jsx("span", { className: "cap-theme-tip-text", children: label }), shortcut ? (_jsx("span", { className: "cap-keys", children: _jsx("kbd", { children: shortcut }) })) : null] })] }));
}
