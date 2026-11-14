import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher, useLocation, useNavigate, useNavigation, useRevalidator, useRouteLoaderData, useSearchParams, } from "react-router";
import { filterParams, pagePending, withParam } from "../form-hooks/form-hooks.js";
/**
 * A fetcher submit that answers a promise: for a toast's Undo or a dialog's perform, which wait for
 * the result. Resolves with the action's data once the fetcher is idle again. One at a time: a
 * second call while one is running is refused with `busyMessage`.
 */
export function useFetcherPromise({ key, busyMessage = "Another request is still running. Try again in a moment.", } = {}) {
    const fetcher = useFetcher(key ? { key } : undefined);
    const waiting = useRef(null);
    const started = useRef(false);
    const { submit, state, data } = fetcher;
    useEffect(() => {
        if (state !== "idle") {
            started.current = true;
            return;
        }
        if (!waiting.current || !started.current)
            return;
        const settle = waiting.current;
        waiting.current = null;
        started.current = false;
        settle(data);
    }, [state, data]);
    return useCallback((target, options) => new Promise((resolve, reject) => {
        if (waiting.current) {
            reject(new Error(busyMessage));
            return;
        }
        waiting.current = resolve;
        started.current = false;
        void submit(target, { method: "post", ...options });
    }), [submit, busyMessage]);
}
/**
 * A dialog or panel the address opens: `?add=person`. A link to `href(value)` opens it (and works
 * before the page's script runs, where the page shows the same form as a panel); `close()` takes
 * the parameter off, replacing the history entry and keeping the scroll.
 */
export function useUrlDialog(name) {
    const { pathname, search } = useLocation();
    const navigate = useNavigate();
    const value = new URLSearchParams(search).get(name);
    const href = useCallback((next) => withParam(pathname, search, name, next), [pathname, search, name]);
    const close = useCallback(() => {
        void navigate(withParam(pathname, search, name, null), {
            replace: true,
            preventScrollReset: true,
        });
    }, [navigate, pathname, search, name]);
    const onOpenChange = useCallback((open) => {
        if (!open)
            close();
    }, [close]);
    return { value, href, close, onOpenChange };
}
/**
 * A filter kept in the address, so a view can be reloaded or shared: the fields are local state
 * that apply on submit. `keep` names other parameters the filter leaves in place (a tab); `fixed`
 * sets parameters every filtered address carries.
 */
export function useUrlFilters(names, { keep = [], fixed = {}, } = {}) {
    const [params, setParams] = useSearchParams();
    const applied = Object.fromEntries(names.map((n) => [n, params.get(n) ?? ""]));
    const key = names.map((n) => applied[n]).join("\u0000");
    const [input, setInputState] = useState(applied);
    // The address changed: the fields follow it. Adjusted while rendering, not in an effect.
    const [seen, setSeen] = useState(key);
    if (seen !== key) {
        setSeen(key);
        setInputState(applied);
    }
    const setInput = useCallback((patch) => setInputState((s) => ({ ...s, ...patch })), []);
    const apply = (next) => {
        const values = { ...input, ...next };
        setParams((from) => filterParams(from, values, keep, fixed), {
            replace: true,
            preventScrollReset: true,
        });
    };
    return { applied, input, setInput, apply, active: names.some((n) => applied[n] !== ""), key };
}
/** Whether this page's own data is being read again, not whether the reader is leaving it. */
export function usePagePending(pathname) {
    const navigation = useNavigation();
    const { state } = useRevalidator();
    const here = useLocation().pathname;
    return pagePending(navigation, state, pathname ?? here);
}
// The element id a hash names: percent-decoded, or as written when it is not valid
// percent-encoding ("#%E0"), where decodeURIComponent throws.
function hashId(hash) {
    try {
        return decodeURIComponent(hash);
    }
    catch {
        return hash;
    }
}
/**
 * Scrolls to the address's `#id` once that element is drawn: sections that load after the page do
 * are not there when the browser looks. Tries each frame for about two seconds, then gives up.
 */
export function useScrollToHash(frames = 120) {
    const location = useLocation();
    useEffect(() => {
        const id = location.hash.slice(1);
        if (!id)
            return;
        let tries = 0;
        let raf = 0;
        const seek = () => {
            const el = document.getElementById(hashId(id));
            if (el)
                el.scrollIntoView();
            else if (tries++ < frames)
                raf = requestAnimationFrame(seek);
        };
        raf = requestAnimationFrame(seek);
        return () => cancelAnimationFrame(raf);
    }, [location, frames]);
}
/**
 * A choice kept in one search parameter (`?by=word`) that switches at once: while the navigation
 * to the other choice loads, the pending address's value shows, and the loader's answer confirms
 * it. `loaded` is the value the loader read; `choices[0]` is the default.
 */
export function useParamChoice(name, loaded, choices) {
    const navigate = useNavigate();
    const location = useLocation();
    const pending = useNavigation().location;
    let shown = loaded;
    if (pending && pending.pathname === location.pathname) {
        const asked = new URLSearchParams(pending.search).get(name);
        shown = choices.find((c) => c === asked) ?? choices[0] ?? loaded;
    }
    const choose = useCallback((next) => {
        const params = new URLSearchParams(location.search);
        params.set(name, next);
        void navigate(`${location.pathname}?${params.toString()}`, { preventScrollReset: true });
    }, [navigate, location.pathname, location.search, name]);
    return [shown, choose];
}
/**
 * The site's editable snippets: the root loader hands down `snippets` (key to text), and a missing
 * one falls back to the same in-code default the server uses, so a missing row never breaks a part.
 */
export function createSnippetHook(defaults, { route = "root", field = "snippets" } = {}) {
    return function useSnippet(key, fallback = "") {
        const data = useRouteLoaderData(route);
        const map = data?.[field];
        return map?.[key] ?? defaults[key] ?? fallback;
    };
}
