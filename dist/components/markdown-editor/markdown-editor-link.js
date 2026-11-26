// The markdown editor's link palette: a popover with a search box and a listbox of pages, opened
// by the Link tool or Ctrl or Cmd + K. Enter on a typed address links it; a page links its URL.
import { plural } from "@drdustinedwards/site-helpers/text";
import { createListbox } from "../listbox/listbox.js";
import { isImeEnter } from "../shortcuts/shortcuts.js";
import { dismiss, el, floating } from "./markdown-editor-dom.js";
import { LINK_RESULT_LIMIT, filterLinkTargets, linkEdit, looksLikeUrl, } from "./markdown-editor-edits.js";
export function createLinkPalette(c, beforeOpen) {
    const { o, host, uid } = c;
    let link = null;
    async function resolveTargets(query) {
        const src = o.linkTargets;
        if (!src)
            return [];
        if (typeof src === "function")
            return (await src(query)).slice(0, LINK_RESULT_LIMIT);
        return filterLinkTargets(src, query);
    }
    function render() {
        if (!link)
            return;
        const l = link;
        const typed = l.input.value;
        const url = looksLikeUrl(typed);
        l.list.replaceChildren(...l.matches.map((t) => {
            const opt = el("div", {
                class: "cap-option",
                role: "option",
                "data-value": t.href,
                "data-label": t.title,
            });
            opt.append(el("span", { class: "cap-option-label" }, t.title), el("span", { class: "cap-md-option-hint" }, t.hint ?? t.href, t.note ? el("span", { class: "cap-md-option-note" }, ` ${t.note}`) : ""));
            return opt;
        }));
        l.list.hidden = l.matches.length === 0;
        l.input.setAttribute("aria-expanded", String(l.matches.length > 0));
        l.lb.refresh();
        l.lb.setActive(l.matches.length > 0 ? 0 : null);
        l.note.textContent = url
            ? "Enter to link to this address"
            : l.matches.length > 0
                ? `${plural(l.matches.length, "page")}. Up and Down choose, Enter links.`
                : o.linkTargets
                    ? "No pages match. Type a URL to link out."
                    : "Type a URL to link to.";
    }
    async function refresh() {
        if (!link)
            return;
        const l = link;
        const ask = ++l.ask;
        const matches = await resolveTargets(l.input.value).catch(() => []);
        if (link !== l || ask !== l.ask)
            return;
        l.matches = matches;
        render();
    }
    function open() {
        const surface = c.surface();
        if (!surface || link || c.locked())
            return;
        beforeOpen();
        const { from, to } = surface.selection();
        const selected = c.doc().slice(from, to);
        const panel = el("div", {
            class: "cap-popover cap-md-palette",
            popover: "manual",
            role: "group",
            "aria-label": "Insert a link",
            "data-size": "lg",
            "data-side": "bottom",
            "data-align": "start",
        });
        const input = el("input", {
            type: "text",
            class: "cap-input",
            id: `${uid}-link`,
            role: "combobox",
            "aria-autocomplete": "list",
            "aria-expanded": "false",
            "aria-controls": `${uid}-list`,
            autocomplete: "off",
            spellcheck: "false",
            placeholder: "Search pages, or type a URL",
        });
        input.value = selected;
        const label = el("label", { class: "cap-md-palette-label", for: input.id }, "Link to");
        const list = el("div", {
            class: "cap-listbox",
            role: "listbox",
            id: `${uid}-list`,
            "aria-label": "Pages",
            "data-wrap": "",
        });
        const note = el("p", { class: "cap-md-palette-note", role: "status" });
        panel.append(label, input, list, note);
        host.append(panel);
        // Enter on a typed address is the palette's own; the listbox must not also act on it, and
        // it does not once the event is defaultPrevented. This listener goes first.
        input.addEventListener("keydown", (e) => {
            const l = link;
            if (!l)
                return;
            // legacy-scan:keep ime-safe-enter-submit isImeEnter (shortcuts.ts) checks isComposing and keyCode 229; the scanner cannot follow it.
            if (e.key === "Enter" && !isImeEnter(e) && looksLikeUrl(l.input.value)) {
                e.preventDefault();
                insert(l.input.value.trim(), l.input.value.trim());
            }
            else if (e.key === "Escape") {
                // Stopped as well as prevented: the Escape must not also close a dialog around the editor.
                e.preventDefault();
                e.stopPropagation();
                close(true);
            }
        });
        const lb = createListbox(list, {
            input,
            selection: "none",
            wrap: true,
            status: note,
            hideWhenEmpty: false,
        });
        list.addEventListener("cap:option-select", ((e) => insert(e.detail.value, e.detail.label)));
        panel.addEventListener("focusout", (e) => {
            const to = e.relatedTarget;
            if (to instanceof Node && panel.contains(to))
                return;
            // Focus leaving the window (another tab) is not leaving the palette.
            if (to === null && !document.hasFocus())
                return;
            close(to === null);
        });
        link = {
            from,
            to,
            panel,
            input,
            list,
            note,
            lb,
            matches: [],
            ask: 0,
            stop: floating(c, panel, from),
        };
        input.focus();
        render();
        void refresh();
        input.addEventListener("input", () => void refresh());
    }
    function teardown(l) {
        link = null;
        l.stop();
        l.lb.detach();
        dismiss(l.panel);
    }
    function close(restoreFocus) {
        const l = link;
        if (!l)
            return;
        teardown(l);
        const surface = c.surface();
        if (!surface)
            return;
        surface.select(l.from, l.to);
        if (restoreFocus)
            surface.focus();
    }
    function insert(href, fallback) {
        const l = link;
        const surface = c.surface();
        if (!l || !surface)
            return;
        const selected = c.doc().slice(l.from, l.to);
        teardown(l);
        surface.apply(linkEdit(l.from, l.to, selected, href, fallback));
    }
    return { open, close };
}
