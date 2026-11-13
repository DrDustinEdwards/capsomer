// htmlToBlocks: a body written as HTML (a sender's template, a model's draft) read into the email's Blocks, the only
// shape renderEmail draws. Extracted from Foxhound (app/lib/email/templates.ts) in 0.123.0, so any site that lets
// someone write an email body in HTML gets the same reader. Pure: no DOM, so it runs in a Worker.
import { checkUrl, type Block } from "./email.ts";

// A small reader for the HTML a site's senders and a model write, not a
// general parser. What it keeps, and why:
//   - p, div, li, td, th, blockquote: one paragraph each. A <br> starts a new
//     paragraph, because Capsomer's paragraph has no line break inside it (so
//     "Thanks,<br>Example Co" becomes two short paragraphs, same words).
//   - h1 to h6: a heading. Nothing else becomes a heading; bold text is kept as
//     plain text in its paragraph, since Capsomer has no bold run.
//   - a link that is a block of its own: a button, label and address untouched.
//   - a link inside a sentence: the sentence keeps the link's words as plain
//     text, and a button with the same words and address follows the paragraph,
//     because Capsomer has no link inside a paragraph.
//   - a link Capsomer would refuse (anything but https: or mailto:, so tel:,
//     http:, "#", a relative path, an unfilled {{placeholder}}, javascript:,
//     data:): its words stay as text and no button is made. A generated body is
//     cached and reused on every retry, so a throw here would fail the step on
//     every attempt and never reach the template fallback.
//     Links a site supplies outside the body (the unsubscribe link, the
//     tracking URLs) still throw when refused.
//   - <small> around a whole block: fine print.
//   - two pieces of a table cell split by <span> (the digest's label and value)
//     are kept apart by a space.
// What it drops: script, style, head and title with their content, comments,
// anything hidden (a hidden attribute, aria-hidden="true", or a style of
// display:none or visibility:hidden), and images (their alt text is kept).

type BlockKind = "paragraph" | "heading" | "fine";

interface Pending {
  kind: BlockKind;
  /** Text outside any link, and link labels, in order. */
  text: string;
  links: { label: string; url: string }[];
  /** True while every piece so far sat inside <small>. */
  allSmall: boolean;
}

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
const ATTR = /([^\s"'=<>/`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

// ---- entities --------------------------------------------------------------------

const LATIN1_A0 =
  "nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr " +
  "deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest " +
  "Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml " +
  "ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig " +
  "agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml " +
  "eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml";

const NAMED: Record<string, string> = {
  amp: "&",
  AMP: "&",
  lt: "<",
  LT: "<",
  gt: ">",
  GT: ">",
  quot: '"',
  QUOT: '"',
  apos: "'",
  COPY: "\u00a9",
  REG: "\u00ae",
  trade: "\u2122",
  lsquo: "\u2018",
  rsquo: "\u2019",
  sbquo: "\u201a",
  ldquo: "\u201c",
  rdquo: "\u201d",
  bdquo: "\u201e",
  lsaquo: "\u2039",
  rsaquo: "\u203a",
  ndash: "\u2013",
  mdash: "\u2014",
  minus: "\u2212",
  hellip: "\u2026",
  bull: "\u2022",
  dagger: "\u2020",
  Dagger: "\u2021",
  permil: "\u2030",
  prime: "\u2032",
  Prime: "\u2033",
  euro: "\u20ac",
  ensp: "\u2002",
  emsp: "\u2003",
  thinsp: "\u2009",
  zwnj: "\u200c",
  zwj: "\u200d",
  larr: "\u2190",
  rarr: "\u2192",
  uarr: "\u2191",
  darr: "\u2193",
  check: "\u2713",
  OElig: "\u0152",
  oelig: "\u0153",
  Scaron: "\u0160",
  scaron: "\u0161",
  Yuml: "\u0178",
  fnof: "\u0192",
  circ: "\u02c6",
  tilde: "\u02dc",
};
LATIN1_A0.split(" ").forEach((name, i) => {
  NAMED[name] = String.fromCodePoint(0xa0 + i);
});

/** Decode numeric references (decimal and hex) and the named set above. An
 *  unknown or invalid reference is left exactly as written. */
function decodeEntities(s: string): string {
  return s.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, ref: string) => {
    if (ref[0] === "#") {
      const hex = ref[1] === "x" || ref[1] === "X";
      const code = parseInt(ref.slice(hex ? 2 : 1), hex ? 16 : 10);
      const valid = code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff);
      return valid ? String.fromCodePoint(code) : whole;
    }
    return Object.hasOwn(NAMED, ref) ? (NAMED[ref] ?? whole) : whole;
  });
}

// ---- attributes and hiding -------------------------------------------------------

/** Attribute names (lower case) to decoded values, quoted or unquoted. A bare
 *  name has the value "". The first of a repeated name wins, as in HTML. */
function parseAttrs(raw: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of raw.matchAll(ATTR)) {
    const name = (m[1] ?? "").toLowerCase();
    if (!out.has(name)) out.set(name, decodeEntities(m[2] ?? m[3] ?? m[4] ?? ""));
  }
  return out;
}

