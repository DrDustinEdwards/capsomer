import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// "Insert from library" and the image field built on it. The dialog holds MediaLibrary in picker
// mode over a media endpoint: its links and its search load the next view into the dialog instead
// of leaving the page. The picker's alt step starts from the file's own alt text, and the pick
// carries the file's own caption. ImageField is a page's one chosen image (a share image, a
// feature image): its preview, Choose or Choose another, Remove, and the alt text the host renders
// under it.
import { Component, lazy, Suspense, useEffect, useEffectEvent, useId, useLayoutEffect, useMemo, useRef, useState, } from "react";
import { Button } from "../button/button.react.js";
import { Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "../dialog/dialog.react.js";
import { Empty } from "../empty/empty.react.js";
import { libraryOf, loadMediaView } from "./media-picker.js";
// The library is its own chunk, fetched when the dialog opens, so a page that only draws the button
// (an editor, a settings form) does not carry it.
const MediaLibrary = lazy(() => import("./media-library.react.js").then((m) => ({ default: m.MediaLibrary })));
// A chunk that fails to load (offline, a deploy that replaced it) throws when the library renders;
// the dialog says so instead of breaking.
class LibraryBoundary extends Component {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    render() {
        return this.state.failed ? (_jsx(Empty, { kind: "failed", flush: true, title: "The library did not load", children: "Check your connection and open the picker again." })) : (this.props.children);
    }
}
const LOADING = (_jsx("p", { className: "cap-muted", role: "status", children: "Loading media..." }));
export const INSERT_WORDS = {
    label: "Insert from library",
    title: "Insert an image from the library",
    lead: "Pick an image already on the site, then describe it. It is not in the page until it has alt text.",
};
export function MediaPicker({ endpoint, library = libraryOf(endpoint), onPick, words = INSERT_WORDS, variant = "quiet", }) {
    const titleId = useId();
    const [open, setOpen] = useState(false);
    const [opener, setOpener] = useState(null);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const load = async (query) => {
        setError("");
        try {
            setData(await loadMediaView(endpoint, query));
        }
        catch (thrown) {
            setError(thrown.message);
        }
    };
    // The memoized form calls the latest load; the ref is set after each render, not during it.
    const loadRef = useRef(load);
    useLayoutEffect(() => {
        loadRef.current = load;
    });
    const loadFirst = useEffectEvent(() => void loadRef.current(""));
    useEffect(() => {
        if (open && !data && !error)
            loadFirst();
    }, [open, data, error]);
    // A link to another view of the library (a tag, a page, a file to choose) loads it here.
    const follow = (event) => {
        const link = event.target.closest("a[href]");
        if (!(link instanceof HTMLAnchorElement))
            return;
        const url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin || url.pathname !== library)
            return;
        event.preventDefault();
        void load(url.search);
    };
    // The search form is a GET of the library's own address: run it here too. One component for the
    // dialog's life, so a render never remounts the form being typed in.
    const PickerForm = useMemo(() => function PickerForm({ onSubmit, ...props }) {
        return (_jsx("form", { ...props, onSubmit: (event) => {
                onSubmit?.(event);
                if (event.defaultPrevented || (props.method ?? "get").toLowerCase() !== "get")
                    return;
                event.preventDefault();
                const query = new URLSearchParams();
                for (const [k, v] of new FormData(event.currentTarget))
                    if (typeof v === "string" && v)
                        query.append(k, v);
                void loadRef.current(`?${query}`);
            } }));
    }, []);
    const close = () => {
        setOpen(false);
        setData(null);
        setError("");
    };
    return (_jsxs(_Fragment, { children: [_jsx(Button, { variant: variant, size: "sm", onClick: (event) => {
                    setOpener(event.currentTarget);
                    setOpen(true);
                }, children: words.label }), _jsxs(Dialog, { open: open, onOpenChange: (o) => !o && close(), placement: "center", size: "lg", returnTo: opener, "aria-labelledby": titleId, children: [_jsxs(DialogHeader, { divider: true, children: [_jsx(DialogTitle, { id: titleId, children: words.title }), _jsx(DialogDescription, { children: words.lead })] }), _jsx(DialogBody, { children: _jsx("div", { onClickCapture: follow, children: error ? (_jsx(Empty, { kind: "failed", flush: true, title: "The library did not answer", children: error })) : data ? (_jsx(LibraryBoundary, { children: _jsx(Suspense, { fallback: LOADING, children: _jsx(MediaLibrary, { data: data, action: library, Form: PickerForm, mode: "picker", onPick: ({ id, url, alt }) => {
                                            const caption = data.rows.find((r) => r.key === id)?.caption ?? "";
                                            onPick({ url, alt, caption });
                                            close();
                                        } }) }) })) : (LOADING) }) }), _jsx(DialogFooter, { align: "between", children: _jsx(DialogClose, { part: "cancel", children: "Cancel" }) })] })] }));
}
export function ImageField({ label, value, src = value, alt = "", none = "No image", picker, onPick, onRemove, locked = false, ratio, children, }) {
    const labelId = useId();
    const words = picker?.words ?? { ...INSERT_WORDS, label: "Choose from library" };
    // The shape through the CSSOM, not a style attribute (style-src 'self').
    const thumb = useRef(null);
    useLayoutEffect(() => {
        if (ratio)
            thumb.current?.style.setProperty("aspect-ratio", ratio);
        else
            thumb.current?.style.removeProperty("aspect-ratio");
    }, [ratio]);
    return (_jsxs("div", { className: "cap-image-field", role: "group", "aria-labelledby": labelId, children: [_jsx("span", { className: "cap-field-label", id: labelId, children: label }), _jsxs("div", { className: "cap-image-field-row", children: [_jsx("div", { className: "cap-image-field-thumb", ref: thumb, children: value ? _jsx("img", { src: src, alt: alt }) : _jsx("span", { className: "cap-muted", children: none }) }), _jsxs("div", { className: "cap-image-field-controls", children: [value && picker ? _jsx("p", { className: "cap-image-field-url cap-mono", children: value }) : null, !locked && (picker || (value && onRemove)) ? (_jsxs("div", { className: "cap-image-field-actions", children: [picker && onPick ? (_jsx(MediaPicker, { ...picker, words: { ...words, label: value ? "Choose another" : words.label }, variant: "default", onPick: onPick })) : null, value && onRemove ? (_jsx(Button, { variant: "quiet", size: "sm", onClick: onRemove, children: "Remove" })) : null] })) : null, children] })] })] }));
}
