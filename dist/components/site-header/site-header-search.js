// The header's search behavior (wireSearch), in its own module so only a header with search loads
// it: site-header.ts and the React header import it on demand. The design note is on SearchHit in
// site-header.ts.
import { plural } from "../hooks/hooks.js";
import { isImeEnter } from "../shortcuts/shortcuts.js";
import { hideTip } from "../tooltip/tooltip.js";
import { closePanels, dismissOutside, isOpen, placePanel, } from "./site-header.js";
// How long the field waits after a key before it asks, so a word typed fast asks once.
const SUGGEST_DELAY_MS = 120;
let searchCount = 0;
/**
 * Wires a letterhead's search ([data-cap-part="search"]: the icon link and its panel holding the
 * form) to open from the icon or "/", and, given `suggest`, to show matches as the person types.
 * Returns a function that unwires it.
 */
export function wireSearch(search, suggest, { limit = 6 } = {}) {
    const trigger = search.querySelector("[data-cap-part='search-trigger']");
    const panel = search.querySelector(".cap-site-header-search-panel");
    const form = panel?.querySelector("form");
    const input = form?.querySelector("input[type='search']");
    if (!trigger || !panel || !form || !input)
        return () => { };
    const id = `cap-search-${++searchCount}`;
    panel.id ||= id;
    if (!panel.hasAttribute("popover"))
        panel.setAttribute("popover", "manual");
    trigger.setAttribute("aria-controls", panel.id);
    trigger.setAttribute("aria-expanded", "false");
    const results = document.createElement("div");
    results.className = "cap-site-header-results";
    results.hidden = true;
    const listbox = document.createElement("div");
    listbox.setAttribute("role", "listbox");
    listbox.id = `${id}-list`;
    listbox.setAttribute("aria-label", input.getAttribute("aria-label") ?? "Search");
    const emptyNote = document.createElement("p");
    emptyNote.className = "cap-site-header-results-empty";
    emptyNote.hidden = true;
    const liveStatus = document.createElement("span");
    liveStatus.className = "cap-sr-only";
    liveStatus.setAttribute("role", "status");
    results.append(listbox, emptyNote, liveStatus);
    form.after(results);
    const list = results.children[0];
    const empty = results.children[1];
    const status = results.children[2];
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", `${id}-list`);
    input.setAttribute("aria-expanded", "false");
    let timer;
    let pending;
    let active = -1;
    const rows = () => [...list.querySelectorAll("[role='option']")];
    const listed = () => !results.hidden;
    const follow = () => {
        if (isOpen(panel))
            placePanel(trigger, panel);
    };
    const mark = (at) => {
        const all = rows();
        active = at;
        all.forEach((row, i) => row.toggleAttribute("data-highlighted", i === at));
        if (at >= 0 && all[at]) {
            input.setAttribute("aria-activedescendant", all[at].id);
            all[at].scrollIntoView({ block: "nearest" });
        }
        else
            input.removeAttribute("aria-activedescendant");
    };
    const hideList = () => {
        window.clearTimeout(timer);
        pending?.abort();
        mark(-1);
        results.hidden = true;
        input.setAttribute("aria-expanded", "false");
    };
    const close = (refocus = false) => {
        hideList();
        if (isOpen(panel))
            panel.hidePopover();
        if (refocus)
            trigger.focus({ preventScroll: true });
    };
    const open = () => {
        closePanels();
        if (!isOpen(panel))
            panel.showPopover();
        placePanel(trigger, panel);
        input.focus({ preventScroll: true });
        input.select();
    };
    const fullUrl = (query) => {
        const url = new URL(form.action, location.href);
        url.searchParams.set(input.name || "q", query);
        return url.pathname + url.search;
    };
    const show = (query, hits) => {
        const option = (optionId, href, className) => {
            const a = document.createElement("a");
            a.setAttribute("role", "option");
            a.id = optionId;
            a.setAttribute("href", href);
            a.tabIndex = -1;
            if (className)
                a.className = className;
            return a;
        };
        const part = (className, text) => {
            const span = document.createElement("span");
            span.className = className;
            span.textContent = text;
            return span;
        };
        const row = (h, i) => {
            const a = option(`${id}-${i}`, h.url);
            if (h.kind)
                a.append(part("cap-site-header-result-kind", h.kind));
            a.append(part("cap-site-header-result-title", h.title));
            if (h.detail)
                a.append(part("cap-site-header-result-detail", h.detail));
            return a;
        };
        const top = hits.slice(0, limit);
        const all = option(`${id}-all`, fullUrl(query), "cap-site-header-result-all");
        all.textContent = `All results for \u201c${query}\u201d`;
        list.replaceChildren(...top.map(row), all);
        empty.hidden = top.length > 0;
        empty.textContent = top.length
            ? ""
            : `No match for “${query}”. Try fewer words, or open all results.`;
        status.textContent = top.length ? plural(hits.length, "match", "matches") : "No match";
        mark(-1);
        results.hidden = false;
        input.setAttribute("aria-expanded", "true");
        follow();
    };
    const ask = () => {
        const query = input.value.trim();
        pending?.abort();
        if (!query || !suggest)
            return hideList();
        const mine = new AbortController();
        pending = mine;
        Promise.resolve(suggest(query, mine.signal))
            .then((hits) => {
            if (!mine.signal.aborted && input.value.trim() === query)
                show(query, hits);
        })
            .catch(() => {
            if (!mine.signal.aborted)
                show(query, []);
        });
    };
    const undo = [];
    const on = (target, type, fn, opts) => {
        target.addEventListener(type, fn, opts);
        undo.push(() => target.removeEventListener(type, fn, opts));
    };
    on(panel, "toggle", (e) => {
        const opened = e.newState === "open";
        trigger.setAttribute("aria-expanded", String(opened));
        if (!opened)
            hideList();
    });
    on(trigger, "click", (e) => {
        e.preventDefault();
        hideTip(trigger);
        if (isOpen(panel))
            close();
        else
            open();
    });
    // "/" opens search from anywhere, but not while a person types in a field.
    on(document, "keydown", (e) => {
        if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented)
            return;
        if (e.target?.closest?.("input, textarea, select, [contenteditable='true']"))
            return;
        e.preventDefault();
        open();
    });
    on(input, "input", () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(ask, SUGGEST_DELAY_MS);
    });
    on(input, "keydown", (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            if (listed())
                hideList();
            else
                close(true);
            return;
        }
        if (e.key === "Enter" && !isImeEnter(e)) {
            const row = rows()[active];
            if (listed() && row) {
                e.preventDefault();
                location.assign(row.href);
            }
            return;
        }
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp")
            return;
        if (!listed()) {
            if (input.value.trim())
                ask();
            return;
        }
        e.preventDefault();
        const all = rows();
        mark(active < 0
            ? e.key === "ArrowDown"
                ? 0
                : all.length - 1
            : (active + (e.key === "ArrowDown" ? 1 : all.length - 1)) % all.length);
    });
    // Focus leaving the panel for anything but its icon closes it; so does a press outside both.
    dismissOutside(on, trigger, panel, close);
    // A press on a row follows its link; focus stays in the field until then.
    on(results, "pointerdown", (e) => e.preventDefault());
    on(window, "resize", follow);
    on(window, "scroll", follow, true);
    return () => {
        close();
        undo.forEach((f) => f());
        results.remove();
        for (const a of [
            "role",
            "aria-autocomplete",
            "aria-controls",
            "aria-expanded",
            "aria-activedescendant",
        ])
            input.removeAttribute(a);
    };
}
