import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { attach } from "../tooltip/tooltip.js";
import { REFRESH_MS, UNREADABLE, exact, exactParts, text, toMs } from "./time.js";
// The clock, ticking every 30 seconds while a relative time is shown.
function useClock(enabled) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!enabled)
            return;
        // oxlint-disable-next-line react/set-state-in-effect -- the clock restarts from now when a relative time starts showing
        setNow(Date.now());
        const t = window.setInterval(() => setNow(Date.now()), REFRESH_MS);
        return () => window.clearInterval(t);
    }, [enabled]);
    return now;
}
const noSubscribe = () => () => { };
// False on the server and while React hydrates what the server sent; true from then on (and at
// once for a time first drawn in the browser).
function useHydrated() {
    return useSyncExternalStore(noSubscribe, () => true, () => false);
}
// The exact time in a tooltip beside a time, on hover and keyboard focus. The behavior module
// shows and hides it (Esc hides). Spans only, so it is valid inside a <p>: Tooltip's tip is a div.
function TimeTip({ t, hydrated, children }) {
    const id = useId();
    const trigger = useRef(null);
    const tipEl = useRef(null);
    useEffect(() => {
        if (trigger.current && tipEl.current)
            return attach(trigger.current, tipEl.current);
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx("span", { ref: trigger, tabIndex: 0, className: "cap-time-tip", "aria-describedby": id, children: children }), _jsxs("span", { ref: tipEl, id: id, className: "cap-popover", "data-cap": "tooltip", "data-variant": "tooltip", "data-side": "inline-end", role: "tooltip", popover: "manual", children: [_jsx("span", { suppressHydrationWarning: true, children: exact(t, hydrated ? undefined : "UTC") }), _jsx("span", { className: "cap-popover-arrow", "aria-hidden": "true" })] })] }));
}
export function Time({ at, format = "relative", now, empty, tip = false }) {
    const t = toMs(at);
    const clock = useClock(format === "relative" && now === undefined);
    const hydrated = useHydrated();
    const iso = Number.isFinite(t) ? new Date(t).toISOString() : undefined;
    // No time at all says so in the host's words.
    if ((at === null || at === undefined || at === "") && empty !== undefined)
        return (_jsx("span", { className: "cap-time", "data-empty": "", children: empty }));
    // A time that cannot be read is said in words and is not a <time> (it has no datetime).
    if (!iso)
        return _jsx("span", { className: "cap-time", children: UNREADABLE });
    // The server cannot know the viewer's zone. Until hydration is done the time is drawn in UTC
    // on both sides ("October 2, 2026, 9:12 AM UTC", one text with no UTC part), so the markup the
    // server sent and the browser's first render are the same and React does not throw (#418);
    // then it redraws in the viewer's zone with the UTC part beside it. A relative time's words
    // can still differ by the clock; they are text alone, and the browser's win without a warning.
    const zone = hydrated ? undefined : "UTC";
    const p = format === "exact" ? exactParts(t, zone) : null;
    const el = (_jsx("time", { className: "cap-time", dateTime: format === "date" ? iso.slice(0, 10) : iso, "data-format": format === "relative" ? undefined : format, suppressHydrationWarning: true, children: p ? (_jsxs(_Fragment, { children: [p.utc ? `${p.local} ` : p.local, p.utc ? _jsx("span", { className: "cap-time-utc", children: p.utc }) : null] })) : (text(t, format, now ?? clock, format === "date" ? "UTC" : zone)) }));
    return tip && format !== "exact" ? (_jsx(TimeTip, { t: t, hydrated: hydrated, children: el })) : (el);
}
