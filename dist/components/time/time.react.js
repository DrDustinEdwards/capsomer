import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { REFRESH_MS, exactParts, parse, text } from "./time.js";
function toMs(at) {
    return typeof at === "number" ? at : at instanceof Date ? at.getTime() : parse(at);
}
// The clock, ticking every 30 seconds while a relative time is shown.
function useClock(enabled) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!enabled)
            return;
        setNow(Date.now());
        const t = window.setInterval(() => setNow(Date.now()), REFRESH_MS);
        return () => window.clearInterval(t);
    }, [enabled]);
    return now;
}
export function Time({ at, format = "relative", now }) {
    const t = toMs(at);
    const clock = useClock(format === "relative" && now === undefined);
    const iso = Number.isFinite(t) ? new Date(t).toISOString() : undefined;
    // A time that cannot be read is said in words and is not a <time> (it has no datetime).
    if (!iso)
        return _jsx("span", { className: "cap-time", children: text(t, format) });
    // The server's words can differ from the browser's (its clock, its zone); the browser's
    // win without a warning.
    const p = format === "exact" ? exactParts(t) : null;
    return (_jsx("time", { className: "cap-time", dateTime: iso, "data-format": format === "exact" ? "exact" : undefined, suppressHydrationWarning: true, children: p ? (_jsxs(_Fragment, { children: [p.utc ? `${p.local} ` : p.local, p.utc ? _jsx("span", { className: "cap-time-utc", children: p.utc }) : null] })) : (text(t, format, now ?? clock)) }));
}
