// Tab behavior (WAI-ARIA Authoring Practices, Tabs): roving tabindex, arrow keys, Home and End. Markup arrives complete;
// this adds what changes after a person acts, turns progressive sets (data-progressive) into tabs, remembers a choice
// (data-remember) and drags the pill mark. The keyboard is our own on purpose: Chrome's focusgroup does not skip a disabled tab.
import { hashId, readStored, subscribeStored, writeStored } from "../hooks/hooks.js";
import { startPointerDrag } from "../sortable-list/sortable-list.js";
const READY = "data-cap-ready";
const STOP = "data-cap-tabstop";
// Where the browser has `hidden="until-found"` (Chrome, Edge, Firefox 148), an inactive panel is hidden that way so find-in-page
// reaches it: `beforematch` chooses its tab. Elsewhere (Safari) the panel is plainly `hidden`.
export const FINDS_HIDDEN = typeof HTMLElement !== "undefined" && "onbeforematch" in HTMLElement.prototype;
// Remembered tabs: the choice is kept on this device under "capsomer.tabs.<key>" and followed by every set with the same key,
// in other windows too. Storage can be refused (private window); the choice then lasts the page.
const REMEMBER_PREFIX = "capsomer.tabs.";
export function readRemembered(key) {
    return readStored(REMEMBER_PREFIX + key);
}
/** Keeps a choice; every tab set remembering the same key follows it. */
export function writeRemembered(key, value) {
    writeStored(REMEMBER_PREFIX + key, value);
}
/** Calls back with each new choice made for `key`, on this page or in another window. */
export function onRemembered(key, fn) {
    let last = readRemembered(key);
    return subscribeStored(() => {
        const now = readRemembered(key);
        if (now === null || now === last)
            return;
        last = now;
        fn(now);
    });
}
// The reader's system: "ios", "android", "windows", "macos", "linux" or null. Phones first: an iPhone says
// "like Mac OS X" and Android says "Linux".
export function guessPlatform(ua = typeof navigator === "undefined" ? "" : navigator.userAgent) {
    if (/iPhone|iPad|iPod/.test(ua))
        return "ios";
    if (/Android/.test(ua))
        return "android";
    if (/Windows/.test(ua))
        return "windows";
    if (/Mac OS X|Macintosh/.test(ua))
        return "macos";
    if (/Linux|X11/.test(ua))
        return "linux";
    return null;
}
export function tabValue(tab) {
    return tab.dataset.value ?? tab.getAttribute("aria-controls") ?? "";
}
// Page tabs: each tab is the page's address with ?tab=<id>, the first tab the bare address, other parameters kept.
export function tabParam(search, param = "tab") {
    return new URLSearchParams(search).get(param);
}
export function pageTabHref(path, search, id, firstId, param = "tab") {
    const qs = new URLSearchParams(search);
    if (id === firstId)
        qs.delete(param);
    else
        qs.set(param, id);
    const q = qs.toString();
    return `${path}${q ? `?${q}` : ""}`;
}
// A disabled tab's panel cannot be chosen, so a match must not open it: it stays plainly hidden.
function disabledTabOf(panel) {
    const id = panel.getAttribute("aria-labelledby");
    const tab = id ? panel.ownerDocument.getElementById(id) : null;
    return !!tab && isDisabled(tab);
}
export function setPanelHidden(panel, hide) {
    if (!hide) {
        panel.hidden = false;
        if (panel.hasAttribute(STOP)) {
            panel.setAttribute("tabindex", panel.getAttribute(STOP) ?? "0");
            panel.removeAttribute(STOP);
        }
    }
    else if (FINDS_HIDDEN && !disabledTabOf(panel)) {
        panel.setAttribute("hidden", "until-found");
        // The browser skips the panel's contents but not the panel itself, whose tabindex="0" would still be a Tab stop.
        // (inert would end that too, but inert text is left out of find-in-page.)
        const stop = panel.getAttribute("tabindex");
        if (stop !== null && stop !== "-1" && !panel.hasAttribute(STOP)) {
            panel.setAttribute(STOP, stop);
            panel.tabIndex = -1;
        }
    }
    else
        panel.hidden = true;
}
// The position to focus for a key among the enabled tabs, or null for any other key. Left/Right move a horizontal list
// (swapped in right-to-left), Up/Down a vertical one; Home and End go to the ends; the ends wrap.
export function nextTab(enabled, current, key, orientation = "horizontal", rtl = false) {
    if (enabled.length === 0)
        return null;
    const forward = orientation === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
    const back = orientation === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
    if (key === "Home")
        return enabled[0] ?? null;
    if (key === "End")
        return enabled[enabled.length - 1] ?? null;
    if (key !== forward && key !== back)
        return null;
    const at = enabled.indexOf(current);
    // From a tab that cannot be chosen, forward starts at the next one after it, back at the one before.
    const step = key === forward ? 1 : -1;
    if (at === -1) {
        const after = enabled.filter((i) => (step === 1 ? i > current : i < current));
        return ((step === 1 ? after[0] : after[after.length - 1]) ??
            (step === 1 ? enabled[0] : enabled[enabled.length - 1]) ??
            null);
    }
    return enabled[(at + step + enabled.length) % enabled.length] ?? null;
}
function listOf(root) {
    return root.querySelector(":scope > [role='tablist']");
}
export function tabsOf(root) {
    return [...(listOf(root)?.querySelectorAll(":scope > [role='tab']") ?? [])];
}
// A panel is a child of the set, or deeper in it when a layout wraps the panels (a column beside them),
// so long as no tab set nested inside holds it.
export function panelsOf(root) {
    return [...root.querySelectorAll("[role='tabpanel']")].filter((p) => p.parentElement === root || p.parentElement?.closest("[data-cap='tabs'], .cap-tabs") === root);
}
export function panelOf(root, tab) {
    const id = tab.getAttribute("aria-controls");
    if (!id)
        return null;
    return panelsOf(root).find((p) => p.id === id) ?? null;
}
function isDisabled(tab) {
    return (tab.getAttribute("aria-disabled") === "true" || tab.disabled === true);
}
// Chooses a tab (never a disabled one) and fires a bubbling `cap:tabs-change`. Returns whether it was chosen.
export function select(root, tab, options = {}) {
    if (isDisabled(tab))
        return false;
    const tabs = tabsOf(root);
    if (!tabs.includes(tab))
        return false;
    const changed = tab.getAttribute("aria-selected") !== "true";
    for (const t of tabs) {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = panelOf(root, t);
        if (panel)
            setPanelHidden(panel, !on);
    }
    if (options.focus)
        tab.focus();
    // A long list scrolls the chosen tab into view, the least distance that shows it. Only the list
    // scrolls, by hand: scrollIntoView also scrolls the page and moves the browser's Tab starting
    // point to the tab, so the first Tab press on load skipped the skip link and header.
    const list = listOf(root);
    if (list) {
        const box = list.getBoundingClientRect();
        const at = tab.getBoundingClientRect();
        if (list.scrollWidth > list.clientWidth)
            list.scrollLeft +=
                at.left < box.left ? at.left - box.left : Math.max(0, at.right - box.right);
        if (list.scrollHeight > list.clientHeight)
            list.scrollTop += at.top < box.top ? at.top - box.top : Math.max(0, at.bottom - box.bottom);
    }
    if (changed && !options.silent)
        tab.dispatchEvent(new CustomEvent("cap:tabs-change", {
            bubbles: true,
            detail: { tab, panel: panelOf(root, tab) },
        }));
    return true;
}
// Progressive tabs: the server sends links to every panel, each showing under its own name, which is the whole page with
// script off. This turns the links into tabs. Returns whether the set is tabs now.
export function upgrade(root) {
    if (listOf(root))
        return true;
    if (!root.hasAttribute("data-progressive"))
        return false;
    const list = root.querySelector(":scope > .cap-tabs-list");
    if (!list)
        return false;
    const panels = [...root.querySelectorAll(".cap-tabs-panel[id]")].filter((p) => p.parentElement?.closest("[data-cap='tabs'], .cap-tabs") === root);
    const pairs = [...list.querySelectorAll(":scope > a.cap-tab")].flatMap((a) => {
        const id = hashId(a.hash.slice(1));
        const panel = id ? panels.find((p) => p.id === id) : undefined;
        return panel ? [{ tab: a, panel }] : [];
    });
    if (pairs.length === 0)
        return false;
    list.setAttribute("role", "tablist");
    if (!list.hasAttribute("aria-label") && list.dataset.label)
        list.setAttribute("aria-label", list.dataset.label);
    if (root.dataset.orientation === "vertical")
        list.setAttribute("aria-orientation", "vertical");
    for (const { tab, panel } of pairs) {
        const on = tab === pairs[0]?.tab;
        tab.setAttribute("role", "tab");
        tab.id ||= `${panel.id}-tab`;
        tab.setAttribute("aria-controls", panel.id);
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
        if (!panel.hasAttribute("tabindex"))
            panel.tabIndex = 0;
        panel.hidden = !on;
    }
    return true;
}
// The pill mark follows a drag: let go and the tab nearest the mark is chosen through `pick`. A press that does not move is a
// click. The mark moves through the CSSOM (--cap-pill-start, --cap-pill-end); the tab under it carries data-near.
export function attachPillDrag(list, pick) {
    let near = null;
    let live = true;
    const tabs = () => [...list.querySelectorAll(":scope > [role='tab']")].filter((t) => !isDisabled(t));
    const xOf = (t) => t.getBoundingClientRect().left -
        list.getBoundingClientRect().left -
        list.clientLeft +
        list.scrollLeft;
    const clear = () => {
        list.removeAttribute("data-dragging");
        near?.removeAttribute("data-near");
        near = null;
        list.style.removeProperty("--cap-pill-start");
        list.style.removeProperty("--cap-pill-end");
    };
    // The drag itself (threshold, one pointer, capture, Escape, the click after a drop) is the
    // sortable list's, which the tree shares too.
    const down = (e) => {
        if (list.dataset.variant !== "pill" || list.getAttribute("aria-orientation") === "vertical")
            return;
        if (!e.isPrimary)
            return;
        const base = tabs().find((t) => t.getAttribute("aria-selected") === "true");
        if (!base)
            return;
        const start = e.clientX;
        startPointerDrag(e, {
            onStart: () => {
                if (live)
                    list.setAttribute("data-dragging", "");
            },
            onMove: (clientX) => {
                const all = tabs();
                const first = all[0];
                const last = all[all.length - 1];
                if (!live || !first || !last)
                    return;
                const width = base.getBoundingClientRect().width;
                const x = Math.min(xOf(last), Math.max(xOf(first), xOf(base) + clientX - start));
                list.style.setProperty("--cap-pill-start", `${x}px`);
                list.style.setProperty("--cap-pill-end", `${list.clientWidth - x - width}px`);
                let best = first;
                for (const t of all)
                    if (Math.abs(xOf(t) - x) < Math.abs(xOf(best) - x))
                        best = t;
                if (best !== near) {
                    near?.removeAttribute("data-near");
                    best.setAttribute("data-near", "");
                    near = best;
                }
            },
            onDrop: () => {
                const was = near;
                clear();
                if (live && was)
                    pick(was);
            },
            onCancel: clear,
        });
    };
    list.addEventListener("pointerdown", down);
    return () => {
        live = false;
        clear();
        list.removeEventListener("pointerdown", down);
    };
}
function attach(root) {
    upgrade(root);
    const list = listOf(root);
    if (!list)
        return () => { };
    const undo = [];
    const on = (type, fn) => {
        list.addEventListener(type, fn);
        undo.push(() => list.removeEventListener(type, fn));
    };
    const orientation = () => list.getAttribute("aria-orientation") === "vertical" || root.dataset.orientation === "vertical"
        ? "vertical"
        : "horizontal";
    const manual = () => root.dataset.activation === "manual";
    const hashed = () => root.dataset.sync === "hash";
    // Keeps the address in step when asked (data-sync="hash"): the panel's id after the #,
    // so a link opens the tab, and Back does not pile up one entry per click.
    const writeHash = (tab) => {
        const id = tab.getAttribute("aria-controls");
        if (!hashed() || !id)
            return;
        try {
            history.replaceState(history.state, "", `#${id}`);
        }
        catch {
            /* a sandboxed frame may refuse; the tab still changes */
        }
    };
    const fromHash = () => {
        if (!hashed() || !location.hash)
            return;
        const id = hashId(location.hash.slice(1));
        const tab = tabsOf(root).find((t) => t.getAttribute("aria-controls") === id);
        if (tab && tab.getAttribute("aria-selected") !== "true")
            select(root, tab);
    };
    on("click", (e) => {
        const tab = e.target.closest("[role='tab']");
        if (!tab || tab.parentElement !== list)
            return;
        // A progressive tab is a link to its panel: choosing it does not jump the page.
        if (tab.tagName === "A" || isDisabled(tab))
            e.preventDefault();
        if (isDisabled(tab))
            return;
        if (select(root, tab))
            writeHash(tab);
    });
    on("keydown", (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey)
            return;
        const tab = e.target.closest("[role='tab']");
        if (!tab || tab.parentElement !== list)
            return;
        const tabs = tabsOf(root);
        const enabled = tabs.flatMap((t, i) => (isDisabled(t) ? [] : [i]));
        const rtl = getComputedStyle(list).direction === "rtl";
        const to = nextTab(enabled, tabs.indexOf(tab), e.key, orientation(), rtl);
        if (to === null) {
            if ((e.key === "Enter" || e.key === " ") && tab.tagName !== "BUTTON" && select(root, tab)) {
                e.preventDefault();
                writeHash(tab);
            }
            return;
        }
        e.preventDefault();
        const target = tabs[to];
        if (!target)
            return;
        if (manual()) {
            for (const t of tabs)
                t.tabIndex = t === target ? 0 : -1;
            target.focus();
        }
        else if (select(root, target, { focus: true }))
            writeHash(target);
    });
    on("focusout", (e) => {
        if (!manual())
            return;
        const next = e.relatedTarget;
        if (next && list.contains(next))
            return;
        for (const t of tabsOf(root))
            t.tabIndex = t.getAttribute("aria-selected") === "true" ? 0 : -1;
    });
    if (FINDS_HIDDEN) {
        const panels = panelsOf(root);
        for (const p of panels)
            if (p.hidden)
                setPanelHidden(p, true);
        const onMatch = (e) => {
            const panel = e.target;
            if (!panels.includes(panel))
                return;
            const tab = tabsOf(root).find((t) => t.getAttribute("aria-controls") === panel.id);
            if (tab && select(root, tab))
                writeHash(tab);
        };
        root.addEventListener("beforematch", onMatch);
        undo.push(() => root.removeEventListener("beforematch", onMatch));
    }
    // Remembered: the earlier choice (or the guess) on load; an address with the panel's hash still wins.
    const key = root.dataset.remember;
    if (key) {
        let applying = false;
        const pick = (value, silent) => {
            const tab = value ? tabsOf(root).find((t) => tabValue(t) === value) : undefined;
            if (!tab)
                return false;
            applying = true;
            try {
                return select(root, tab, { silent });
            }
            finally {
                applying = false;
            }
        };
        if (!pick(readRemembered(key), true) && root.dataset.rememberGuess === "platform")
            pick(guessPlatform(), true);
        const keep = (e) => {
            const tab = e.detail?.tab;
            if (applying || !tab || tab.parentElement !== list)
                return;
            writeRemembered(key, tabValue(tab));
        };
        root.addEventListener("cap:tabs-change", keep);
        undo.push(() => root.removeEventListener("cap:tabs-change", keep));
        undo.push(onRemembered(key, (value) => void pick(value, false)));
    }
    undo.push(attachPillDrag(list, (tab) => {
        if (select(root, tab))
            writeHash(tab);
    }));
    if (hashed()) {
        window.addEventListener("hashchange", fromHash);
        undo.push(() => window.removeEventListener("hashchange", fromHash));
        fromHash();
    }
    return () => undo.forEach((f) => f());
}
// Attaches every [data-cap="tabs"] under root not yet attached; returns a detach function. Document | Element, not ParentNode:
// under the Workers types an HTMLElement is not a ParentNode, so enhance(root) failed to typecheck.
export function enhance(root = document) {
    const undo = [];
    for (const el of root.querySelectorAll("[data-cap='tabs']")) {
        if (el.hasAttribute(READY))
            continue;
        el.setAttribute(READY, "");
        const detach = attach(el);
        undo.push(() => {
            detach();
            el.removeAttribute(READY);
        });
    }
    return () => undo.forEach((f) => f());
}
