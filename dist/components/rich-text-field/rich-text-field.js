// The rich text field's contract: a short text with a few inline tags and nothing else (no attributes, no links, no
// blocks), the same on the server that stores it and in the browser that edits it. `sanitizeRichText` is what the
// server runs on every save, so what a browser sends is never trusted; the field runs it on every input and paste.
// No dependencies: a small allowlist tokenizer does the job, and the browser side builds DOM from its tree, so no
// markup string reaches an injection sink (Trusted Types).
/** The tags a field may allow. Each is inline and takes no attribute. */
export const RICH_TEXT_TAGS = ["em", "strong", "sup", "sub", "code"];
const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?>/g;
// C0 controls but tab, LF and CR: invalid in stored text, and a NUL from a mangled paste breaks tools that read the
// value as SQL text.
// oxlint-disable-next-line no-control-regex -- matching the control characters is the point: they are stripped.
const CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
// The named references a browser's serializer, a word processor or a web page put in copied HTML. A name not here is
// kept as written, so nothing is lost; numeric references are all read.
const NAMED = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ensp: " ",
    emsp: " ",
    thinsp: " ",
    shy: "­",
    ndash: "–",
    mdash: "—",
    lsquo: "‘",
    rsquo: "’",
    sbquo: "‚",
    ldquo: "“",
    rdquo: "”",
    bdquo: "„",
    hellip: "…",
    bull: "•",
    middot: "·",
    deg: "°",
    micro: "µ",
    plusmn: "±",
    times: "×",
    divide: "÷",
    minus: "−",
    le: "≤",
    ge: "≥",
    ne: "≠",
    asymp: "≈",
    prime: "′",
    Prime: "″",
    copy: "©",
    reg: "®",
    trade: "™",
    sect: "§",
    para: "¶",
    dagger: "†",
    Dagger: "‡",
    permil: "‰",
    alpha: "α",
    beta: "β",
    gamma: "γ",
    delta: "δ",
    epsilon: "ε",
    kappa: "κ",
    lambda: "λ",
    mu: "μ",
    pi: "π",
    sigma: "σ",
    tau: "τ",
    phi: "φ",
    chi: "χ",
    psi: "ψ",
    omega: "ω",
    Delta: "Δ",
    Omega: "Ω",
};
/** `text` with its character references read (numeric, and the names above); an unknown name stays as written. */
export function decodeEntities(text) {
    return text.replace(/&(#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, ref) => {
        if (ref[0] === "#") {
            const code = ref[1] === "x" || ref[1] === "X" ? Number.parseInt(ref.slice(2), 16) : Number(ref.slice(1));
            return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
                ? String.fromCodePoint(code)
                : "�";
        }
        return NAMED[ref] ?? whole;
    });
}
const escapeText = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function tokenize(input) {
    const tokens = [];
    const src = input.replace(/<!--[\s\S]*?-->/g, "");
    let last = 0;
    TAG.lastIndex = 0;
    for (let m = TAG.exec(src); m !== null; m = TAG.exec(src)) {
        if (m.index > last)
            tokens.push({ type: "text", value: src.slice(last, m.index) });
        const tag = m[1].toLowerCase();
        tokens.push(m[0].startsWith("</") ? { type: "close", tag } : { type: "open", tag });
        last = m.index + m[0].length;
    }
    if (last < src.length)
        tokens.push({ type: "text", value: src.slice(last) });
    return tokens;
}
// What a word processor or a browser writes for these, read as the tag itself.
const ALIASES = { i: "em", b: "strong" };
/**
 * `input` (HTML, or plain text with stray < and &) as a tree of plain text and the `allowed` tags only: any other tag
 * is dropped and its text kept, attributes and comments are dropped, `<i>` reads as `em` and `<b>` as `strong`, and
 * the tags are balanced (one closed out of order closes and reopens the ones inside it). Text in `<script>` and
 * `<style>` is dropped with them.
 */
