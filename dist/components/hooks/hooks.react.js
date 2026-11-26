import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Suspense, useCallback, useEffect, useId, useLayoutEffect, useMemo, useState, useSyncExternalStore, } from "react";
import { readStored, subscribeStored, writeStored } from "./hooks.js";
/** The default `renderLink` of every component that takes one: a plain anchor. */
export const plainLink = ({ children, ...props }) => (_jsx("a", { ...props, children: children }));
export { cn } from "./hooks.js";
// Every hook reads the browser through useSyncExternalStore with a server snapshot, so server HTML and the hydrating render agree (no React #418).
const noSubscribe = () => () => { };
// useLayoutEffect in the browser, useEffect on the server where a layout effect never runs and React warns.
export const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
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
/** A value remembered in this browser under `key` (null on the server, while hydrating or when none is kept) and its setter. Followed across tabs; where storage is refused it lasts this page. */
export function useRemembered(key) {
    const value = useSyncExternalStore(subscribeStored, () => readStored(key), () => null);
    const remember = useCallback((next) => writeStored(key, next), [key]);
    return [value, remember];
}
/** The time now in ms, ticking every `ms` (30 s); 0 on the server and while hydrating so both renders say the same words. `serverNow` draws until the clock starts. */
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
/** A result shown for `ms` after it arrives, then gone. Returns it while showing and a function to hide it now. A new object shows again; `clears` picks which results go on their own. */
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
