// Small helpers shared by every React app in the network. No framework; the hooks are in hooks.react.tsx.
import { isHttpUrl, isSameOriginPath } from "@dustinedwards/site-runtime/url";
/** Joins class names, dropping the empty ones: `cn("cap-btn", busy && "is-busy")`. No merging. */
export function cn(...parts) {
    return parts.filter(Boolean).join(" ");
}
/** The element id a hash names: percent-decoded, or as written when it is not valid percent-encoding ("#%E0"). */
export function hashId(hash) {
    try {
        return decodeURIComponent(hash);
    }
    catch {
        return hash;
    }
}
/** An address safe as an href: http(s) or a path on this site. A stored `javascript:` or `data:` address is not. */
export function linkable(href) {
    return typeof href === "string" && (isHttpUrl(href) || isSameOriginPath(href));
}
/** `n` held to `lo` to `hi`; where `hi` is under `lo`, `lo`. */
export function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(n, Math.max(lo, hi)));
}
/** Runs `attach` on every `[data-cap="name"]` under `root` (or `root`) not yet marked `data-cap-ready`; returns one detach function.
The root is the union type, not ParentNode: under @cloudflare/workers-types an HTMLFormElement is not a ParentNode. */
export function enhanceEach(root, name, attach) {
    const selector = `[data-cap='${name}']:not([data-cap-ready])`;
    const found = [...root.querySelectorAll(selector)];
    if (root instanceof HTMLElement && root.matches(selector))
        found.unshift(root);
    const undo = [];
    for (const el of found) {
        el.dataset.capReady = "";
        const off = attach(el);
        undo.push(() => {
            off?.();
            delete el.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
/** `addEventListener` that records how to take itself off again: push onto `undo`, run them all to detach. */
export function listenInto(undo) {
    return (target, type, fn, opts) => {
        target.addEventListener(type, fn, opts);
        undo.push(() => target.removeEventListener(type, fn, opts));
    };
}
/** "A, B, and C" (and "A and B"; "A, B, or C" with "or"): the platform's own list, in American English with its serial comma. */
export function listText(words, join = "and") {
    return new Intl.ListFormat("en-US", {
        type: join === "or" ? "disjunction" : "conjunction",
    }).format(words);
}
/** The reader asks for reduced motion (false where there is no window: a server, a test). */
export function reducedMotion() {
    return (typeof window !== "undefined" &&
        !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}
let ids = 0;
/** A new id on every call, `prefix-1`, `prefix-2`: for a part a script gives an id to. */
export function uid(prefix) {
    ids += 1;
    return `${prefix}-${ids}`;
}
// localStorage where usable, a page-long Map where it is refused (private window, full quota), so a choice still switches. The Map never shadows working storage.
const memory = new Map();
const listeners = new Set();
export function readStored(key) {
    try {
        return localStorage.getItem(key) ?? memory.get(key) ?? null;
    }
    catch {
        return memory.get(key) ?? null;
    }
}
/** Stores a value (null forgets it) and tells every reader on the page. */
export function writeStored(key, value) {
    try {
        if (value === null)
            localStorage.removeItem(key);
        else
            localStorage.setItem(key, value);
        memory.delete(key);
    }
    catch {
        if (value === null)
            memory.delete(key);
        else
            memory.set(key, value);
    }
    for (const listener of listeners)
        listener();
}
/** Calls `listener` when a stored value changes here or in another tab. */
export function subscribeStored(listener) {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", listener);
    };
}
