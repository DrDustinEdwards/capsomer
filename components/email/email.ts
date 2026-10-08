// Email templates: one definition makes the HTML and the text, so the two cannot disagree.
// Pure functions with no dependency, no filesystem and no fetch: they run in a Worker, in
// Node and in a test. Every value that reaches the HTML is escaped here, and a template
// author never writes markup. Colours are literal hexes from the family generator
// (colours.ts), because mail clients ignore custom properties.
import { emailColours, type EmailColours, type EmailFamily } from "./colours.ts";

export type { EmailFamily };

export interface Brand {
  /** The product's name, set in type at the top of the mail. There is no logo image. */
  name: string;
  family: EmailFamily;
}

/** A line of the footer slot: plain text, or a text with a link (an unsubscribe link is the product's own). */
export type FooterLine = string | { text: string; url: string };

export type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "button"; label: string; url: string }
  | { type: "code"; text: string }
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

// ---- escaping and links ------------------------------------------------------------------

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);

/** One line: line breaks and runs of space become one space, so a value cannot add a header or a line. */
const oneLine = (value: string): string => value.replace(/\s+/g, " ").trim();

/**
 * A link is accepted only as https: or mailto:, with no space or control character in it.
 * Anything else throws; the caller must not swallow it. The string comes back untouched, so
 * a token in the address is never rewritten.
 */
export function checkUrl(url: string): string {
  if (/[\u0000- \u007f-\u009f"<>\\^`{|}]/.test(url)) throw new Error("email: a link may not hold a space, a control character or any of \" < > \\ ^ ` { | }");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("email: a link must be an absolute https: or mailto: address");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "mailto:") throw new Error(`email: a link must be https: or mailto:, got ${parsed.protocol}`);
  return url;
}

// ---- the colours ---------------------------------------------------------------------------

function coloursFor(family: EmailFamily): { light: EmailColours; dark: EmailColours } {
  const c = emailColours[family];
  if (!c) throw new Error(`email: unknown family "${String(family)}"`);
  return c;
}

const LEVEL_WORD: Record<AlertLevel, string> = { crit: "Critical", warn: "Warning", info: "Notice" };
const FONT = "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// ---- the frame -------------------------------------------------------------------------------

function darkRules(d: EmailColours): string {
  return [
    `.e-ground{background-color:${d.ground} !important}`,
    `.e-card{background-color:${d.surface} !important;border-color:${d.line} !important}`,
    `.e-text{color:${d.text} !important}`,
    `.e-muted{color:${d.muted} !important}`,
    `.e-link{color:${d["accent-text"]} !important}`,
    `.e-btn{background-color:${d.primary} !important;color:${d["primary-fg"]} !important}`,
    `.e-rule{border-color:${d.line} !important}`,
    ...(["crit", "warn", "info"] as const).map((l) => `.e-${l}{background-color:${d[`${l}-soft`]} !important;color:${d[l]} !important}`),
  ].join("\n");
}

function blockHtml(b: Block, c: EmailColours): string {
  const text = `font-family:${FONT};font-size:16px;line-height:24px;color:${c.text};`;
  switch (b.type) {
    case "heading":
      return `<tr><td class="e-text" style="${text}font-size:22px;line-height:30px;font-weight:700;padding:0 0 16px 0;"><h1 style="margin:0;font-size:22px;line-height:30px;font-weight:700;">${escapeHtml(b.text)}</h1></td></tr>`;
    case "paragraph":
      return `<tr><td class="e-text" style="${text}padding:0 0 16px 0;">${escapeHtml(b.text)}</td></tr>`;
    case "button": {
      const url = escapeHtml(checkUrl(b.url));
      return `<tr><td style="padding:8px 0 24px 0;"><a class="e-btn" href="${url}" style="display:inline-block;background-color:${c.primary};color:${c["primary-fg"]};font-family:${FONT};font-size:16px;line-height:20px;font-weight:600;text-decoration:none;padding:14px 24px;border-radius:6px;">${escapeHtml(b.label)}</a></td></tr>`;
    }
    case "code":
      return `<tr><td class="e-text" style="${text}font-family:${MONO};font-size:20px;line-height:28px;letter-spacing:2px;font-weight:700;padding:0 0 16px 0;">${escapeHtml(b.text)}</td></tr>`;
    case "note": {
      const level = b.level;
      const style = level ? `background-color:${c[`${level}-soft`]};color:${c[level]};` : `color:${c.text};`;
      const word = level ? `<strong>${LEVEL_WORD[level]}.</strong> ` : "";
      return `<tr><td style="padding:0 0 16px 0;"><div class="${level ? `e-${level}` : "e-text"}" style="${style}font-family:${FONT};font-size:16px;line-height:24px;padding:12px 16px;border-radius:6px;">${word}${escapeHtml(b.text)}</div></td></tr>`;
    }
    case "fine":
      return `<tr><td class="e-muted" style="font-family:${FONT};font-size:16px;line-height:24px;color:${c.muted};padding:0 0 8px 0;">${escapeHtml(b.text)}</td></tr>`;
  }
}

