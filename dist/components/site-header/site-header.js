// The site header's behaviour: the panels (the switcher, a section with children, the account),
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
// Wires one disclosure button to its panel. Returns a function that unwires it.
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
    // Tab past the panel's last item closes it without taking focus back.
    on(panel, "focusout", (e) => {
        const to = e.relatedTarget;
        if (to && !panel.contains(to) && to !== trigger)
            close();
    });
    // A press outside the panel and its button closes it (light dismiss), as does following a link.
    on(document, "pointerdown", (e) => {
        const t = e.target;
        if (isOpen(panel) && !panel.contains(t) && !trigger.contains(t))
            close();
    });
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
// icon control's tip, the menu button and its sheet. Returns a function that detaches them all.
export function enhance(root = document) {
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
