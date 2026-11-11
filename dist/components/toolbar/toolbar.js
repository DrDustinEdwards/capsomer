// The toolbar's behavior (WAI-ARIA Authoring Practices, Toolbar): the bar is one tab stop (a
// roving tabindex), Left and Right move between its controls (swapped right to left; Up and
// Down in a vertical bar), Home and End go to the ends, and the ends wrap. The control last
// focused keeps the stop. No framework; the markdown editor's toolbar uses it too.
// Which item an arrow, Home or End moves to in a roving group (APG toolbar and menu). It wraps.
export function rovingIndex(key, at, count, axis = "horizontal", rtl = false) {
    if (count <= 0)
        return null;
    const next = axis === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
    const prev = axis === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
    if (key === next)
        return (at + 1) % count;
    if (key === prev)
        return (at - 1 + count) % count;
    if (key === "Home")
        return 0;
    if (key === "End")
        return count - 1;
    return null;
}
// The controls a bar's arrows move between: buttons and links that can take focus. A text field
// keeps its own arrows, so it does not belong in a toolbar (APG).
const TOOLBAR_ITEMS = ":is(button, a[href]):not(:disabled, [hidden])";
// Gives one bar its single tab stop and arrow keys. `items` picks its controls. Returns a function
// that detaches. Controls added later join it: the bar is read on every key.
//
// Where the browser has focusgroup (Chrome 150, Edge 150), a plain toolbar takes `focusgroup="toolbar wrap"` and the
// browser gives the single stop, the arrows (reversed right to left), Home, End and the wrap; this script then adds
// nothing, since two roving systems would fight (Modern Web Guidance, toolbar). A bar with its own item set (the
// markdown editor's tools, a tag group's remove buttons) keeps the script, which picks only those items.
export const NATIVE_FOCUSGROUP = typeof HTMLElement !== "undefined" && "focusGroup" in HTMLElement.prototype;
export function attachToolbar(bar, items = TOOLBAR_ITEMS) {
    if (NATIVE_FOCUSGROUP && items === TOOLBAR_ITEMS) {
        const had = bar.getAttribute("focusgroup");
        if (had === null) {
            const vertical = bar.getAttribute("aria-orientation") === "vertical";
            bar.setAttribute("focusgroup", vertical ? "toolbar wrap block" : "toolbar wrap");
        }
        return () => {
            if (had === null)
                bar.removeAttribute("focusgroup");
        };
    }
    const all = () => [...bar.querySelectorAll(items)];
    const stopOn = (el) => {
        for (const item of all())
            item.tabIndex = item === el ? 0 : -1;
    };
    const list = all();
    stopOn(list.find((el) => el.getAttribute("tabindex") === "0") ?? list[0]);
    const onFocus = (e) => {
        const t = e.target;
        if (all().includes(t))
            stopOn(t);
    };
    const onKey = (e) => {
        if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey)
            return;
        const now = all();
        const at = now.indexOf(e.target);
        if (at < 0)
            return;
        const axis = bar.getAttribute("aria-orientation") === "vertical" ? "vertical" : "horizontal";
        const next = rovingIndex(e.key, at, now.length, axis, getComputedStyle(bar).direction === "rtl");
        if (next === null)
            return;
        e.preventDefault();
        now[next]?.focus();
    };
    bar.addEventListener("focusin", onFocus);
    bar.addEventListener("keydown", onKey);
    return () => {
        bar.removeEventListener("focusin", onFocus);
        bar.removeEventListener("keydown", onKey);
    };
}
// Attaches to every [data-cap="toolbar"] under root not yet attached. Returns a function that
// detaches them all.
export function enhance(root = document) {
    const undo = [];
    for (const bar of root.querySelectorAll("[data-cap='toolbar']:not([data-cap-ready])")) {
        bar.dataset.capReady = "";
        const detach = attachToolbar(bar);
        undo.push(() => {
            detach();
            delete bar.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
