// The markdown editor's slash menu: a "/" alone on a line opens a list of block scaffolds under
// the caret, chosen with the arrow keys or the pointer.
import { rovingIndex } from "../toolbar/toolbar.js";
import { dismiss, el, floating } from "./markdown-editor-dom.js";
export function createSlashMenu(c, choose) {
    const { o, host } = c;
    let slash = null;
    function close() {
        if (!slash)
            return;
        // Cleared first: removing a focused item fires focusout, which comes back here.
        const { menu, stop } = slash;
        slash = null;
        stop();
        dismiss(menu);
    }
    function sync() {
        const surface = c.surface();
        if (!surface || !o.scaffolds?.length || c.locked())
            return close();
        const at = surface.caret();
        if (at.lineText !== "/" || at.head !== at.lineTo)
            return close();
        if (!slash) {
            const menu = el("ul", {
                class: "cap-popover cap-md-slash",
                popover: "manual",
                role: "list",
                "aria-label": "Insert a block",
                "data-flush": "",
                "data-size": "auto",
                "data-side": "bottom",
                "data-align": "start",
            });
            for (const s of o.scaffolds) {
                const b = el("button", { type: "button", class: "cap-md-slash-item" }, el("strong", {}, s.label), el("span", { class: "cap-md-slash-hint" }, s.hint));
                b.tabIndex = -1;
                b.addEventListener("click", () => choose(s));
                menu.append(el("li", {}, b));
            }
            menu.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    close();
                    c.surface()?.focus();
                    return;
                }
                const items = [...menu.querySelectorAll(".cap-md-slash-item")];
                const next = rovingIndex(e.key, items.findIndex((i) => i === document.activeElement), items.length, "vertical");
                if (next === null)
                    return;
                e.preventDefault();
                items[next]?.focus();
            });
            host.append(menu);
            slash = { from: at.lineFrom, menu, stop: floating(c, menu, at.lineFrom) };
            c.say("Block menu open. Press Down arrow to choose a block, Escape to close.");
        }
        slash.from = at.lineFrom;
    }
    return {
        sync,
        close,
        isOpen: () => slash !== null,
        // Focus has moved to `to`: whether that is still the menu.
        holds: (to) => !!slash && to instanceof Node && slash.menu.contains(to),
        focusFirst: () => slash?.menu.querySelector(".cap-md-slash-item")?.focus(),
    };
}
