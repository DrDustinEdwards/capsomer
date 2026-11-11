// Save for later: a set of ids kept in this browser (localStorage, as a JSON array under one key),
// no account and no server. The button is a toggle (aria-pressed). Every read and write is in
// try/catch: a blocked store saves nothing and says nothing breaks. Same-tab listeners and the
// `storage` event keep every button for the same id, here and in other tabs, in step.
const listeners = new Set();
// The stored list, or "[]" when nothing is stored or the store is blocked.
export function savedRaw(key) {
    try {
        return localStorage.getItem(key) || "[]";
    }
    catch {
        return "[]";
    }
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
// Adds or removes `id`, and tells every listener. Returns whether it is now saved.
export function toggleSaved(key, id) {
    const list = savedIds(savedRaw(key));
    const next = list.includes(id) ? list.filter((s) => s !== id) : [...list, id];
    try {
        localStorage.setItem(key, JSON.stringify(next));
    }
    catch {
        // Blocked or full: nothing is kept, and the button shows the stored state.
    }
    for (const f of listeners)
        f();
    return next.includes(id);
}
// For useSyncExternalStore: this tab's changes, and other tabs' through `storage`.
export function subscribeSaved(onChange) {
    listeners.add(onChange);
    window.addEventListener("storage", onChange);
    return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onChange);
    };
}
// The button's words and icon from its state.
export function paint(button, saved) {
    button.setAttribute("aria-pressed", String(saved));
    const label = button.querySelector(".cap-save-label");
    if (label)
        label.textContent = saved
            ? (button.dataset.savedLabel ?? "Saved")
            : (button.dataset.label ?? "Save");
}
// A page with no React: every button.cap-save[data-cap="save-toggle"] with data-key and data-id.
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
