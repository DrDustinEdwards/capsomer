// The rich text field's contract: short text with a few attribute-free inline tags, the same on the
// server (`sanitizeRichText` runs on every save; a browser is never trusted) and in the browser. A small
// allowlist tokenizer, and the browser builds DOM from its tree so no markup string reaches a Trusted Types sink.
export const RICH_TEXT_TAGS = ["em", "strong", "sup", "sub", "code"];
const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?>/g;
// C0 controls but tab, LF and CR: invalid in stored text, and a NUL from a mangled paste breaks tools that read the
// value as SQL text.
// oxlint-disable-next-line no-control-regex -- matching the control characters is the point: they are stripped.
const CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
// Named references that copied HTML carries; an unknown name is kept as written, numeric ones are all read.
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
export function decodeEntities(text) {
    return text.replace(/&(#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, ref) => {
        if (ref[0] === "#") {
            const code = ref[1] === "x" || ref[1] === "X" ? Number.parseInt(ref.slice(2), 16) : Number(ref.slice(1));
            // A C0 control (but tab, LF, CR) is as invalid as a literal one: it never reaches stored text.
            const control = code < 0x20 && code !== 9 && code !== 10 && code !== 13;
            return code > 0 && code <= 0x10ffff && !control && !(code >= 0xd800 && code <= 0xdfff)
                ? String.fromCodePoint(code)
                : "�";
        }
        // Own names only: a plain object also answers &constructor; and &toString; from its prototype.
        return Object.hasOwn(NAMED, ref) ? NAMED[ref] : whole;
    });
}
const escapeText = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const RICH_TEXT_MAX_INPUT = 50_000;
/** `text` up to its last `end`: a lazy scan for a missing close would re-read the rest at every opener. */
function through(text, end) {
    const at = text.lastIndexOf(end);
    return at === -1 ? "" : text.slice(0, at + end.length);
}
function tokenize(input) {
    const tokens = [];
    const closed = through(input, "-->");
    const src = closed.replace(/<!--[\s\S]*?-->/g, "") + input.slice(closed.length);
    const scan = through(src, ">");
    let last = 0;
    TAG.lastIndex = 0;
    for (let m = TAG.exec(scan); m !== null; m = TAG.exec(scan)) {
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
const ALIASES = { i: "em", b: "strong" };
/**
 * `input` as a tree of plain text and the `allowed` tags only: other tags are dropped (text kept),
 * `<i>` reads as `em` and `<b>` as `strong`, tags are balanced, script and style text is dropped.
 * Input past RICH_TEXT_MAX_INPUT characters is not read.
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
    for (const token of tokenize((input ?? "").slice(0, RICH_TEXT_MAX_INPUT).replace(CONTROLS, ""))) {
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
export function serializeRichText(nodes) {
    return nodes
        .map((n) => typeof n === "string"
        ? escapeText(n)
        : `<${n.tag}>${serializeRichText(n.children)}</${n.tag}>`)
        .join("");
}
export function sanitizeRichText(input, allowed) {
    return serializeRichText(parseRichText(input, allowed)).trim();
}
export function richTextPlain(html) {
    const text = (nodes) => nodes.map((n) => (typeof n === "string" ? n : text(n.children))).join("");
    return text(parseRichText(html, RICH_TEXT_TAGS)).replace(/ /g, " ");
}
export function richTextWords(html) {
    const text = richTextPlain(html).trim();
    return text ? text.split(/\s+/).length : 0;
}
export function isEmptyRichText(html) {
    return richTextPlain(html).trim() === "";
}
export function richTextNodes(doc, nodes) {
    return nodes.map((n) => {
        if (typeof n === "string")
            return doc.createTextNode(n);
        const el = doc.createElement(n.tag);
        el.append(...richTextNodes(doc, n.children));
        return el;
    });
}
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
/** Toggles `tag` over the selection inside `root`. Returns whether anything changed. */
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
    const r = doc.createRange();
    r.selectNodeContents(wrapper);
    selection.removeAllRanges();
    selection.addRange(r);
    return true;
}
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