function footerHtml(lines: FooterLine[], c: EmailColours): string {
  return lines
    .map((l) => {
      const style = `font-family:${FONT};font-size:14px;line-height:22px;color:${c.muted};padding:0 0 4px 0;`;
      if (typeof l === "string") return `<tr><td class="e-muted" style="${style}">${escapeHtml(l)}</td></tr>`;
      return `<tr><td class="e-muted" style="${style}"><a class="e-link" href="${escapeHtml(checkUrl(l.url))}" style="color:${c["accent-text"]};text-decoration:underline;">${escapeHtml(l.text)}</a></td></tr>`;
    })
    .join("\n");
}

function blockText(b: Block): string {
  switch (b.type) {
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
  const colours = coloursFor(brand.family);
  const c = colours.light;
  const subject = oneLine(template.subject(data));
  const blocks = template.blocks(data);
  const footer: FooterLine[] = [`This message was sent to ${oneLine(to)}.`, ...(data.footer ?? [])];

  const body = blocks.map((b) => blockHtml(b, c)).join("\n");
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
${darkRules(colours.dark)}
}
</style>
</head>
<body class="e-ground" style="margin:0;padding:0;background-color:${c.ground};">
<table role="presentation" class="e-ground" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.ground};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
<tr><td class="e-text" style="font-family:${FONT};font-size:18px;line-height:24px;font-weight:700;color:${c.text};padding:0 4px 16px 4px;">${escapeHtml(oneLine(brand.name))}</td></tr>
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

  const textFooter = footer.map((l) => (typeof l === "string" ? l : `${l.text}: ${checkUrl(l.url)}`));
  const text = `${oneLine(brand.name)}\n\n${blocks.map(blockText).join("\n\n")}\n\n--\n${textFooter.join("\n")}\n`;
  return { subject, html, text };
}

// ---- the templates ---------------------------------------------------------------------------

interface LinkData {
  url: string;
  /** How long the link works, in words: "15 minutes". */
  expiresIn: string;
}

const linkBlocks = (d: LinkData & Common, defaults: { heading: string; intro: string; button: string; ignore: string }): Block[] => {
  const k = d.copy ?? {};
  return [
    { type: "heading", text: k.heading ?? defaults.heading },
    { type: "paragraph", text: k.intro ?? defaults.intro },
    { type: "button", label: k.button ?? defaults.button, url: d.url },
    { type: "fine", text: `The link works once and expires in ${d.expiresIn}.` },
    { type: "fine", text: k.ignore ?? defaults.ignore },
  ];
};

/** Sign in with one link. */
export const magicLink: Template<LinkData> = {
  name: "magic-link",
  subject: (d) => d.copy?.subject ?? `Your sign-in link for ${d.brand.name}`,
  blocks: (d) =>
    linkBlocks(d, {
      heading: `Sign in to ${d.brand.name}`,
      intro: `Someone asked to sign in to ${d.brand.name} as ${d.to}. Use the button to finish.`,
      button: "Sign in",
      ignore: "If this was not you, ignore this message. Nothing happens unless the link is used.",
    }),
};

/** Confirm an address. */
export const verification: Template<LinkData> = {
  name: "verification",
  subject: (d) => d.copy?.subject ?? `Confirm your email address for ${d.brand.name}`,
  blocks: (d) =>
    linkBlocks(d, {
      heading: "Confirm your email address",
      intro: `Someone used ${d.to} to register with ${d.brand.name}. Confirm the address to finish.`,
      button: "Confirm email address",
      ignore: "If this was not you, ignore this message. The address stays unconfirmed.",
    }),
};

/** Reset a password. */
export const reset: Template<LinkData> = {
  name: "reset",
  subject: (d) => d.copy?.subject ?? `Reset your ${d.brand.name} password`,
  blocks: (d) =>
    linkBlocks(d, {
      heading: "Reset your password",
      intro: `Someone asked to reset the password for ${d.to} on ${d.brand.name}. Use the button to choose a new one.`,
      button: "Reset password",
      ignore: "If this was not you, ignore this message. Your password has not changed.",
    }),
};

/** Something needs attention: a health check, a watchdog, a budget. The level is a word, never colour alone. */
export const alert: Template<{ level: AlertLevel; what: string; when: string; details?: string[]; url?: string }> = {
  name: "alert",
  subject: (d) => d.copy?.subject ?? `${LEVEL_WORD[d.level]}: ${d.what}`,
  blocks: (d) => {
    const k = d.copy ?? {};
    const out: Block[] = [
      { type: "heading", text: k.heading ?? d.what },
      { type: "note", level: d.level, text: k.intro ?? `${d.what} at ${d.when}.` },
      ...(d.details ?? []).map((text): Block => ({ type: "paragraph", text })),
    ];
    if (d.url) out.push({ type: "button", label: k.button ?? "Open", url: d.url });
    return out;
  },
};

/** A plain message: a decision, a digest line, a change of terms. */
export const notice: Template<{ title: string; body: string[]; action?: { label: string; url: string } }> = {
  name: "notice",
  subject: (d) => d.copy?.subject ?? d.title,
  blocks: (d) => {
    const k = d.copy ?? {};
    const out: Block[] = [
      { type: "heading", text: k.heading ?? d.title },
      ...(k.intro === undefined ? d.body : [k.intro, ...d.body.slice(1)]).map((text): Block => ({ type: "paragraph", text })),
    ];
    if (d.action) out.push({ type: "button", label: k.button ?? d.action.label, url: d.action.url });
    return out;
  },
};
