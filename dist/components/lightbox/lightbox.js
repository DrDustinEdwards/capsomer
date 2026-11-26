// The image viewer: a picture opens full size in the shared dialog (components/dialog) and shrinks
// back into the picture it came from. A container marks itself `data-cap="lightbox"`; a link to the
// full image (`a.image-link`) or a diagram image (`img.diagram-image`) inside it opens the viewer.
// The click is delegated, so pictures added later work with no second call. The modal <dialog> is
// built here and removed on close; the grow is a same-document View Transition, skipped under
// reduced motion and where the API is missing.
import { reducedMotion } from "../hooks/hooks.js";
import { closeDialog, openDialog, wireDialog } from "../dialog/dialog.js";
const GROW_NAME = "cap-lightbox-figure";
// The figure carries no transition type, so a site's page-to-page fade does not restyle it. A
// skipped transition rejects `ready` with an InvalidStateError (tab hidden, or another transition
// started); the change still ran, so only the animation is dropped. Anything else is rethrown.
export function grow(from, to, change) {
    if (!from || !("startViewTransition" in document) || reducedMotion()) {
        change();
        return;
    }
    from.style.viewTransitionName = GROW_NAME;
    const transition = document.startViewTransition(() => {
        from.style.viewTransitionName = "";
        to.style.viewTransitionName = GROW_NAME;
        change();
    });
    void transition.ready.catch((error) => {
        if (error instanceof DOMException && error.name === "InvalidStateError")
            return;
        throw error;
    });
    void transition.finished.finally(() => {
        to.style.viewTransitionName = "";
    });
}
const SVG_NS = "http://www.w3.org/2000/svg";
function closeButton() {
    const close = document.createElement("button");
    close.type = "button";
    close.className = "cap-btn cap-dialog-close";
    close.dataset.variant = "quiet";
    close.dataset.iconOnly = "";
    close.dataset.capPart = "close";
    close.setAttribute("aria-label", "Close");
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M4 4l8 8M12 4l-8 8");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.5");
    path.setAttribute("stroke-linecap", "round");
    svg.append(path);
    close.append(svg);
    return close;
}
// `src` is passed in, not read from `currentSrc` (the srcset rung downloaded): a resized copy would
// be shown as full size. An empty alt means decorative, so the dialog gets a generic name.
export function openViewer(options) {
    const { src, alt, label, source, opener } = options;
    const dialog = document.createElement("dialog");
    dialog.className = "cap-dialog cap-lightbox";
    dialog.dataset.capLightboxView = "";
    dialog.setAttribute("aria-label", label ?? (alt || "Full size image"));
    const full = document.createElement("img");
    full.src = src;
    full.alt = alt;
    dialog.append(full, closeButton());
    document.body.append(dialog);
    wireDialog(dialog, { returnTo: opener ?? null });
    // Close and the backdrop shrink the picture back into the one it came from. This runs before
    // the dialog block's own handler, which would close at once. Esc closes at once (the platform's).
    dialog.addEventListener("click", (e) => {
        const t = e.target;
        const isClose = t instanceof Element && t.closest("[data-cap-part='close']") !== null;
        if (!isClose && t !== dialog)
            return;
        e.stopImmediatePropagation();
        closeViewer(dialog, source);
    }, true);
    dialog.addEventListener("close", () => {
        dialog.remove();
    }, { once: true });
    grow(source, full, () => openDialog(dialog, opener ?? source ?? null));
    return dialog;
}
export function closeViewer(dialog, source) {
    const full = dialog.querySelector("img");
    grow(full ?? undefined, source ?? full ?? dialog, () => closeDialog(dialog));
}
function open(target, root) {
    const link = target.closest("a.image-link");
    if (link && root.contains(link)) {
        const href = link.getAttribute("href");
        const image = link.querySelector("img");
        if (!href)
            return false;
        openViewer({
            src: href,
            alt: image?.alt ?? "",
            source: image ?? undefined,
            opener: link,
        });
        return true;
    }
    const image = target.closest("img.diagram-image");
    if (image && root.contains(image)) {
        // A diagram's alt describes every node: far too long for a name.
        openViewer({
            src: image.src,
            alt: image.alt,
            label: "Diagram, full size",
            source: image,
            opener: image,
        });
        return true;
    }
    return false;
}
export function enhance(root = document) {
    const undo = [];
    for (const el of root.querySelectorAll("[data-cap='lightbox']:not([data-cap-ready])")) {
        el.dataset.capReady = "";
        // A diagram image has no link: make it a button to the keyboard and assistive technology too.
        const diagrams = [...el.querySelectorAll("img.diagram-image")];
        for (const image of diagrams) {
            image.tabIndex = 0;
            image.setAttribute("role", "button");
            image.setAttribute("aria-label", `Enlarge diagram: ${image.alt}`);
        }
        const onClick = (e) => {
            if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0)
                return;
            if (!(e.target instanceof Element))
                return;
            if (open(e.target, el))
                e.preventDefault();
        };
        const onKey = (e) => {
            if (e.key !== "Enter" && e.key !== " ")
                return;
            const t = e.target;
            if (!(t instanceof HTMLImageElement) || !t.matches("img.diagram-image"))
                return;
            e.preventDefault();
            open(t, el);
        };
        el.addEventListener("click", onClick);
        el.addEventListener("keydown", onKey);
        undo.push(() => {
            el.removeEventListener("click", onClick);
            el.removeEventListener("keydown", onKey);
            for (const image of diagrams) {
                image.removeAttribute("tabindex");
                image.removeAttribute("role");
                image.removeAttribute("aria-label");
            }
            delete el.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
