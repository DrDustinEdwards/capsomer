// The filter bar's behavior (filter-bar.md): address-state helpers a loader and a link both use,
// and, for a bar that applies as you type, a debounced submit that waits out an IME composition.
// No framework.
// `path` with `params` as its query, leaving out empty values and any value equal to its default
// (`defaults`), so the address stays short and one view has one address.
export function withParams(path, params, defaults = {}) {
    const q = new URLSearchParams();
    for (const [key, raw] of Object.entries(params)) {
        if (raw === null || raw === undefined)
            continue;
        const value = String(raw).trim();
        if (value === "" || value === String(defaults[key] ?? ""))
            continue;
        q.set(key, value);
    }
    const s = q.toString();
    return s ? `${path}?${s}` : path;
}
// The address with only `keep` left (a sort and a page size survive Clear; the filters go).
export function clearedHref(path, params, keep = []) {
    const kept = {};
    for (const key of keep)
        kept[key] = params[key];
    return withParams(path, kept);
}
// True when any of `keys` has a value in `params` that differs from its default.
export function isFiltered(params, keys, defaults = {}) {
    return keys.some((k) => {
        const v = params[k];
        return (v !== null &&
            v !== undefined &&
            String(v).trim() !== "" &&
            String(v) !== String(defaults[k] ?? ""));
    });
}
export const SEARCH_DELAY_MS = 300;
// Submits `form` after typing stops in a text field, at once when a select, a checkbox or a
// radio changes. While an IME is composing ("ni hao" before it becomes 你好) nothing is sent; the
// end of the composition counts as typing. Returns the function that detaches.
export function liveSubmit(form, delay = SEARCH_DELAY_MS) {
    let timer;
    let composing = false;
    const send = () => {
        clearTimeout(timer);
        form.requestSubmit();
    };
    const later = () => {
        clearTimeout(timer);
        timer = setTimeout(send, delay);
    };
    const isText = (el) => el instanceof HTMLInputElement &&
        ![
            "checkbox",
            "radio",
            "range",
            "date",
            "month",
            "week",
            "time",
            "datetime-local",
            "color",
        ].includes(el.type);
    const onInput = (e) => {
        if (composing || e.isComposing)
            return;
        if (isText(e.target) || e.target instanceof HTMLTextAreaElement)
            later();
    };
    const onChange = (e) => {
        if (!isText(e.target) && !(e.target instanceof HTMLTextAreaElement))
            send();
    };
    const onStart = () => {
        composing = true;
        clearTimeout(timer);
    };
    const onEnd = () => {
        composing = false;
        later();
    };
    form.addEventListener("input", onInput);
    form.addEventListener("change", onChange);
    form.addEventListener("compositionstart", onStart);
    form.addEventListener("compositionend", onEnd);
    return () => {
        clearTimeout(timer);
        form.removeEventListener("input", onInput);
        form.removeEventListener("change", onChange);
        form.removeEventListener("compositionstart", onStart);
        form.removeEventListener("compositionend", onEnd);
    };
}
// Attaches liveSubmit to every form[data-cap="filter-bar"][data-live] under root.
export function enhance(root = document) {
    const undo = [];
    for (const form of Array.from(root.querySelectorAll("form[data-cap='filter-bar'][data-live]:not([data-cap-ready])"))) {
        form.dataset.capReady = "";
        const stop = liveSubmit(form, Number(form.dataset.delay) || SEARCH_DELAY_MS);
        undo.push(() => {
            stop();
            delete form.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
