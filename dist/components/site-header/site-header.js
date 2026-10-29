// The site header's behavior: the panels (the switcher, a section with children, the account),
// the phone's sheet, and each icon control's name tip. No framework; the React wrapper uses the
// same functions. Every link, the logo, Sign in and the controls are in the HTML without any of
// this; a panel's contents are too, so a page with no script still reads and reaches them.
//
// A panel is a list of links under a disclosure button (aria-expanded, aria-controls), not an
// ARIA menu: every item goes somewhere. It is a manual popover in the top layer, so it is above
// the page and every rail, and this module gives it light dismiss and Esc. On a mouse it opens at
// once on hover, with no delay, and on click; on touch, on tap. Opened from the keyboard, focus
// moves to its first item; Up and Down move between items, Home and End go to the ends, Esc closes
// it and focus goes back to its button.
import { closeDialog, openDialog, wireDialog } from "../dialog/dialog.js";
import { escapeHtml } from "../email/email.js";
import { place } from "../popover/popover.js";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.js";
// A count is a glance, not a figure: past 99 it says 99+, in the header, the sheet, the bottom bar
// and the admin shell alike; the accessible name keeps the real count.
export const badgeText = (count) => (count > 99 ? "99+" : String(count));
// How long a panel opened by hover stays after the pointer leaves both it and its button, so the
// pointer can cross the gap between them.
export const HOVER_GRACE_MS = 150;
// The phone layout's width (docs/design/design-site-header.md, section 5): under 768px.
export const PHONE_QUERY = "(max-width: 767.98px)";
// The next item for a key in a panel of `count` items with `at` focused (-1: none yet). Returns
// null for a key that does not move. Up and Down wrap; Home and End go to the ends.
export function stepIndex(count, at, key) {
    if (count === 0)
        return null;
    if (key === "Home")
        return 0;
    if (key === "End")
        return count - 1;
    if (key === "ArrowDown")
        return at < 0 ? 0 : (at + 1) % count;
    if (key === "ArrowUp")
        return at < 0 ? count - 1 : (at - 1 + count) % count;
    return null;
}
// The items a panel holds that a person can reach: links and enabled buttons that are drawn.
export function panelItems(panel) {
    return [...panel.querySelectorAll("a[href], button:not(:disabled)")].filter((el) => el.getClientRects().length > 0);
}
const isOpen = (panel) => {
    try {
        return panel.matches(":popover-open");
    }
    catch {
        return false;
    }
};
// Every panel this module has wired, so opening one closes the others in the same header.
const panels = new Map();
export function closePanels(except) {
    for (const [panel, p] of panels)
        if (panel !== except && isOpen(panel))
            p.close();
}
// Puts a panel under its button, lined up with the button's edge (start, or end with
// data-align="end"), its top just under the header's bottom edge so it never covers the header.
export function placePanel(trigger, panel) {
    const bar = trigger.closest(".cap-site-header")?.getBoundingClientRect();
    const t = trigger.getBoundingClientRect();
    const offset = bar ? Math.max(4, Math.round(bar.bottom - t.bottom) + 4) : 4;
    place(trigger, panel, { side: "bottom", align: panel.dataset.align === "end" ? "end" : "start", offset });
}
let escBound = false;
function onEsc(e) {
    if (e.key !== "Escape")
        return;
    for (const [panel, p] of panels) {
        if (!isOpen(panel))
            continue;
        e.preventDefault();
        const inside = panel.contains(document.activeElement) || p.trigger === document.activeElement;
        p.close();
        if (inside)
            p.trigger.focus({ preventScroll: true });
    }
}
// Focus leaving an open panel for anything but its button closes it, as does a press outside both.
function dismissOutside(on, trigger, panel, close) {
    on(panel, "focusout", (e) => {
        const to = e.relatedTarget;
        if (to && !panel.contains(to) && to !== trigger)
            close();
    });
    on(document, "pointerdown", (e) => {
        const t = e.target;
        if (isOpen(panel) && !panel.contains(t) && !trigger.contains(t))
            close();
    });
}
export function wirePanel(trigger, panel) {
    if (!panel.hasAttribute("popover"))
        panel.setAttribute("popover", "manual");
    trigger.setAttribute("aria-expanded", String(isOpen(panel)));
    if (panel.id)
        trigger.setAttribute("aria-controls", panel.id);
    // How it was opened: by hover it closes when the pointer leaves; by a click or a key it stays.
    let mode = "held";
    let timer;
    const undo = [];
    const on = (target, type, fn, opts) => {
        target.addEventListener(type, fn, opts);
        undo.push(() => target.removeEventListener(type, fn, opts));
    };
    const follow = () => {
        if (isOpen(panel))
            placePanel(trigger, panel);
    };
    const close = () => {
        window.clearTimeout(timer);
        if (isOpen(panel))
            panel.hidePopover();
    };
    const open = (how, focusFirst = false) => {
        window.clearTimeout(timer);
        closePanels(panel);
        mode = how;
        if (!isOpen(panel))
            panel.showPopover();
        placePanel(trigger, panel);
        if (focusFirst)
            panelItems(panel)[0]?.focus({ preventScroll: true });
    };
    panels.set(panel, { trigger, close });
    if (!escBound) {
        escBound = true;
        document.addEventListener("keydown", onEsc);
    }
    on(panel, "toggle", (e) => {
        const opened = e.newState === "open";
        trigger.setAttribute("aria-expanded", String(opened));
        window[opened ? "addEventListener" : "removeEventListener"]("scroll", follow, true);
        window[opened ? "addEventListener" : "removeEventListener"]("resize", follow);
        if (!opened) {
            // Focus left inside a closed panel (or lost to the page) goes back to its button.
            const active = document.activeElement;
            if (!active || active === document.body || panel.contains(active))
                trigger.focus({ preventScroll: true });
        }
    });
    // A click, Enter or Space toggles. A panel opened by hover is held open by a click rather than
    // closed by it, since the click is what the person meant. From the keyboard (no pointer, so
    // detail 0) focus moves to the first item.
    on(trigger, "click", (e) => {
        e.preventDefault();
        hideTip(trigger);
        const byKey = e.detail === 0;
        if (isOpen(panel) && (mode === "held" || byKey))
            close();
        else
            open("held", byKey);
    });
    const hovered = () => trigger.matches(":hover") || panel.matches(":hover");
    const leave = () => {
        if (mode !== "hover")
            return;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
            if (!hovered())
                close();
        }, HOVER_GRACE_MS);
    };
    on(trigger, "pointerenter", (e) => {
        if (e.pointerType !== "mouse")
            return;
        window.clearTimeout(timer);
        if (!isOpen(panel))
            open("hover");
    });
    on(trigger, "pointerleave", leave);
    on(panel, "pointerenter", () => window.clearTimeout(timer));
    on(panel, "pointerleave", leave);
    on(panel, "keydown", (e) => {
        const items = panelItems(panel);
        const next = stepIndex(items.length, items.indexOf(document.activeElement), e.key);
        if (next === null)
            return;
        e.preventDefault();
        items[next]?.focus();
    });
    // Tab past the panel's last item closes it without taking focus back; so does a press outside
    // the panel and its button (light dismiss), as does following a link.
    dismissOutside(on, trigger, panel, close);
    on(panel, "click", (e) => {
        if (e.target.closest("a[href], [data-panel-close]"))
            close();
    });
    return () => {
        close();
        window.removeEventListener("scroll", follow, true);
        window.removeEventListener("resize", follow);
        undo.forEach((f) => f());
        panels.delete(panel);
    };
}
// Opens the phone's sheet (the shared dialog, from the bottom) from the menu button.
export function openSheet(header) {
    const button = header.querySelector(".cap-site-header-menu");
    const sheet = header.querySelector("dialog.cap-site-header-sheet");
    if (!sheet || sheet.open)
        return;
    openDialog(sheet, button, { focus: sheet.querySelector(".cap-site-header-sheet-title") });
    button?.setAttribute("aria-expanded", "true");
}
export function closeSheet(header) {
    const sheet = header.querySelector("dialog.cap-site-header-sheet");
    if (sheet?.open)
        closeDialog(sheet);
}
// Attaches to every [data-cap="site-header"] under root not yet attached: each panel, each
// icon control's tip, search (answered by `suggest`, the site's own), the menu button and its
// sheet. Returns a function that detaches them all.
export function enhance(root = document, { suggest } = {}) {
    const undo = [];
    for (const header of root.querySelectorAll("[data-cap='site-header']:not([data-cap-ready])")) {
        header.dataset.capReady = "";
        const parts = [];
        for (const trigger of header.querySelectorAll("[data-cap-part='panel-trigger']")) {
            const panel = document.getElementById(trigger.getAttribute("aria-controls") ?? "");
            if (panel)
                parts.push(wirePanel(trigger, panel));
        }
        // An icon control's tip names it, so it adds no description; a press hides it.
        for (const tip of header.querySelectorAll(".cap-site-header-tip")) {
            const trigger = tip.parentElement;
            if (!trigger)
                continue;
            parts.push(attachTip(trigger, tip));
            trigger.removeAttribute("aria-describedby");
        }
        const search = header.querySelector("[data-cap-part='search']");
        if (search)
            parts.push(wireSearch(search, suggest));
        const sheet = header.querySelector("dialog.cap-site-header-sheet");
        const menu = header.querySelector(".cap-site-header-menu");
        if (sheet)
            parts.push(wireDialog(sheet));
        const onClose = () => menu?.setAttribute("aria-expanded", "false");
        sheet?.addEventListener("close", onClose);
        const onClick = (e) => {
            const t = e.target;
            if (menu && t.closest(".cap-site-header-menu") === menu)
                openSheet(header);
            if (sheet?.open && sheet.contains(t) && t.closest("a[href]"))
                closeDialog(sheet);
        };
        header.addEventListener("click", onClick);
        undo.push(() => {
            header.removeEventListener("click", onClick);
            sheet?.removeEventListener("close", onClose);
            parts.forEach((f) => f());
            delete header.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
// How long the field waits after a key before it asks, so a word typed fast asks once.
export const SUGGEST_DELAY_MS = 120;
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
    results.innerHTML = `<div role="listbox" id="${id}-list" aria-label="${escapeHtml(input.getAttribute("aria-label") ?? "Search")}"></div><p class="cap-site-header-results-empty" hidden></p><span class="cap-sr-only" role="status"></span>`;
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
        const row = (h, i) => `<a role="option" id="${id}-${i}" href="${escapeHtml(h.url)}" tabindex="-1">${h.kind ? `<span class="cap-site-header-result-kind">${escapeHtml(h.kind)}</span>` : ""}<span class="cap-site-header-result-title">${escapeHtml(h.title)}</span>${h.detail ? `<span class="cap-site-header-result-detail">${escapeHtml(h.detail)}</span>` : ""}</a>`;
        const top = hits.slice(0, limit);
        list.innerHTML = `${top.map(row).join("")}<a role="option" id="${id}-all" href="${escapeHtml(fullUrl(query))}" tabindex="-1" class="cap-site-header-result-all">All results for “${escapeHtml(query)}”</a>`;
        empty.hidden = top.length > 0;
        empty.textContent = top.length ? "" : `No match for “${query}”. Try fewer words, or open all results.`;
        status.textContent = top.length ? `${hits.length} ${hits.length === 1 ? "match" : "matches"}` : "No match";
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
        if (e.key === "Enter") {
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
        mark(active < 0 ? (e.key === "ArrowDown" ? 0 : all.length - 1) : (active + (e.key === "ArrowDown" ? 1 : all.length - 1)) % all.length);
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
        for (const a of ["role", "aria-autocomplete", "aria-controls", "aria-expanded", "aria-activedescendant"])
            input.removeAttribute(a);
    };
}
const SEARCH_GLYPH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-3.2-3.2" /></svg>';
const THEME_BUTTON = `<button type="button" class="cap-theme-button cap-site-header-icon cap-site-header-theme" data-cap="theme-switch" data-variant="button" aria-label="Switch to dark theme">
<svg class="cap-theme-icon" data-show="light" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
<svg class="cap-theme-icon" data-show="dark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
<span class="cap-theme-tip cap-popover" data-variant="tooltip" data-side="bottom" data-offset="6" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-theme-tip-text">Switch to dark theme</span><kbd>T</kbd></span>
</button>`;
/** The search icon and its panel, as `letterheadHtml` writes them and the React header draws them. */
export function searchHtml({ action, label, name = "q" }) {
    return `<div class="cap-site-header-search" data-cap-part="search"><a class="cap-site-header-icon cap-site-header-search-button" href="${escapeHtml(action)}" aria-label="${escapeHtml(label)}" data-cap-part="search-trigger">${SEARCH_GLYPH}<span class="cap-site-header-tip cap-popover" data-variant="tooltip" data-side="bottom" data-offset="6" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-site-header-tip-text">${escapeHtml(label)}</span><kbd>/</kbd></span></a><div class="cap-site-header-search-panel" data-align="end"><form role="search" aria-label="Site" action="${escapeHtml(action)}" method="get">${SEARCH_GLYPH}<input type="search" name="${escapeHtml(name)}" placeholder="${escapeHtml(label)}" aria-label="${escapeHtml(label)}" autocomplete="off" enterkeyhint="search" /></form></div></div>`;
}
/**
 * A public page's letterhead as HTML: plain string building, so a static build or a server writes
 * the same markup as the React header (Dustin, 2026-10-27). `enhance` and the theme switch wire it.
 */
export function letterheadHtml({ name, agency = "Dustin Edwards", home = "/", mark, links, current, search, skipTo = "#main", theme = true }) {
    const label = [agency, name].filter(Boolean).join(" ");
    const names = [agency && `<span class="cap-site-header-agency">${escapeHtml(agency)}</span>`, name && `<span class="cap-site-header-name">${escapeHtml(name)}</span>`]
        .filter(Boolean)
        .join(" ");
    const items = links
        .map(([href, text]) => `<li><a class="cap-site-header-link" href="${escapeHtml(href)}"${text === current ? ' aria-current="page"' : ""}>${escapeHtml(text)}</a></li>`)
        .join("");
    const field = search ? searchHtml(search) : "";
    return `<header class="cap-site-header" data-cap="site-header" data-variant="letterhead" data-markup="">
<a class="cap-site-header-skip" href="${escapeHtml(skipTo)}">Skip to content</a>
<a class="cap-site-header-logo" href="${escapeHtml(home)}" aria-label="${escapeHtml(label)}">${mark}<span class="cap-site-header-names" aria-hidden="true">${names}</span></a>
<nav class="cap-site-header-sections" aria-label="Sections"><ul>${items}</ul></nav>
<div class="cap-site-header-tools">${field}${theme ? THEME_BUTTON : ""}</div>
</header>`;
}
