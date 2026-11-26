// Editor workspace: the page around a writing surface. The Write, Split and Preview layout (remembered), the
// site's render in a sandboxed frame refreshed once typing pauses, Ctrl or Cmd+S as a save in place, and
// chrome that steps back while typing. The parts work with any surface.
import { readStored, writeStored } from "../hooks/hooks.js";
import { register } from "../shortcuts/shortcuts.js";
export const LAYOUTS = ["write", "split", "preview"];
export const LAYOUT_KEY = "cap-editor-layout";
export function readLayout(stored) {
    return stored === "split" || stored === "preview" ? stored : "write";
}
export function storedLayout(key = LAYOUT_KEY) {
    const v = readStored(key);
    return v === null ? null : readLayout(v);
}
// Kept through hooks.ts' storage, which tells every reader of the key; where storage is refused
// it lasts the page.
export function storeLayout(layout, key = LAYOUT_KEY) {
    writeStored(key, layout);
}
export function previewUrl(base, stamp, param = "at") {
    const hash = base.indexOf("#");
    const path = hash === -1 ? base : base.slice(0, hash);
    const tail = hash === -1 ? "" : base.slice(hash);
    return `${path}${path.includes("?") ? "&" : "?"}${param}=${encodeURIComponent(stamp)}${tail}`;
}
// Ctrl or Cmd+S calls `save` in place of the browser's own save-page, through the shortcuts
// registry, so it is listed in the "?" sheet and steps aside while a modal dialog is open. `save`
// decides whether a save may run now. Returns the detach.
export function onSaveKey(save) {
    return register({ key: "Mod+s", label: "Save", group: "Editor", run: () => save() });
}
export const TYPING_SURFACE = ".cm-editor, .cap-rich-editor-surface, [data-cap-typing-surface]";
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
