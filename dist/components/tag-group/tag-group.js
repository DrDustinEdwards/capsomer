// The tag group's behavior: one tab stop (the shared toolbar's roving focus), Left and Right move between tags,
// Delete, Backspace, Enter or Space removes the focused one. Focus then goes to the next tag, the one before,
// the element named by data-cap-then, else the group, so it is never lost. A removal is reversible, so it
// happens at once and the page's message region offers Undo.
import { say } from "../message/message.js";
import { attachToolbar } from "../toolbar/toolbar.js";
const REMOVE = ".cap-tag-remove";
const nameOf = (tag) => tag.querySelector(".cap-tag-name")?.textContent?.trim() ?? "";
// Removes one tag and moves focus on. Fires a cancelable, bubbling `cap-tag-remove` on the group
// first, with { value, label }: an app that refuses the removal calls preventDefault().
export function removeTag(group, tag) {
    const label = nameOf(tag);
    const value = tag.dataset.value ?? label;
    if (!group.dispatchEvent(new CustomEvent("cap-tag-remove", {
        bubbles: true,
        cancelable: true,
        detail: { value, label },
    })))
        return false;
    const list = tag.parentElement;
    const next = tag.nextElementSibling;
    const to = (next ?? tag.previousElementSibling)?.querySelector(REMOVE);
    tag.remove();
    const then = group.dataset.capThen
        ? document.querySelector(group.dataset.capThen)
        : null;
    if (to)
        to.focus();
    else if (then)
        then.focus();
    else {
        group.tabIndex = -1;
        group.focus();
    }
    if (list && document.querySelector("[data-cap='message']")) {
        say(`Removed ${label}.`, {
            undone: `${label} is back.`,
            undo: () => {
                list.insertBefore(tag, next && next.parentElement === list ? next : null);
                group.dispatchEvent(new CustomEvent("cap-tag-restore", {
                    bubbles: true,
                    detail: { value, label },
                }));
            },
            returnFocus: () => tag.querySelector(REMOVE),
        });
    }
    return true;
}
export function enhance(root = document) {
    const undo = [];
    for (const group of root.querySelectorAll("[data-cap='tag-group']:not([data-cap-ready])")) {
        group.dataset.capReady = "";
        const detachRoving = attachToolbar(group, REMOVE);
        const act = (e) => {
            const tag = e.target.closest(".cap-tag");
            if (!tag || !e.target.closest(REMOVE))
                return;
            e.preventDefault();
            removeTag(group, tag);
        };
        const onKey = (e) => {
            if (e.key === "Delete" || e.key === "Backspace")
                act(e);
        };
        group.addEventListener("click", act);
        group.addEventListener("keydown", onKey);
        undo.push(() => {
            detachRoving();
            group.removeEventListener("click", act);
            group.removeEventListener("keydown", onKey);
            delete group.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
