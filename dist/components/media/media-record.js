// The media library's records: the facts of one file and the plain functions that read them.
import { escapeHtml } from "@dustinedwards/site-runtime/html";
import { formatBytes } from "../format/format.js";
// A tile's id from its file's key; the markup a server draws and the one a page builds must agree.
export const tileId = (key) => `tile-${key.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
export const LARGE_BYTES = 1024 * 1024;
// Alt text state: missing is a to-do, decorative is a decision the author made.
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
export const unattached = (r) => r.usedUnknown ? r.usedCount === 0 : r.used.length === 0;
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
    if (r.state !== "binned" && unattached(r))
        out.push({ tone: "nodata", word: "Unattached" });
    return out;
}
export function describeRecord(r) {
    const kind = r.type.split("/").pop()?.toUpperCase() || (r.kind === "image" ? "Image" : "File");
    if (r.state === "uploading")
        return `${kind}, uploading${r.progress != null ? ` ${Math.round(r.progress)} percent` : ""}`;
    if (r.state === "failed")
        return `${kind}, upload failed${r.error ? `: ${r.error}` : ""}`;
    return `${kind}, ${formatBytes(r.bytes)}`;
}
// Markdown link or alt text: the brackets and backslash that would end it early.
const mdText = (text) => text.replace(/[\\[\]]/g, "\\$&");
// The three things a person copies. An image goes in as an image and a document as a link: an <img> for a PDF breaks the page.
export function copySnippets(r) {
    const alt = r.alt.trim();
    // Prelum refuses ![](x) as missing alt text; ![""](x) is how Markdown says decorative.
    const mdAlt = !alt && r.decorative ? '""' : mdText(alt);
    // A document's link text ("uptime-report.pdf" gives "uptime report"). Never an image's alt text: a file's name says nothing of the picture.
    const title = r.name
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[-_]+/g, " ")
        .trim();
    const url = escapeHtml(r.url);
    if (r.kind === "image") {
        return [
            { id: "address", label: "Copy address", name: "Copy address", value: r.url },
            {
                id: "markdown",
                label: "Markdown",
                name: "Copy the Markdown image",
                value: `![${mdAlt}](${r.url})`,
            },
            {
                id: "html",
                label: "HTML tag",
                name: "Copy the HTML tag",
                value: `<img src="${url}" alt="${escapeHtml(alt)}">`,
            },
        ];
    }
    return [
        { id: "address", label: "Copy address", name: "Copy address", value: r.url },
        {
            id: "markdown",
            label: "Markdown",
            name: "Copy the Markdown link",
            value: `[${mdText(title)}](${r.url})`,
        },
        {
            id: "html",
            label: "HTML link",
            name: "Copy the HTML link",
            value: `<a href="${url}">${escapeHtml(title)}</a>`,
        },
    ];
}
