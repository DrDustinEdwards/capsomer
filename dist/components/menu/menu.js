// The form menu's behavior: a <details> of submit buttons and links that works with no script. With
// script it closes on Esc (focus back on the summary) and on a press or focus outside, and arrow
// keys move between buttons; ArrowDown on the summary opens it. The Base UI menu is React only.
import { enhanceEach } from "../hooks/hooks.js";
const buttonsOf = (d) => Array.from(d.querySelectorAll(".cap-menu > :is(button:not(:disabled), a[href])"));
export function stepIndex(count, from, dir) {
    if (count === 0)
        return -1;
    if (from < 0)
        return dir === 1 ? 0 : count - 1;
    return (from + dir + count) % count;
}
export function enhance(root = document) {
    return enhanceEach(root, "menu-form", (el) => {
        const d = el;
        const summary = d.querySelector(":scope > summary");
        const close = (focus) => {
            d.open = false;
            if (focus)
                summary?.focus();
        };
        const onKey = (e) => {
            const items = buttonsOf(d);
            if (e.key === "Escape" && d.open) {
                e.preventDefault();
                close(true);
            }
            else if (e.key === "ArrowDown" && e.target === summary && !d.open) {
                e.preventDefault();
                d.open = true;
                items[0]?.focus();
            }
            else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && d.open) {
                const at = items.indexOf(document.activeElement);
                const next = items[stepIndex(items.length, at, e.key === "ArrowDown" ? 1 : -1)];
                if (next) {
                    e.preventDefault();
                    next.focus();
                }
            }
        };
        const onOutside = (e) => {
            if (d.open && e.target instanceof Node && !d.contains(e.target))
                close(false);
        };
        const onFocusOut = (e) => {
            if (d.open && e.relatedTarget instanceof Node && !d.contains(e.relatedTarget))
                close(false);
        };
        d.addEventListener("keydown", onKey);
        d.addEventListener("focusout", onFocusOut);
        document.addEventListener("pointerdown", onOutside);
        return () => {
            d.removeEventListener("keydown", onKey);
            d.removeEventListener("focusout", onFocusOut);
            document.removeEventListener("pointerdown", onOutside);
        };
    });
}
