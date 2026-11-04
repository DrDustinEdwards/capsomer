import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef } from "react";
// Renders the HTML contract in markdown-editor.md: a label and a real textarea holding the
// markdown, which is all a server render (and a reader without script) gets. After mount it
// loads the behavior module and CodeMirror with import(), so they are their own chunks and
// never reach a bundle that renders no editor, and upgrades the textarea in place.
export function MarkdownEditor(props) {
    const { label, ariaLabel, name, value, defaultValue, placeholder, readOnly, disabled, required, maxLength, help, error } = props;
    const base = useId();
    const id = props.id ?? `${base}-md`;
    const helpId = `${base}-help`;
    const errorId = `${base}-error`;
    const hasError = error != null && error !== false && error !== "";
    const describedBy = [hasError ? errorId : null, help ? helpId : null].filter(Boolean).join(" ") || undefined;
    const rootRef = useRef(null);
    const handleRef = useRef(null);
    // What the latest render said, read by the callbacks the editor was mounted with.
    const latest = useRef(props);
    latest.current = props;
    const hasUpload = !!props.onUpload;
    const scaffoldsKey = JSON.stringify(props.scaffolds ?? null);
    const options = () => ({
        label: latest.current.ariaLabel,
        lineNumbers: latest.current.lineNumbers,
        accept: latest.current.accept,
        nonce: latest.current.nonce,
        wordsPerMinute: latest.current.wordsPerMinute,
        scaffolds: latest.current.scaffolds,
        // Always a function, so a later render's targets are used without rebuilding the editor.
        linkTargets: async (query) => {
            const t = latest.current.linkTargets;
            if (typeof t === "function")
                return t(query);
            const { filterLinkTargets } = await import("./markdown-editor.js");
            return filterLinkTargets((t ?? []), query);
        },
        onUpload: latest.current.onUpload ? (f, image, signal) => latest.current.onUpload(f, image, signal) : undefined,
        imageMarkdown: latest.current.imageMarkdown ? (i) => latest.current.imageMarkdown(i) : undefined,
        onChange: (v) => latest.current.onChange?.(v),
        onSave: (v) => latest.current.onSave?.(v),
    });
    useEffect(() => {
        const host = rootRef.current;
        if (!host)
            return;
        let canceled = false;
        let mounted = null;
        import("./markdown-editor.js")
            .then((m) => (canceled ? null : m.mountMarkdownEditor(host, options())))
            .then((h) => {
            if (!h)
                return;
            if (canceled)
                return h.destroy();
            mounted = h;
            handleRef.current = h;
            const v = latest.current.value;
            if (v !== undefined && v !== h.getValue())
                h.setValue(v);
            latest.current.onReady?.(h);
        })
            .catch(() => {
            // CodeMirror did not load: the textarea stays as the editor.
        });
        return () => {
            canceled = true;
            mounted?.destroy();
            handleRef.current = null;
        };
        // Mounted once; later renders reach the editor through `latest` and the effects below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // A controlled value: set only when it differs, or each keystroke would round-trip and reset the cursor.
    useEffect(() => {
        if (value === undefined)
            return;
        const h = handleRef.current;
        if (h) {
            if (h.getValue() !== value)
                h.setValue(value);
        }
        else {
            const ta = rootRef.current?.querySelector("textarea");
            if (ta && ta.value !== value)
                ta.value = value;
        }
    }, [value]);
    // The toolbar and the slash menu are rebuilt only when what they list changes, not each render.
    useEffect(() => {
        const o = options();
        handleRef.current?.update({ scaffolds: o.scaffolds, onUpload: o.onUpload, imageMarkdown: o.imageMarkdown, label: ariaLabel });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scaffoldsKey, hasUpload, ariaLabel]);
    return (_jsxs("div", { className: "cap-md cap-field", "data-cap": "markdown-editor", ref: rootRef, children: [_jsxs("label", { className: "cap-field-label", htmlFor: id, children: [label, required ? (_jsx("span", { className: "cap-field-required", "aria-hidden": "true", children: "Required" })) : null] }), help ? (_jsx("p", { className: "cap-field-help", id: helpId, children: help })) : null, _jsx("textarea", { className: "cap-input cap-md-source", id: id, name: name, defaultValue: value ?? defaultValue ?? "", placeholder: placeholder, readOnly: readOnly, disabled: disabled, required: required, maxLength: maxLength, spellCheck: true, "aria-invalid": hasError ? true : undefined, "aria-describedby": describedBy }), hasError ? (_jsx("p", { className: "cap-field-error", id: errorId, children: error })) : null] }));
}
