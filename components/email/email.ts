// Email templates: one definition makes the HTML and the text, so the two cannot disagree.
// Pure functions with no dependency beyond site-runtime's HTML escape, no filesystem and no fetch: they run in a Worker, in
// Node and in a test. Every value that reaches the HTML is escaped here, and a template
// author never writes markup. Colors are literal hexes from the family generator
// (colors.ts), because mail clients ignore custom properties.
import { emailColors, type EmailColors, type EmailFamily } from "./colors.ts";

export type { EmailFamily };

export interface Brand {
  /** The product's name, set in type at the top of the mail. There is no logo image. */
  name: string;
  family: EmailFamily;
}

/** A line of the footer slot: plain text, or a text with a link (an unsubscribe link is the product's own). */
export type FooterLine = string | { text: string; url: string };

/** One piece of a line: plain words, or words in bold. Both are escaped; no markup reaches the HTML. */
export type Run = string | { bold: string };

/** One line of a paragraph: plain words, or a list of runs. */
export type Line = string | Run[];

/** Paragraph text: one string, or a list of lines (joined with a line break in the HTML, a newline in the text part). */
export type Text = string | Line[];

export type Block =
  | { type: "heading"; text: string }
  /** A section heading below the one h1: an h2 in the HTML, a plain line in the text part. */
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: Text }
  | { type: "button"; label: string; url: string }
  | { type: "code"; text: string }
  /** Preformatted text, such as a stack excerpt: whitespace and line breaks kept, monospace, in a quiet panel. */
  | { type: "pre"; text: string }
  /** Label and value pairs, one ruled row each: the label on the left, the value on the right. Plain strings. */
  | { type: "rows"; rows: { label: string; value: string }[] }
  | { type: "note"; text: string; level?: AlertLevel }
  | { type: "fine"; text: string };

export type AlertLevel = "crit" | "warn" | "info";

/** Wording a product may replace, per template. Strings only; escaped like any value. */
export interface Copy {
  subject?: string;
  heading?: string;
  intro?: string;
  button?: string;
  ignore?: string;
}

export interface Common {
  brand: Brand;
  /** Who the mail is for; the footer says it was sent to this address. */
  to: string;
  copy?: Copy;
  footer?: FooterLine[];
  /** The document's language. Default "en". */
  lang?: string;
}

export interface Template<D> {
  name: string;
  subject(data: D & Common): string;
  blocks(data: D & Common): Block[];
}

export interface Rendered {
  subject: string;
  html: string;
  text: string;
}

import { escapeHtml } from "@dustinedwards/site-runtime/html";

/** One line: line breaks and runs of space become one space, so a value cannot add a header or a line. */
const oneLine = (value: string): string => value.replace(/\s+/g, " ").trim();

/** Line breaks as written, whichever way a platform ended them. */
const crlf = (value: string): string => value.replace(/\r\n?/g, "\n");

/**
 * A link is accepted only as https: or mailto:, with no space or control character in it and no
 * user or password before the host, which would let `https://trusted.example@evil.example/` read as the trusted name.
 * Anything else throws; the caller must not swallow it. The string comes back untouched, so
 * a token in the address is never rewritten.
 */
