import { useRef, useState } from "react";
import { defaultImageMarkdown } from "../markdown-editor/markdown-editor.js";
export function useImageStep(c) {
    const { say } = c;
    const [upload, setUploadState] = useState(null);
    const uploadRef = useRef(null);
    const setUpload = (next) => {
        uploadRef.current?.sending?.abort();
        uploadRef.current = next;
        setUploadState(next);
    };
    const [error, setError] = useState(null);
    const [alt, setAlt] = useState("");
    const altRef = useRef(null);
    function start(file) {
        if (!c.props.current.onUpload)
            return;
        setError(null);
        setAlt("");
        // A data: URL, not blob:, so the preview needs nothing a site's img-src does not already allow.
        const next = { file, preview: "", sending: null };
        setUpload(next);
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            if (uploadRef.current === next && typeof reader.result === "string") {
                const shown = { ...next, preview: reader.result };
                uploadRef.current = shown;
                setUploadState(shown);
            }
        });
        reader.readAsDataURL(file);
        say(`Describe ${file.name} to insert it.`);
        requestAnimationFrame(() => altRef.current?.focus());
    }
    function cancel() {
        setUpload(null);
        setError(null);
        c.editor.current?.commands.focus();
    }
    async function insert(decorative) {
        const current = uploadRef.current;
        const send = c.props.current.onUpload;
        const text = decorative ? "" : alt.trim();
        if (!current || current.sending || !send || (!decorative && !text))
            return;
        const sending = new AbortController();
        const busy = { ...current, sending };
        uploadRef.current = busy;
        setUploadState(busy);
        setError(null);
        say(`Uploading ${current.file.name}`);
        try {
            const { url } = await send(current.file, { alt: text, decorative }, sending.signal);
            if (uploadRef.current !== busy)
                return;
            const md = (c.props.current.imageMarkdown ?? defaultImageMarkdown)({
                url,
                alt: text,
                decorative,
                name: current.file.name,
            });
            uploadRef.current = null;
            setUploadState(null);
            c.insertMarkdown(md);
            say("Image inserted.");
        }
        catch (e) {
            if (uploadRef.current !== busy)
                return;
            // The step stays, with what was typed, so a retry is one press.
            const kept = { ...current, sending: null };
            uploadRef.current = kept;
            setUploadState(kept);
            setError(e instanceof Error ? e.message : "The upload failed.");
            say("");
        }
    }
    return { upload, error, alt, setAlt, altRef, start, cancel, insert };
}
