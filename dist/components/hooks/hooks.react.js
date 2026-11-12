import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { Suspense, useCallback, useEffect, useId, useMemo, useState, useSyncExternalStore, } from "react";
import { readStored, subscribeStored, writeStored } from "./hooks.js";
export { cn } from "./hooks.js";
// Every hook here reads the browser through useSyncExternalStore with a server snapshot, so the
// server's HTML and the render that hydrates it agree (no React #418), and the browser's value
// arrives in the next render with no effect setting state.
const noSubscribe = () => () => { };
/** React's useId with only letters and digits, safe in an id, a selector and an anchor (React's own has colons). */
export function useCleanId() {
    return useId().replace(/[^a-zA-Z0-9]/g, "");
}
/** False on the server and in the render that hydrates; true after, and at once for a part first drawn in the browser. */
export function useHydrated() {
    return useSyncExternalStore(noSubscribe, () => true, () => false);
}
/** `fallback` on the server and while hydrating, then `children` (in Suspense, for a lazy import). For window-only libraries; the fallback is the accessible text equivalent. */
export function ClientOnly({ children, fallback }) {
    if (!useHydrated())
        return _jsx(_Fragment, { children: fallback });
    return _jsx(Suspense, { fallback: fallback, children: children });
}
/** Whether a media query matches; `serverValue` (false) on the server and while hydrating. */
export function useMedia(query, serverValue = false) {
    const subscribe = useCallback((onChange) => {
        const mq = window.matchMedia(query);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, [query]);
    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => serverValue);
}
/** True when the reader asked for less motion. A script-driven motion checks it; CSS motion sits in its own media query. */
export function usePrefersReducedMotion() {
    return useMedia("(prefers-reduced-motion: reduce)");
}
/** The browser's time zone once hydrated; `fallback` (the server's) until then. */
export function useBrowserZone(fallback) {
    return useSyncExternalStore(noSubscribe, () => Intl.DateTimeFormat().resolvedOptions().timeZone || fallback, () => fallback);
}
/**
 * A value remembered in this browser under `key` (null on the server, while hydrating, or when none
 * is kept) and its setter (null forgets it). Every reader of the key on the page, and in other tabs,
 * follows a change. Where storage is refused it is kept for this page only.
 */
export function useRemembered(key) {
    const value = useSyncExternalStore(subscribeStored, () => readStored(key), () => null);
    const remember = useCallback((next) => writeStored(key, next), [key]);
    return [value, remember];
}
/**
 * The time now, in milliseconds, ticking every `ms` (30 s) once the page is live; 0 on the server
 * and while hydrating, so a time measured against it says the same words in both renders. Pass the
 * server's own read time as `serverNow` to draw against it until the clock starts.
 */
export function useNow(ms = 30_000, serverNow = 0) {
    const clock = useMemo(() => createClock(ms, serverNow), [ms, serverNow]);
    return useSyncExternalStore(clock.subscribe, clock.read, () => serverNow);
}
function createClock(ms, start) {
    let now = start;
    return {
        subscribe(onChange) {
            now = Date.now();
            onChange();
            const t = setInterval(() => {
                now = Date.now();
                onChange();
            }, ms);
            return () => clearInterval(t);
        },
        read: () => now,
    };
}
/**
 * A result shown for `ms` after it arrives, then gone: "Saved", "Copied", a bulk action's count.
 * Returns the result while it shows (undefined after) and a function that hides it now (a close
 * button). A new result (another object) shows again. `clears` picks the results that go on their
 * own; the rest (a failure, usually) stay until hidden or replaced. The hook remembers the one it
 * hid, so a re-render does not bring it back.
 */
export function useShownFor(result, ms, clears = () => true) {
    const [hidden, setHidden] = useState(undefined);
    const goes = result != null && clears(result);
    useEffect(() => {
        if (!goes)
            return;
        const timer = setTimeout(() => setHidden(result), ms);
        return () => clearTimeout(timer);
    }, [result, goes, ms]);
    const hide = useCallback(() => setHidden(result), [result]);
    return [result != null && result !== hidden ? result : undefined, hide];
}
