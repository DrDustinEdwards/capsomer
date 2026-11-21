// htmlToBlocks: a body written as HTML (a sender's template, a model's draft) read into the email's Blocks, the only
// shape renderEmail draws. Extracted from Foxhound (app/lib/email/templates.ts) in 0.132.0, so any site that lets
// someone write an email body in HTML gets the same reader. Pure: no DOM, so it runs in a Worker.
import { htmlAttributes, unescapeHtml } from "@dustinedwards/site-runtime/html";
import { checkUrl } from "./email.js";
const BLOCK_TAGS = new Set([
    "p",
    "div",
    "li",
    "ul",
    "ol",
    "dl",
    "dt",
    "dd",
    "td",
    "th",
    "tr",
    "table",
    "tbody",
    "thead",
    "tfoot",
    "blockquote",
    "section",
    "article",
    "aside",
    "header",
    "footer",
    "nav",
    "pre",
    "hr",
    "br",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
]);
const DROPPED_WITH_CONTENT = /<(script|style|head|title|template|noscript)\b[\s\S]*?<\/\1\s*>/gi;
const VOID_TAGS = new Set([
    "br",
    "hr",
    "img",
    "meta",
    "link",
    "input",
    "wbr",
    "col",
    "source",
    "area",
    "base",
    "embed",
    "param",
    "track",
]);
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
// ---- attributes and hiding -------------------------------------------------------
function isHidden(attrs) {
    if ("hidden" in attrs)
        return true;
    if ((attrs["aria-hidden"] ?? "").trim().toLowerCase() === "true")
        return true;
    const style = (attrs.style ?? "").replace(/\s+/g, "").toLowerCase();
    return style.includes("display:none") || style.includes("visibility:hidden");
}
/** The URL if Capsomer would carry it as a button, else null. */
function acceptedUrl(href) {
    try {
        return checkUrl(href);
    }
    catch {
        return null;
    }
}
// Elements whose end tag may be left out, and what ends them implicitly: the
// start tags that close one as a sibling, and the elements that, open inside
// it, make such a start tag a nested child instead of a sibling.
const P_CLOSERS = [
    "address",
    "article",
    "aside",
    "blockquote",
    "dd",
    "div",
    "dl",
    "dt",
    "fieldset",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "li",
    "menu",
    "nav",
    "ol",
    "p",
    "pre",
    "section",
    "table",
    "ul",
];
const OPTIONAL_END = {
    p: { closers: new Set(P_CLOSERS), scopes: new Set() },
    li: { closers: new Set(["li"]), scopes: new Set(["ul", "ol"]) },
    dt: { closers: new Set(["dt", "dd"]), scopes: new Set(["dl"]) },
    dd: { closers: new Set(["dt", "dd"]), scopes: new Set(["dl"]) },
    td: {
        closers: new Set(["td", "th", "tr", "tbody", "thead", "tfoot"]),
        scopes: new Set(["table"]),
    },
    th: {
        closers: new Set(["td", "th", "tr", "tbody", "thead", "tfoot"]),
        scopes: new Set(["table"]),
    },
    tr: { closers: new Set(["tr", "tbody", "thead", "tfoot"]), scopes: new Set(["table"]) },
    option: { closers: new Set(["option", "optgroup"]), scopes: new Set(["select"]) },
};
/**
 * Feed one tag to a hidden skip. Returns "skip" while the tag is inside the
 * hidden element, "end" when the tag ends it and is itself consumed (its own
 * end tag), and "end-reprocess" when the tag ends it implicitly and must then be
 * read as an ordinary tag (a sibling start tag or a parent's end tag).
 */
