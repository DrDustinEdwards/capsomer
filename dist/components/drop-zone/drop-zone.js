// The drop zone: choose files by browsing or by dropping them, check them against the rules
// (type, size, count) and say, in words, which were taken and which were not and why. The
// real <input type="file"> is the control, so click, Enter and Space open the picker with no
// script; this module adds drop (on the zone, or anywhere on the page), paste, and the checks.
// A dragenter depth counter keeps the page-wide target steady, and a drop off the zone never
// navigates away. Every file is checked and each refusal named. No framework; the React wrapper uses the same pure functions.
const READY = "data-cap-ready";
// "image/*, .pdf" gives ["image/*", ".pdf"], lower-cased.
export function parseAccept(accept) {
    return (accept ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
}
// The platform's rule for accept: an extension, a type with a wildcard, or an exact type.
export function matchesAccept(file, accept) {
    const list = parseAccept(accept);
    if (list.length === 0)
        return true;
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return list.some((rule) => {
        if (rule.startsWith("."))
            return name.endsWith(rule);
        if (rule.endsWith("/*"))
            return type.startsWith(rule.slice(0, -1));
        return type === rule;
    });
}
const KIND_NAMES = {
    "image/*": "images",
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WebP",
    "image/gif": "GIF",
    "image/avif": "AVIF",
    "image/svg+xml": "SVG",
    "application/pdf": "PDF",
    "video/*": "video",
    "audio/*": "audio",
    "text/plain": "text",
    "text/markdown": "Markdown",
};
// The accept list as a person would say it: "images and PDF", "JPEG, PNG and WebP".
export function acceptLabel(accept) {
    const names = [];
    for (const rule of parseAccept(accept)) {
        const name = KIND_NAMES[rule] ?? (rule.startsWith(".") ? rule.slice(1).toUpperCase() : rule);
        if (!names.includes(name))
            names.push(name);
    }
    if (names.length === 0)
        return "any file";
    if (names.length === 1)
        return names[0] ?? "";
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
// A size as a person reads it. Binary division, as the site's media page states sizes.
export function formatBytes(size) {
    if (size < 1024)
        return `${size} B`;
    if (size < 1024 * 1024)
        return `${Math.round(size / 1024)} kB`;
    const mb = size / (1024 * 1024);
    return `${mb >= 100 ? Math.round(mb) : mb.toFixed(1).replace(/\.0$/, "")} MB`;
}
export function rejectionMessage(file, reason, rules) {
    if (reason === "type")
        return `${file.name}: type not allowed. This takes ${acceptLabel(rules.accept)}.`;
    if (reason === "size")
        return `${file.name}: too big at ${formatBytes(file.size)}. The limit is ${formatBytes(rules.maxBytes ?? 0)}.`;
    const n = rules.maxFiles ?? 0;
    return `${file.name}: too many files. The limit is ${n} ${n === 1 ? "file" : "files"} at a time, so this one was left out.`;
}
// Checks every file, in order. A file is refused for its type first, then its size; the files
// that pass are counted, and any beyond maxFiles are refused as too many. Nothing is dropped
// silently: every refusal comes back with a sentence that names the file.
export function validateFiles(files, rules = {}) {
    const accepted = [];
    const rejected = [];
    const refuse = (file, reason) => rejected.push({ file, reason, message: rejectionMessage(file, reason, rules) });
    for (const file of Array.from(files)) {
        if (!matchesAccept(file, rules.accept))
            refuse(file, "type");
        else if (rules.maxBytes && file.size > rules.maxBytes)
            refuse(file, "size");
        else if (rules.maxFiles != null && rules.maxFiles > 0 && accepted.length >= rules.maxFiles)
            refuse(file, "count");
        else
            accepted.push(file);
    }
    return { accepted, rejected };
}
// The words for what was taken: "photo.jpg is ready to upload", "3 files are ready to upload".
export function acceptedText(files) {
    if (files.length === 0)
        return "";
    if (files.length === 1)
        return `${files[0]?.name ?? "The file"} is ready to upload.`;
    return `${files.length} files are ready to upload.`;
}
// "1 file was not added", "3 files were not added".
export function rejectedLead(count) {
    return count === 1 ? "1 file was not added" : `${count} files were not added`;
}
// True while the pointer carries files (and not a dragged link or a selection of text).
export function dragHasFiles(e) {
    const types = e.dataTransfer?.types;
    return !!types && Array.from(types).includes("Files");
}
// Puts files into the input, so a form posts them. Returns false where the browser cannot.
export function setInputFiles(input, files) {
    try {
        const transfer = new DataTransfer();
        for (const f of files)
            transfer.items.add(f);
        input.files = transfer.files;
        return true;
    }
    catch {
        return false;
    }
}
const CRIT_GLYPH = "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z";
function glyph() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "cap-status-glyph");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const p = document.createElementNS(ns, "path");
    p.setAttribute("fill", "currentColor");
    p.setAttribute("fill-rule", "evenodd");
    p.setAttribute("d", CRIT_GLYPH);
    svg.append(p);
    return svg;
}
const part = (zone, name) => zone.querySelector(`[data-cap-part='${name}']`);
// The rules a zone states: accept from its input, limits from its data attributes. A zone
// that takes one file (no multiple attribute) takes at most one.
export function rulesOf(zone) {
    const input = part(zone, "input");
    const maxBytes = Number(zone.dataset.maxBytes);
    const maxFiles = Number(zone.dataset.maxFiles);
    const rules = { accept: input?.getAttribute("accept") ?? zone.dataset.accept ?? "" };
    if (Number.isFinite(maxBytes) && maxBytes > 0)
        rules.maxBytes = maxBytes;
    if (Number.isFinite(maxFiles) && maxFiles > 0)
        rules.maxFiles = maxFiles;
    else if (input && !input.multiple)
        rules.maxFiles = 1;
    return rules;
}
function render(zone, result) {
    const status = part(zone, "status");
    const alert = part(zone, "rejections");
    if (status) {
        if (result.accepted.length === 0)
            status.replaceChildren();
        else {
            const lead = document.createElement("p");
            lead.className = "cap-drop-lead";
            lead.textContent = acceptedText(result.accepted);
            const list = document.createElement("ul");
            list.className = "cap-drop-files";
            for (const f of result.accepted) {
                const li = document.createElement("li");
                const name = document.createElement("span");
                name.className = "cap-drop-file-name";
                name.textContent = f.name;
                const size = document.createElement("span");
                size.className = "cap-drop-file-size";
                size.textContent = formatBytes(f.size);
                li.append(name, size);
                list.append(li);
            }
            status.replaceChildren(lead, list);
        }
    }
    if (alert) {
        if (result.rejected.length === 0)
            alert.replaceChildren();
        else {
            const lead = document.createElement("p");
            lead.className = "cap-drop-lead";
            lead.dataset.tone = "crit";
            lead.append(glyph(), document.createTextNode(rejectedLead(result.rejected.length)));
            const list = document.createElement("ul");
            list.className = "cap-drop-files";
            for (const r of result.rejected) {
                const li = document.createElement("li");
                li.textContent = r.message;
                list.append(li);
            }
            alert.replaceChildren(lead, list);
        }
    }
    setState(zone, result.rejected.length > 0 ? "rejected" : "idle");
}
const resting = new WeakMap();
function setState(zone, state) {
    if (state !== "over")
        resting.set(zone, state);
    zone.dataset.state = state;
}
// Checks files against the zone's rules, shows the result, puts the accepted files in the
// input, and tells the page with cap-drop-accepted and cap-drop-rejected. Returns the result.
export function acceptFiles(zone, files, opts = {}) {
    const result = validateFiles(files, rulesOf(zone));
    const input = part(zone, "input");
    if (input && (!opts.fromInput || result.rejected.length > 0))
        setInputFiles(input, result.accepted);
    render(zone, result);
    const detail = { accepted: result.accepted, rejected: result.rejected };
    if (result.accepted.length > 0)
        zone.dispatchEvent(new CustomEvent("cap-drop-accepted", { bubbles: true, detail }));
    if (result.rejected.length > 0)
        zone.dispatchEvent(new CustomEvent("cap-drop-rejected", { bubbles: true, detail }));
    return result;
}
function isEditable(target) {
    return target instanceof Element && target.closest("input, textarea, [contenteditable='true']") !== null;
}
// Attaches one zone. Returns a function that detaches it.
export function attachDropZone(zone) {
    if (zone.hasAttribute(READY))
        return () => { };
    zone.setAttribute(READY, "");
    const input = part(zone, "input");
    const page = zone.dataset.scope === "page";
    // The listeners go on the window for "drop anywhere", on the zone otherwise.
    const target = page ? window : zone;
    // A counter, not a boolean: dragenter and dragleave fire for every nested element crossed.
    let depth = 0;
    const disabled = () => !!input?.disabled;
    const rest = () => resting.get(zone) ?? "idle";
    const onEnter = (e) => {
        if (!dragHasFiles(e) || disabled())
            return;
        depth += 1;
        setState(zone, "over");
    };
    const onOver = (e) => {
        const ev = e;
        if (!dragHasFiles(ev) || disabled())
            return;
        ev.preventDefault();
        if (ev.dataTransfer)
            ev.dataTransfer.dropEffect = "copy";
    };
    const onLeave = (e) => {
        if (depth === 0 || !dragHasFiles(e))
            return;
        depth = Math.max(0, depth - 1);
        if (depth === 0)
            setState(zone, rest());
    };
    const onDrop = (e) => {
        const ev = e;
        depth = 0;
        if (zone.dataset.state === "over")
            setState(zone, rest());
        // A zone on the page has already taken this drop.
        if (ev.defaultPrevented)
            return;
        const files = ev.dataTransfer?.files;
        if (!files || files.length === 0) {
            // A dropped link or text would navigate away from the page; a field still takes its text.
            if (page && !isEditable(ev.target))
                ev.preventDefault();
            return;
        }
        if (disabled())
            return;
        ev.preventDefault();
        acceptFiles(zone, files);
        input?.focus({ preventScroll: true });
    };
    const onChange = () => {
        if (input?.files)
            acceptFiles(zone, Array.from(input.files), { fromInput: true });
    };
    const onPaste = (e) => {
        const files = e.clipboardData?.files;
        if (!files || files.length === 0 || disabled())
            return;
        e.preventDefault();
        acceptFiles(zone, files);
    };
    target.addEventListener("dragenter", onEnter);
    target.addEventListener("dragover", onOver);
    target.addEventListener("dragleave", onLeave);
    target.addEventListener("drop", onDrop);
    input?.addEventListener("change", onChange);
    const pasteTarget = zone.hasAttribute("data-paste") ? (page ? document : zone) : null;
    pasteTarget?.addEventListener("paste", onPaste);
    return () => {
        target.removeEventListener("dragenter", onEnter);
        target.removeEventListener("dragover", onOver);
        target.removeEventListener("dragleave", onLeave);
        target.removeEventListener("drop", onDrop);
        input?.removeEventListener("change", onChange);
        pasteTarget?.removeEventListener("paste", onPaste);
        zone.removeAttribute(READY);
    };
}
// Attaches to every [data-cap="drop-zone"] under root not yet attached. Returns a function
// that detaches them all.
export function enhance(root = document) {
    const undo = Array.from(root.querySelectorAll("[data-cap='drop-zone']:not([data-cap-ready])")).map(attachDropZone);
    return () => undo.forEach((f) => f());
}
