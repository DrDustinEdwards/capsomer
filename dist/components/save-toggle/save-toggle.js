// Save for later: a set of ids kept in this browser (localStorage, a JSON array under one key), no
// account and no server. Where the store is blocked the list lasts the page, and every button for
// the same id, here and in other tabs, stays in step.
import { readStored, subscribeStored, writeStored } from "../hooks/hooks.js";
export function savedRaw(key) {
    return readStored(key) || "[]";
}
export function savedIds(raw) {
    try {
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
    }
    catch {
        return [];
    }
}
export function isSaved(raw, id) {
    return savedIds(raw).includes(id);
}
export function toggleSaved(key, id) {
    const list = savedIds(savedRaw(key));
    const next = list.includes(id) ? list.filter((s) => s !== id) : [...list, id];
    writeStored(key, JSON.stringify(next));
    return next.includes(id);
}
export function subscribeSaved(onChange) {
    return subscribeStored(onChange);
}
// aria-pressed fills the bookmark. The label stays the same: a toggle's name does not change with its state (APG).
export function paint(button, saved) {
    button.setAttribute("aria-pressed", String(saved));
}
export function enhance(root = document) {
    const off = [];
    for (const button of root.querySelectorAll('button[data-cap="save-toggle"]:not([data-cap-ready])')) {
        const key = button.dataset.key ?? "";
        const id = button.dataset.id ?? "";
        if (!key || !id)
            continue;
        const sync = () => paint(button, isSaved(savedRaw(key), id));
        const click = () => toggleSaved(key, id);
        button.addEventListener("click", click);
        const unsubscribe = subscribeSaved(sync);
        button.dataset.capReady = "";
        sync();
        off.push(() => {
            button.removeEventListener("click", click);
            unsubscribe();
            delete button.dataset.capReady;
        });
    }
    return () => off.forEach((f) => f());
}