function feedHidden(h, name, closing, selfClose) {
    const optional = OPTIONAL_END[h.tag];
    if (closing) {
        const at = h.stack.lastIndexOf(name);
        if (at !== -1) {
            h.stack.length = at;
            return "skip";
        }
        if (name === h.tag)
            return "end";
        // An end tag for something not opened inside: a parent closing, which
        // implicitly ends an optional-end element. Anything else is a stray tag.
        return optional ? "end-reprocess" : "skip";
    }
    if (optional &&
        optional.closers.has(name) &&
        !h.stack.some((t) => optional.scopes.has(t) || t === h.tag)) {
        return "end-reprocess";
    }
    if (!VOID_TAGS.has(name) && !selfClose)
        h.stack.push(name);
    return "skip";
}
const squash = (s) => s.replace(/\s+/g, " ").trim();
/** Turn a body written as HTML into Capsomer blocks, in order. Pure. */
export function htmlToBlocks(html) {
    const source = html.replace(/<!--[\s\S]*?-->/g, "").replace(DROPPED_WITH_CONTENT, "");
    const blocks = [];
    let pending = null;
    let headingDepth = 0;
    let smallDepth = 0;
    let cellDepth = 0;
    let hidden = null;
    let link = null;
    const open = () => {
        pending ??= {
            kind: headingDepth > 0 ? "heading" : "paragraph",
            text: "",
            links: [],
            allSmall: true,
        };
        return pending;
    };
    const addText = (raw) => {
        const text = unescapeHtml(raw);
        if (link) {
            link.label += text;
            return;
        }
        if (!text.trim() && !pending)
            return;
        const p = open();
        p.text += text;
        if (text.trim() && smallDepth === 0)
            p.allSmall = false;
    };
    /** Close the open link, keeping its words in the block and its button. */
    const closeLink = () => {
        if (!link)
            return;
        const done = link;
        link = null;
        const p = open();
        p.text += done.label;
        if (done.label.trim() && smallDepth === 0)
            p.allSmall = false;
        p.links.push(done);
    };
    const flush = () => {
        const p = pending;
        pending = null;
        if (!p)
            return;
        const text = squash(p.text);
        const links = p.links
            .map((l) => ({ label: squash(l.label), url: l.url }))
            .filter((l) => l.label);
        // A block that is nothing but one link is a button.
        const only = links.length === 1 ? links[0] : undefined;
        if (only && text === only.label) {
            blocks.push({ type: "button", label: only.label, url: only.url });
            return;
        }
        if (text)
            blocks.push({ type: p.kind === "paragraph" && p.allSmall ? "fine" : p.kind, text });
        const seen = new Set();
        for (const l of links) {
            const key = `${l.label}\n${l.url}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            blocks.push({ type: "button", label: l.label, url: l.url });
        }
    };
    let last = 0;
    for (const m of source.matchAll(TAG)) {
        const [whole, slash, rawName = "", rawAttrs = "", selfClose] = m;
        const name = rawName.toLowerCase();
        const closing = slash === "/";
        const between = source.slice(last, m.index);
        last = m.index + whole.length;
        if (hidden) {
            const step = feedHidden(hidden, name, closing, selfClose === "/");
            if (step !== "end-reprocess") {
                if (step === "end")
                    hidden = null;
                continue;
            }
            // Ended implicitly: the text before this tag was still hidden, and the
            // tag itself is read below as an ordinary tag.
            hidden = null;
        }
        else {
            addText(between);
        }
        const attrs = htmlAttributes(rawAttrs);
        if (!closing && isHidden(attrs)) {
            // A hidden block element still ends the block before it.
            if (BLOCK_TAGS.has(name)) {
                closeLink();
                flush();
            }
            // A void or self-closing element has no content to skip.
            if (!VOID_TAGS.has(name) && selfClose !== "/")
                hidden = { tag: name, stack: [] };
            continue;
        }
        if (name === "a") {
            // A second <a> before the first one closed ends the first, words kept.
            closeLink();
            if (!closing) {
                const url = acceptedUrl((attrs.href ?? "").trim());
                if (url)
                    link = { url, label: "" };
            }
            continue;
        }
        if (name === "img") {
            const alt = attrs.alt;
            if (alt && alt.trim())
                addText(` ${alt} `);
            continue;
        }
        if (name === "small") {
            smallDepth = Math.max(0, smallDepth + (closing ? -1 : 1));
            continue;
        }
        if (name === "span" && cellDepth > 0) {
            addText(" ");
            continue;
        }
        if (BLOCK_TAGS.has(name)) {
            closeLink();
            flush();
            if (/^h[1-6]$/.test(name))
                headingDepth = Math.max(0, headingDepth + (closing ? -1 : 1));
            if (name === "td" || name === "th")
                cellDepth = Math.max(0, cellDepth + (closing ? -1 : 1));
        }
    }
    if (!hidden)
        addText(source.slice(last));
    closeLink();
    flush();
    return blocks;
}