function isHidden(attrs: Map<string, string>): boolean {
  if (attrs.has("hidden")) return true;
  if ((attrs.get("aria-hidden") ?? "").trim().toLowerCase() === "true") return true;
  const style = (attrs.get("style") ?? "").replace(/\s+/g, "").toLowerCase();
  return style.includes("display:none") || style.includes("visibility:hidden");
}

/** The URL if Capsomer would carry it as a button, else null. */
function acceptedUrl(href: string): string | null {
  try {
    return checkUrl(href);
  } catch {
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
const OPTIONAL_END: Record<string, { closers: Set<string>; scopes: Set<string> }> = {
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

interface HiddenSkip {
  tag: string;
  /** Elements opened inside the hidden one and not yet closed. */
  stack: string[];
}

/**
 * Feed one tag to a hidden skip. Returns "skip" while the tag is inside the
 * hidden element, "end" when the tag ends it and is itself consumed (its own
 * end tag), and "end-reprocess" when the tag ends it implicitly and must then be
 * read as an ordinary tag (a sibling start tag or a parent's end tag).
 */
function feedHidden(
  h: HiddenSkip,
  name: string,
  closing: boolean,
  selfClose: boolean,
): "skip" | "end" | "end-reprocess" {
  const optional = OPTIONAL_END[h.tag];
  if (closing) {
    const at = h.stack.lastIndexOf(name);
    if (at !== -1) {
      h.stack.length = at;
      return "skip";
    }
    if (name === h.tag) return "end";
    // An end tag for something not opened inside: a parent closing, which
    // implicitly ends an optional-end element. Anything else is a stray tag.
    return optional ? "end-reprocess" : "skip";
  }
  if (
    optional &&
    optional.closers.has(name) &&
    !h.stack.some((t) => optional.scopes.has(t) || t === h.tag)
  ) {
    return "end-reprocess";
  }
  if (!VOID_TAGS.has(name) && !selfClose) h.stack.push(name);
  return "skip";
}

const squash = (s: string): string => s.replace(/\s+/g, " ").trim();

/** Turn a body written as HTML into Capsomer blocks, in order. Pure. */
export function htmlToBlocks(html: string): Block[] {
  const source = html.replace(/<!--[\s\S]*?-->/g, "").replace(DROPPED_WITH_CONTENT, "");
  const blocks: Block[] = [];

  let pending: Pending | null = null;
  let headingDepth = 0;
  let smallDepth = 0;
  let cellDepth = 0;
  let hidden: HiddenSkip | null = null;
  let link: { url: string; label: string } | null = null;

  const open = (): Pending => {
    pending ??= {
      kind: headingDepth > 0 ? "heading" : "paragraph",
      text: "",
      links: [],
      allSmall: true,
    };
    return pending;
  };

  const addText = (raw: string): void => {
    const text = decodeEntities(raw);
    if (link) {
      link.label += text;
      return;
    }
    if (!text.trim() && !pending) return;
    const p = open();
    p.text += text;
    if (text.trim() && smallDepth === 0) p.allSmall = false;
  };

  /** Close the open link, keeping its words in the block and its button. */
  const closeLink = (): void => {
    if (!link) return;
    const done: { url: string; label: string } = link;
    link = null;
    const p = open();
    p.text += done.label;
    if (done.label.trim() && smallDepth === 0) p.allSmall = false;
    p.links.push(done);
  };

  const flush = (): void => {
    const p = pending;
    pending = null;
    if (!p) return;
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
    if (text) blocks.push({ type: p.kind === "paragraph" && p.allSmall ? "fine" : p.kind, text });
    const seen = new Set<string>();
    for (const l of links) {
      const key = `${l.label}\n${l.url}`;
      if (seen.has(key)) continue;
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
        if (step === "end") hidden = null;
        continue;
      }
      // Ended implicitly: the text before this tag was still hidden, and the
      // tag itself is read below as an ordinary tag.
      hidden = null;
    } else {
      addText(between);
    }

    const attrs = parseAttrs(rawAttrs);
    if (!closing && isHidden(attrs)) {
      // A hidden block element still ends the block before it.
      if (BLOCK_TAGS.has(name)) {
        closeLink();
        flush();
      }
      // A void or self-closing element has no content to skip.
      if (!VOID_TAGS.has(name) && selfClose !== "/") hidden = { tag: name, stack: [] };
      continue;
    }

    if (name === "a") {
      // A second <a> before the first one closed ends the first, words kept.
      closeLink();
      if (!closing) {
        const url = acceptedUrl((attrs.get("href") ?? "").trim());
        if (url) link = { url, label: "" };
      }
      continue;
    }
    if (name === "img") {
      const alt = attrs.get("alt");
      if (alt && alt.trim()) addText(` ${alt} `);
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
      if (/^h[1-6]$/.test(name)) headingDepth = Math.max(0, headingDepth + (closing ? -1 : 1));
      if (name === "td" || name === "th") cellDepth = Math.max(0, cellDepth + (closing ? -1 : 1));
    }
  }
  if (!hidden) addText(source.slice(last));
  closeLink();
  flush();
  return blocks;
}
