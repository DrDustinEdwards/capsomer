import { readStored, writeStored } from "../hooks/hooks.js";
export const LAYOUTS = ["write", "split", "preview"];
export const LAYOUT_KEY = "cap-editor-layout";
// A stored layout, or Write: what the server and the first paint show, so they agree.
export function readLayout(stored) {
    return stored === "split" || stored === "preview" ? stored : "write";
}
// The layout stored under `key`, or null when none is (or storage is refused).
export function storedLayout(key = LAYOUT_KEY) {
    const v = readStored(key);
    return v === null ? null : readLayout(v);
}
// Kept through hooks.ts' storage, which tells every reader of the key; where storage is refused
// it lasts the page.
export function storeLayout(layout, key = LAYOUT_KEY) {
    writeStored(key, layout);
}
// The preview's address with the refresh stamp in it, so a new stamp loads the frame again.
export function previewUrl(base, stamp, param = "at") {
    const hash = base.indexOf("#");
    const path = hash === -1 ? base : base.slice(0, hash);
    const tail = hash === -1 ? "" : base.slice(hash);
    return `${path}${path.includes("?") ? "&" : "?"}${param}=${encodeURIComponent(stamp)}${tail}`;
}
// Ctrl or Cmd+S calls `save` in place of the browser's own save-page. `save` decides whether a
// save may run now. Returns the detach.
export function onSaveKey(save, target = window) {
    const onKey = (event) => {
        const e = event;
        if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "s") {
            e.preventDefault();
            save();
        }
    };
    target.addEventListener("keydown", onKey);
    return () => target.removeEventListener("keydown", onKey);
}
// The surfaces whose typing counts: the markdown editor's and any element the app marks.
export const TYPING_SURFACE = ".cm-editor, [data-cap-typing-surface]";
export const TYPING_ATTR = "data-cap-typing";
// While someone types a character in a writing surface, `data-cap-typing` on the document makes
// the chrome step back (editor-workspace.css); a mouse move brings it back, and so does focus,
// which the CSS reads. A character typed in a dialog's field does not count. Returns the detach.
export function typingRecede(options = {}) {
    const root = options.root ?? document.documentElement;
    const surface = options.surface ?? TYPING_SURFACE;
    const settle = () => {
        if (root.hasAttribute(TYPING_ATTR))
            root.removeAttribute(TYPING_ATTR);
    };
    const type = (event) => {
        if (event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1)
            return;
        const t = event.target;
        if (t instanceof Element && t.closest(surface))
            root.setAttribute(TYPING_ATTR, "");
    };
    window.addEventListener("keydown", type);
    window.addEventListener("mousemove", settle);
    return () => {
        window.removeEventListener("keydown", type);
        window.removeEventListener("mousemove", settle);
        root.removeAttribute(TYPING_ATTR);
    };
}
// Without a framework: every [data-cap="editor-workspace"] takes its layout from the radios in
// its [data-cap-layout] group, remembered under its data-key (or LAYOUT_KEY), and shows only the
// panes ([data-pane="write"], [data-pane="preview"]) that layout holds. Without script the
// layout the HTML was written with stays.
// The root is Element | Document | DocumentFragment, not ParentNode: under @cloudflare/workers-types
// an HTMLFormElement does not type as a ParentNode, so a site could not pass its form.
export function enhance(root = document) {
    const undo = [];
    for (const el of root.querySelectorAll('[data-cap="editor-workspace"]')) {
        if (el.hasAttribute("data-cap-ready"))
            continue;
        el.setAttribute("data-cap-ready", "");
        const key = el.dataset.key ?? LAYOUT_KEY;
        const body = el.querySelector(".cap-workspace-body");
        const radios = [
            ...el.querySelectorAll("[data-cap-layout] input[type=radio]"),
        ];
        const show = (layout) => {
            body?.setAttribute("data-layout", layout);
            for (const pane of el.querySelectorAll("[data-pane]"))
                pane.hidden = layout !== "split" && pane.dataset.pane !== layout;
            for (const r of radios)
                r.checked = r.value === layout;
        };
        // The remembered layout, else the one the HTML was written with.
        show(storedLayout(key) ?? readLayout(body?.dataset.layout));
        const onChange = (event) => {
            const t = event.target;
            if (!(t instanceof HTMLInputElement) || t.type !== "radio")
                return;
            const layout = readLayout(t.value);
            show(layout);
            storeLayout(layout, key);
        };
        el.addEventListener("change", onChange);
        undo.push(() => {
            el.removeEventListener("change", onChange);
            el.removeAttribute("data-cap-ready");
        });
    }
    return () => {
        for (const u of undo)
            u();
    };
}