export function parseRichText(input, allowed) {
    const allow = new Set(allowed);
    const root = [];
    const stack = [];
    const here = () => (stack.length ? stack[stack.length - 1].children : root);
    const pushText = (value) => {
        if (value === "")
            return;
        const list = here();
        const prev = list[list.length - 1];
        if (typeof prev === "string")
            list[list.length - 1] = prev + value;
        else
            list.push(value);
    };
    const open = (tag) => {
        const node = { tag, children: [] };
        here().push(node);
        stack.push(node);
    };
    let skipping = null;
    for (const token of tokenize((input ?? "").replace(CONTROLS, ""))) {
        if (skipping) {
            if (token.type === "close" && token.tag === skipping)
                skipping = null;
            continue;
        }
        if (token.type === "text") {
            pushText(decodeEntities(token.value));
            continue;
        }
        if (token.type === "open" && (token.tag === "script" || token.tag === "style")) {
            skipping = token.tag;
            continue;
        }
        const tag = (ALIASES[token.tag] ?? token.tag);
        if (!allow.has(tag))
            continue;
        if (token.type === "open") {
            open(tag);
            continue;
        }
        const at = stack.map((s) => s.tag).lastIndexOf(tag);
        if (at === -1)
            continue; // a stray close
        const reopen = stack.slice(at + 1).map((s) => s.tag);
        stack.length = at;
        for (const t of reopen)
            open(t);
    }
    return prune(root);
}
// Empty tags go; neighboring text joins.
function prune(nodes) {
    const out = [];
    for (const n of nodes) {
        if (typeof n === "string") {
            const prev = out[out.length - 1];
            if (typeof prev === "string")
                out[out.length - 1] = prev + n;
            else if (n !== "")
                out.push(n);
            continue;
        }
        const children = prune(n.children);
        if (children.length)
            out.push({ tag: n.tag, children });
    }
    return out;
}
/** A tree as HTML: text escaped, tags bare. */
export function serializeRichText(nodes) {
    return nodes
        .map((n) => typeof n === "string"
        ? escapeText(n)
        : `<${n.tag}>${serializeRichText(n.children)}</${n.tag}>`)
        .join("");
}
/** `input` kept to the `allowed` tags, well formed, with the ends trimmed: what a server stores. */
export function sanitizeRichText(input, allowed) {
    return serializeRichText(parseRichText(input, allowed)).trim();
}
/** The plain text of a field's value, for counting, search and plain-text email. */
export function richTextPlain(html) {
    const text = (nodes) => nodes.map((n) => (typeof n === "string" ? n : text(n.children))).join("");
    return text(parseRichText(html, RICH_TEXT_TAGS)).replace(/ /g, " ");
}
/** The words in a field's value. */
export function richTextWords(html) {
    const text = richTextPlain(html).trim();
    return text ? text.split(/\s+/).length : 0;
}
/** Whether a field's value has no text. */
export function isEmptyRichText(html) {
    return richTextPlain(html).trim() === "";
}
/** A tree as DOM nodes, for the browser: built with createElement and text nodes, never parsed from a string. */
export function richTextNodes(doc, nodes) {
    return nodes.map((n) => {
        if (typeof n === "string")
            return doc.createTextNode(n);
        const el = doc.createElement(n.tag);
        el.append(...richTextNodes(doc, n.children));
        return el;
    });
}
/** The tags that hold `node` inside `root`, innermost first. */
export function tagsAround(node, root) {
    const out = [];
    for (let at = node; at && at !== root; at = at.parentNode) {
        if (at.nodeType !== 1)
            continue;
        const tag = at.localName;
        const name = (ALIASES[tag] ?? tag);
        if (RICH_TEXT_TAGS.includes(name))
            out.push(name);
    }
    return out;
}
/**
 * Toggles `tag` over the selection inside `root`: where the selection sits inside that tag, the tag is taken off
 * (its text stays); otherwise the selected text is wrapped in it and stays selected. A collapsed selection, or one
 * outside `root`, does nothing. Returns whether anything changed.
 */
export function toggleTag(root, tag, selection) {
    if (!selection || selection.rangeCount === 0)
        return false;
    const range = selection.getRangeAt(0);
    if (range.collapsed || !root.contains(range.commonAncestorContainer))
        return false;
    const doc = root.ownerDocument;
    let holder = null;
    for (let at = range.commonAncestorContainer; at && at !== root; at = at.parentNode) {
        if (at.nodeType === 1 &&
            (ALIASES[at.localName] ?? at.localName) === tag) {
            holder = at;
            break;
        }
    }
    const select = (first, last) => {
        const r = doc.createRange();
        r.setStartBefore(first);
        r.setEndAfter(last);
        selection.removeAllRanges();
        selection.addRange(r);
    };
    if (holder) {
        const kids = [...holder.childNodes];
        holder.replaceWith(...kids);
        if (kids.length)
            select(kids[0], kids[kids.length - 1]);
        return true;
    }
    const wrapper = doc.createElement(tag);
    wrapper.append(range.extractContents());
    range.insertNode(wrapper);
    // Inside the new tag, so the caret's tags (and the pressed button) include it.
    const r = doc.createRange();
    r.selectNodeContents(wrapper);
    selection.removeAllRanges();
    selection.addRange(r);
    return true;
}
/** Puts `nodes` where the selection is inside `root`, replacing what is selected, and the caret after them. */
export function insertNodes(root, nodes, selection) {
    if (!selection || selection.rangeCount === 0)
        return false;
    const range = selection.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer))
        return false;
    range.deleteContents();
    const frag = root.ownerDocument.createDocumentFragment();
    frag.append(...nodes);
    const last = frag.lastChild;
    range.insertNode(frag);
    if (last) {
        const after = root.ownerDocument.createRange();
        after.setStartAfter(last);
        after.collapse(true);
        selection.removeAllRanges();
        selection.addRange(after);
    }
    return true;
}
