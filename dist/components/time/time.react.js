import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useSyncExternalStore } from "react";
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
const noSubscribe = () => () => { };
// False on the server and while React hydrates what the server sent; true from then on (and at
// once for a time first drawn in the browser).
function useHydrated() {
    return useSyncExternalStore(noSubscribe, () => true, () => false);
}
export function Time({ at, format = "relative", now }) {
    const t = toMs(at);
    const clock = useClock(format === "relative" && now === undefined);
    const hydrated = useHydrated();
    const iso = Number.isFinite(t) ? new Date(t).toISOString() : undefined;
    // A time that cannot be read is said in words and is not a <time> (it has no datetime).
    if (!iso)
        return _jsx("span", { className: "cap-time", children: text(t, format) });
    // The server cannot know the viewer's zone. Until hydration is done the time is drawn in UTC
    // on both sides ("October 2, 2026, 9:12 AM UTC", one text with no UTC part), so the markup the
    // server sent and the browser's first render are the same and React does not throw (#418);
    // then it redraws in the viewer's zone with the UTC part beside it. A relative time's words
    // can still differ by the clock; they are text alone, and the browser's win without a warning.
    const zone = hydrated ? undefined : "UTC";
    const p = format === "exact" ? exactParts(t, zone) : null;
    return (_jsx("time", { className: "cap-time", dateTime: iso, "data-format": format === "exact" ? "exact" : undefined, suppressHydrationWarning: true, children: p ? (_jsxs(_Fragment, { children: [p.utc ? `${p.local} ` : p.local, p.utc ? _jsx("span", { className: "cap-time-utc", children: p.utc }) : null] })) : (text(t, format, now ?? clock, zone)) }));
}