export function checkUrl(url: string): string {
  if (/[\p{Cc} "<>\\^`{|}]/u.test(url))
    throw new Error(
      'email: a link may not hold a space, a control character or any of " < > \\ ^ ` { | }',
    );
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("email: a link must be an absolute https: or mailto: address");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "mailto:")
    throw new Error(`email: a link must be https: or mailto:, got ${parsed.protocol}`);
  if (parsed.username || parsed.password)
    throw new Error("email: a link may not hold a user or password before the host");
  return url;
}

function colorsFor(family: EmailFamily): { light: EmailColors; dark: EmailColors } {
  const c = emailColors[family];
  if (!c) throw new Error(`email: unknown family "${String(family)}"`);
  return c;
}

export const LEVEL_WORD: Record<AlertLevel, string> = {
  crit: "Critical",
  warn: "Warning",
  info: "Notice",
};
const FONT = "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

function darkRules(d: EmailColors): string {
  return [
    `.e-ground{background-color:${d.ground} !important}`,
    `.e-card{background-color:${d.surface} !important;border-color:${d.line} !important}`,
    `.e-text{color:${d.text} !important}`,
    `.e-muted{color:${d.muted} !important}`,
    `.e-link{color:${d["accent-text"]} !important}`,
    `.e-btn{background-color:${d.primary} !important;color:${d["primary-fg"]} !important}`,
    `.e-rule{border-color:${d.line} !important}`,
    `.e-pre{background-color:${d.ground} !important;border-color:${d.line} !important}`,
    ...(["crit", "warn", "info"] as const).map(
      (l) => `.e-${l}{background-color:${d[`${l}-soft`]} !important;color:${d[l]} !important}`,
    ),
  ].join("\n");
}

const runText = (r: Run): string => (typeof r === "string" ? r : r.bold);
const plainLine = (l: Line): string => (typeof l === "string" ? l : l.map(runText).join(""));
const runHtml = (r: Run): string =>
  typeof r === "string" ? escapeHtml(r) : `<strong>${escapeHtml(r.bold)}</strong>`;
const lineHtml = (l: Line): string =>
  typeof l === "string" ? escapeHtml(l) : l.map(runHtml).join("");

/** A paragraph's words for the text part: bold is only its words, lines end with a newline. */
const textOf = (t: Text): string => (typeof t === "string" ? t : t.map(plainLine).join("\n"));
const htmlOf = (t: Text): string =>
  typeof t === "string" ? escapeHtml(t) : t.map(lineHtml).join("<br>");

function blockHtml(b: Block, c: EmailColors): string {
  const text = `font-family:${FONT};font-size:16px;line-height:24px;color:${c.text};`;
  switch (b.type) {
    case "heading":
      return `<tr><td class="e-text" style="${text}font-size:22px;line-height:30px;font-weight:700;padding:0 0 16px 0;"><h1 style="margin:0;font-size:22px;line-height:30px;font-weight:700;">${escapeHtml(b.text)}</h1></td></tr>`;
    case "subheading":
      return `<tr><td class="e-text" style="${text}padding:8px 0 12px 0;"><h2 style="margin:0;font-size:18px;line-height:26px;font-weight:700;">${escapeHtml(b.text)}</h2></td></tr>`;
    case "paragraph":
      return `<tr><td class="e-text" style="${text}padding:0 0 16px 0;">${htmlOf(b.text)}</td></tr>`;
    case "pre":
      return `<tr><td style="padding:0 0 16px 0;"><div class="e-pre" style="background-color:${c.ground};border:1px solid ${c.line};border-radius:6px;padding:12px 16px;"><pre class="e-text" style="margin:0;font-family:${MONO};font-size:16px;line-height:24px;color:${c.text};white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(crlf(b.text))}</pre></div></td></tr>`;
    case "rows": {
      const cell = `font-family:${FONT};font-size:16px;line-height:24px;padding:10px 0;border-bottom:1px solid ${c.line};vertical-align:top;word-break:break-word;`;
      const rows = b.rows
        .map(
          (r) =>
            `<tr><td class="e-rule e-muted" style="${cell}color:${c.muted};padding-right:12px;">${escapeHtml(oneLine(r.label))}</td><td class="e-rule e-text" align="right" style="${cell}color:${c.text};text-align:right;">${escapeHtml(oneLine(r.value))}</td></tr>`,
        )
        .join("");
      return `<tr><td style="padding:0 0 16px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table></td></tr>`;
    }
    case "button": {
      const url = escapeHtml(checkUrl(b.url));
      return `<tr><td style="padding:8px 0 24px 0;"><a class="e-btn" href="${url}" style="display:inline-block;background-color:${c.primary};color:${c["primary-fg"]};font-family:${FONT};font-size:16px;line-height:20px;font-weight:600;text-decoration:none;padding:14px 24px;border-radius:6px;">${escapeHtml(b.label)}</a></td></tr>`;
    }
    case "code":
      return `<tr><td class="e-text" style="${text}font-family:${MONO};font-size:20px;line-height:28px;letter-spacing:2px;font-weight:700;padding:0 0 16px 0;">${escapeHtml(b.text)}</td></tr>`;
    case "note": {
      const level = b.level;
      const style = level
        ? `background-color:${c[`${level}-soft`]};color:${c[level]};`
        : `color:${c.text};`;
      const word = level ? `<strong>${LEVEL_WORD[level]}.</strong> ` : "";
      return `<tr><td style="padding:0 0 16px 0;"><div class="${level ? `e-${level}` : "e-text"}" style="${style}font-family:${FONT};font-size:16px;line-height:24px;padding:12px 16px;border-radius:6px;">${word}${escapeHtml(b.text)}</div></td></tr>`;
    }
    case "fine":
      return `<tr><td class="e-muted" style="font-family:${FONT};font-size:16px;line-height:24px;color:${c.muted};padding:0 0 8px 0;">${escapeHtml(b.text)}</td></tr>`;
  }
}

function footerHtml(lines: FooterLine[], c: EmailColors): string {
  return lines
    .map((l) => {
      const style = `font-family:${FONT};font-size:14px;line-height:22px;color:${c.muted};padding:0 0 4px 0;`;
      if (typeof l === "string")
        return `<tr><td class="e-muted" style="${style}">${escapeHtml(l)}</td></tr>`;
      return `<tr><td class="e-muted" style="${style}"><a class="e-link" href="${escapeHtml(checkUrl(l.url))}" style="color:${c["accent-text"]};text-decoration:none;font-weight:600;">${escapeHtml(l.text)}</a></td></tr>`;
    })
    .join("\n");
}

function blockText(b: Block): string {
  switch (b.type) {
    case "paragraph":
      return textOf(b.text);
    case "pre":
      return crlf(b.text)
        .split("\n")
        .map((l) => `    ${l}`)
        .join("\n");
    case "rows":
      return b.rows.map((r) => `${oneLine(r.label)}: ${oneLine(r.value)}`).join("\n");
    case "heading":
      return b.text;
    case "button":
      return `${b.label}:\n${checkUrl(b.url)}`;
    case "code":
      return `    ${b.text}`;
    case "note":
      return b.level ? `${LEVEL_WORD[b.level]}. ${b.text}` : b.text;
    default:
      return b.text;
  }
}

/** Renders one template to a subject, an HTML part and a text part, from the same blocks. */
export function renderEmail<D>(template: Template<D>, data: D & Common): Rendered {
  const { brand, to } = data;
  const colors = colorsFor(brand.family);
  const c = colors.light;
  const subject = oneLine(template.subject(data));
  const blocks = template.blocks(data);
  const footer: FooterLine[] = [`This message was sent to ${oneLine(to)}.`, ...(data.footer ?? [])];

  const body = blocks.map((b) => blockHtml(b, c)).join("\n");
  // The document has one h1. A template with no heading block (a resent body, say) gets it from the brand line, which
  // looks exactly as it did; the text part is unchanged.
  const brandName = escapeHtml(oneLine(brand.name));
  const brandLine = blocks.some((b) => b.type === "heading")
    ? brandName
    : `<h1 style="margin:0;padding:0;font-family:inherit;font-size:inherit;line-height:inherit;font-weight:inherit;color:inherit;">${brandName}</h1>`;
  const html = `<!doctype html>
<html lang="${escapeHtml(data.lang ?? "en")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(subject)}</title>
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
@media (prefers-color-scheme: dark){
${darkRules(colors.dark)}
}
</style>
</head>
<body class="e-ground" style="margin:0;padding:0;background-color:${c.ground};">
<table role="presentation" class="e-ground" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.ground};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
<tr><td class="e-text" style="font-family:${FONT};font-size:18px;line-height:24px;font-weight:700;color:${c.text};padding:0 4px 16px 4px;">${brandLine}</td></tr>
<tr><td>
<table role="presentation" class="e-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.surface};border:1px solid ${c.line};border-radius:8px;">
<tr><td style="padding:28px 24px 12px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${body}
</table>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:16px 4px 0 4px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${footerHtml(footer, c)}
</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;

  const textFooter = footer.map((l) =>
    typeof l === "string" ? l : `${l.text}: ${checkUrl(l.url)}`,
  );
  const text = `${oneLine(brand.name)}\n\n${blocks.map(blockText).join("\n\n")}\n\n--\n${textFooter.join("\n")}\n`;
  return { subject, html, text };
}

// The stock templates (email-templates.ts) and a body written as HTML, read into Blocks (html-to-blocks.ts).
export {
  alert,
  emailChange,
  magicLink,
  notice,
  reset,
  securityNotice,
  verification,
} from "./email-templates.ts";
export { htmlToBlocks } from "./html-to-blocks.ts";
