// @ts-check
// Markdown out of the formatted editor, and the entry the rest of the package imports the round trip
// from. The source stays the truth: a block the editor did not change is written as the bytes it was
// read from, and only a changed or new block is spelled again, by the writer below, which is checked
// by parsing what it wrote (rich-editor-markdown-read.mjs holds the parse, the types and the checks).
// It touches no DOM.
import { MARK_ORDER, canon, print, toDoc } from "./rich-editor-markdown-read.mjs";
/**
 * @typedef {import("./rich-editor-markdown-read.mjs").Dialect} Dialect
 * @typedef {import("./rich-editor-markdown-read.mjs").MdOrigin} MdOrigin
 * @typedef {import("./rich-editor-markdown-read.mjs").JsonNode} JsonNode
 * @typedef {import("./rich-editor-markdown-read.mjs").JsonMark} JsonMark
 */
export * from "./rich-editor-markdown-read.mjs";
/**
 * @param {string} text
 * @param {{ all: boolean, dialect: Dialect, lineStart: boolean, afterAtom: boolean }} o
 * @returns {string}
 */
function escapeText(text, o) {
    // Right after a bare URL, a backslash would become part of the URL, so its first mark stays as is.
    const keep = o.afterAtom && /^[_*~]/.test(text) ? text[0] : "";
    if (keep)
        return keep + escapeText(text.slice(1), { ...o, afterAtom: false });
    if (o.all)
        return text.replace(/[!-/:-@[-`{-~]/g, (c) => `\\${c}`);
    let out = "";
    for (let i = 0; i < text.length; i++) {
        const c = text[i] ?? "";
        const prev = i === 0 ? "" : (text[i - 1] ?? "");
        const next = text[i + 1] ?? "";
        const word = (/** @type {string} */ ch) => /[\p{L}\p{N}]/u.test(ch);
        if (c === "\\" || c === "*" || c === "`")
            out += `\\${c}`;
        else if (c === "_" && !(word(prev) && word(next)))
            out += "\\_";
        else if (c === "~" && (next === "~" || prev === "~"))
            out += "\\~";
        else if (c === "<" && /[A-Za-z/!?]/.test(next))
            out += "\\<";
        else if (c === "&" && /^&(#?[A-Za-z0-9]+);/.test(text.slice(i)))
            out += "\\&";
        else if (c === "[" && /\]\s*[([:]/.test(text.slice(i)))
            out += "\\[";
        else if (o.dialect === "site" && c === ":" && /[A-Za-z]/.test(next) && prev !== ":")
            out += "\\:";
        else if (o.dialect === "site" && c === "$")
            out += "\\$";
        else
            out += c;
    }
    // What would start another block at the start of a line.
    return out.replace(/(^|\n)([ \t]*)(#{1,6}(?=[ \t]|$)|>|[-+](?=[ \t])|\d{1,9}(?=[.)][ \t]|[.)]$)|=+[ \t]*$|-+[ \t]*$)/g, (m, nl, ws, mark) => {
        if (!o.lineStart && nl === "")
            return m;
        return /^\d/.test(mark) ? `${nl}${ws}${mark}\\` : `${nl}${ws}\\${mark}`;
    });
}
/** @param {string} code */
function codeSpan(code) {
    const longest = Math.max(0, ...(code.match(/`+/g) ?? []).map((r) => r.length));
    const fence = "`".repeat(longest + 1);
    const pad = /^`|`$|^ .* $/.test(code) || code.startsWith("`") || code.endsWith("`") ? " " : "";
    return `${fence}${pad}${code}${pad}${fence}`;
}
/** @param {string} href @param {string | null} title */
function linkTail(href, title) {
    const url = /[\s()<>]/.test(href)
        ? `<${href.replace(/[<>]/g, (c) => encodeURIComponent(c))}>`
        : href;
    return `](${url}${title ? ` "${title.replace(/["\\]/g, (c) => `\\${c}`)}"` : ""})`;
}
/**
 * @param {JsonNode[]} nodes
 * @param {{ all: boolean, dialect: Dialect, emphasis: string }} o
 */
function writeInlines(nodes, o) {
    /** @type {JsonMark[]} */
    let open = [];
    let out = "";
    /** @param {JsonMark} m @param {boolean} opening */
    const delim = (m, opening) => {
        if (m.type === "bold")
            return "**";
        if (m.type === "italic")
            return o.emphasis;
        if (m.type === "strike")
            return "~~";
        if (m.type === "link")
            return opening ? "[" : linkTail(m.attrs?.href ?? "", m.attrs?.title ?? null);
        return "";
    };
    const sorted = (/** @type {JsonNode} */ n) => [...(n.marks ?? [])]
        .filter((m) => m.type !== "code")
        .sort((a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type));
    const same = (/** @type {JsonMark} */ a, /** @type {JsonMark} */ b) => a.type === b.type && JSON.stringify(a.attrs ?? {}) === JSON.stringify(b.attrs ?? {});
    /** @param {JsonMark[]} wanted @param {string} lead */
    const moveTo = (wanted, lead = "") => {
        let keep = 0;
        while (keep < open.length &&
            keep < wanted.length &&
            same(/** @type {JsonMark} */ (open[keep]), /** @type {JsonMark} */ (wanted[keep])))
            keep++;
        for (let i = open.length - 1; i >= keep; i--)
            out += delim(/** @type {JsonMark} */ (open[i]), false);
        out += lead;
        for (let i = keep; i < wanted.length; i++)
            out += delim(/** @type {JsonMark} */ (wanted[i]), true);
        open = wanted;
    };
    nodes.forEach((node, i) => {
        const marks = sorted(node);
        if (node.type === "text") {
            const code = (node.marks ?? []).some((m) => m.type === "code");
            let text = node.text ?? "";
            // Delimiters cannot sit against a space: whitespace at the edges of a marked run goes outside.
            const prefix = (/** @type {JsonMark[]} */ a, /** @type {JsonMark[]} */ b) => {
                let k = 0;
                while (k < a.length &&
                    k < b.length &&
                    same(/** @type {JsonMark} */ (a[k]), /** @type {JsonMark} */ (b[k])))
                    k++;
                return k;
            };
            // A mark opens or closes wherever the stack changes below it, not only where it starts or ends.
            const opens = prefix(open, marks) < marks.length;
            const lead = opens && !code ? (/^\s+/.exec(text)?.[0] ?? "") : "";
            text = text.slice(lead.length);
            const after = sorted(nodes[i + 1] ?? { type: "end" });
            const closes = prefix(marks, after) < marks.length;
            const trail = closes && !code ? (/\s+$/.exec(text)?.[0] ?? "") : "";
            text = text.slice(0, text.length - trail.length);
            moveTo(marks, lead);
            const lineStart = out === "" || out.endsWith("\n");
            out += code
                ? codeSpan(text)
                : escapeText(text, {
                    all: o.all,
                    dialect: o.dialect,
                    lineStart,
                    afterAtom: !lead && nodes[i - 1]?.type === "sourceInline",
                });
            if (trail) {
                moveTo(marks.slice(0, prefix(marks, after)));
                out += trail;
            }
        }
        else if (node.type === "hardBreak") {
            moveTo(marks);
            out += "\\\n";
        }
        else if (node.type === "sourceInline") {
            moveTo(marks);
            out += node.attrs?.text ?? "";
        }
    });
    moveTo([]);
    return out;
}
/** @param {string} text @param {string} first @param {string} rest */
const indent = (text, first, rest) => text
    .split("\n")
    .map((line, i) => (i === 0 ? first : line === "" ? "" : rest) + line)
    .join("\n");
/**
 * One block, spelled in the house style.
 * @param {JsonNode} node
 * @param {{ all: boolean, dialect: Dialect, emphasis: string }} o
 * @returns {string}
 */
function writeBlock(node, o) {
    switch (node.type) {
        case "paragraph":
            return writeInlines(node.content ?? [], o);
        case "heading":
            return `${"#".repeat(node.attrs?.level ?? 1)}${node.content?.length ? ` ${writeInlines(node.content, o)}` : ""}`;
        case "horizontalRule":
            return "***";
        case "sourceBlock":
            return node.attrs?.text ?? "";
        case "blockquote":
            return (node.content ?? [])
                .map((c) => writeBlock(c, o))
                .join("\n\n")
                .split("\n")
                .map((line) => (line === "" ? ">" : `> ${line}`))
                .join("\n");
        case "bulletList":
        case "orderedList": {
            const start = node.attrs?.start ?? 1;
            const items = node.content ?? [];
            const loose = items.some((item) => (item.content ?? []).filter((c) => c.type !== "bulletList" && c.type !== "orderedList")
                .length > 1);
            return items
                .map((item, i) => {
                const marker = node.type === "bulletList" ? "- " : `${start + i}. `;
                const body = (item.content ?? [])
                    .map((c) => writeBlock(c, o))
                    .join(loose ? "\n\n" : "\n");
                return indent(body, marker, " ".repeat(marker.length));
            })
                .join(loose ? "\n\n" : "\n");
        }
        default:
            return "";
    }
}
/** The emphasis delimiter a block already uses, so an edit keeps its spelling. */
/** @param {JsonNode} block */
function emphasisOf(block) {
    const source = /** @type {MdOrigin | null | undefined} */ (block.attrs?.md)?.source ?? "";
    return /(^|[^\p{L}\p{N}_])_[^_\s]/u.test(source) && !/(^|[^*\\])\*[^*\s]/.test(source)
        ? "_"
        : "*";
}
/**
 * A changed block, spelled and then checked: what was written must parse back to the same block.
 * When the light escaping does not survive, every punctuation mark in the text is escaped.
 * @param {JsonNode} block
 * @param {Dialect} dialect
 */
export function writeChecked(block, dialect) {
    if (block.type === "sourceBlock")
        return block.attrs?.text ?? "";
    const emphasis = emphasisOf(block);
    const want = JSON.stringify(canon(block));
    let text = "";
    for (const all of [false, true]) {
        text = writeBlock(block, { all, dialect, emphasis });
        if (block.type === "paragraph" && !(block.content ?? []).length)
            return "";
        const back = toDoc(text, dialect).doc.content ?? [];
        if (back.length === 1 && JSON.stringify(canon(/** @type {JsonNode} */ (back[0]))) === want)
            return text;
    }
    return text;
}
/**
 * The file the editor's document stands for. A block the editor did not change is written as the
 * bytes it was read from, with the bytes that came before it; a changed one keeps the bytes before
 * it and is spelled again; a new one follows a blank line.
 * @param {JsonNode} doc the editor's document as JSON
 * @param {string} tail what followed the last block when the file was read
 * @param {Map<number, string>} prints the blocks as they were loaded (fingerprints)
 * @param {Dialect} dialect
 */
export function fromDoc(doc, tail, prints, dialect) {
    let out = "";
    for (const block of doc.content ?? []) {
        const md = /** @type {MdOrigin | null | undefined} */ (block.attrs?.md);
        if (md && prints.get(md.id) === print(block)) {
            out += md.before + md.source;
            continue;
        }
        const text = writeChecked(block, dialect);
        if (md)
            out += md.before + text;
        else if (text !== "")
            out += (out === "" ? "" : "\n\n") + text;
    }
    return out + tail;
}
/**
 * Markdown pasted as plain text, as blocks with no origin: they are new, and are spelled on save.
 * @param {string} text
 * @param {Dialect} dialect
 * @returns {JsonNode[]}
 */
export function pastedBlocks(text, dialect) {
    return JSON.parse(JSON.stringify(toDoc(text, dialect).doc.content ?? []), (key, value) => key === "md" ? null : value);
}
