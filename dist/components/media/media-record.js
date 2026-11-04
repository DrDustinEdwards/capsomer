// The media library's records: the facts of one file and the plain functions that read them.
// Decimal unit names, binary division: the site's own rule, so a size reads the same on both.
export function byteSize(size) {
    if (size < 1024)
        return `${size} B`;
    if (size < 1024 * 1024)
        return `${Math.round(size / 1024)} kB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
export const LARGE_BYTES = 1024 * 1024;
// The state of a file's alt text. Missing and decorative are different: missing is a to-do,
// decorative is a decision the author made.
export function altStateOf(alt, decorative) {
    if (decorative)
        return "decorative";
    return alt.trim() ? "set" : "missing";
}
export function parseTags(text) {
    const out = [];
    for (const raw of text.split(",")) {
        const t = raw.trim().toLowerCase();
        if (t && !out.includes(t))
            out.push(t);
    }
    return out;
}
export function flagsFor(r) {
    const out = [];
    if (r.state === "binned")
        out.push({ tone: "nodata", word: "In Trash" });
    if (r.state === "uploading" || r.state === "failed")
        return out;
    if (r.kind === "image" && r.altState === "missing")
        out.push({ tone: "warn", word: "No alt text" });
    if (r.kind === "image" && r.altState === "decorative")
        out.push({ tone: "info", word: "Decorative" });
    if (r.state !== "binned" && (r.usedUnknown ? r.usedCount === 0 : r.used.length === 0))
        out.push({ tone: "nodata", word: "Unattached" });
    return out;
}
// What a tile's controls are called, in one line a screen reader reads after the file's name.
export function describeRecord(r) {
    const kind = r.type.split("/").pop()?.toUpperCase() || (r.kind === "image" ? "Image" : "File");
    if (r.state === "uploading")
        return `${kind}, uploading${r.progress != null ? ` ${Math.round(r.progress)} percent` : ""}`;
    if (r.state === "failed")
        return `${kind}, upload failed${r.error ? `: ${r.error}` : ""}`;
    return `${kind}, ${byteSize(r.bytes)}`;
}
// The three things a person copies: the address, the Markdown, the HTML. An image goes in as an
// image and a document as a link: an <img> for a PDF breaks the page.
export function copySnippets(r) {
    const alt = r.alt.trim();
    // Prelum refuses ![](x) as missing alt text; ![""](x) is how Markdown says decorative.
    const mdAlt = !alt && r.decorative ? '""' : alt;
    // A document's link text: "uptime-report.pdf" gives "uptime report". Never an image's alt text: a
    // file's name says nothing of what the picture shows (the checklist's B2).
    const title = r.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();
    if (r.kind === "image") {
        return [
            { id: "address", label: "Copy address", name: "Copy address", value: r.url },
            { id: "markdown", label: "Markdown", name: "Copy the Markdown image", value: `![${mdAlt}](${r.url})` },
            { id: "html", label: "HTML tag", name: "Copy the HTML tag", value: `<img src="${r.url}" alt="${alt}">` },
        ];
    }
    return [
        { id: "address", label: "Copy address", name: "Copy address", value: r.url },
        { id: "markdown", label: "Markdown", name: "Copy the Markdown link", value: `[${title}](${r.url})` },
        { id: "html", label: "HTML link", name: "Copy the HTML link", value: `<a href="${r.url}">${title}</a>` },
    ];
}
