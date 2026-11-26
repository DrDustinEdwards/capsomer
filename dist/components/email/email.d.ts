import { type EmailFamily } from "./colors.ts";
export type { EmailFamily };
export interface Brand {
    /** The product's name, set in type at the top of the mail. There is no logo image. */
    name: string;
    family: EmailFamily;
}
/** A line of the footer slot: plain text, or a text with a link (an unsubscribe link is the product's own). */
export type FooterLine = string | {
    text: string;
    url: string;
};
/** One piece of a line: plain words, or words in bold. Both are escaped; no markup reaches the HTML. */
export type Run = string | {
    bold: string;
};
/** One line of a paragraph: plain words, or a list of runs. */
export type Line = string | Run[];
/** Paragraph text: one string, or a list of lines (joined with a line break in the HTML, a newline in the text part). */
export type Text = string | Line[];
export type Block = {
    type: "heading";
    text: string;
}
/** A section heading below the one h1: an h2 in the HTML, a plain line in the text part. */
 | {
    type: "subheading";
    text: string;
} | {
    type: "paragraph";
    text: Text;
} | {
    type: "button";
    label: string;
    url: string;
} | {
    type: "code";
    text: string;
}
/** Preformatted text, such as a stack excerpt: whitespace and line breaks kept, monospace, in a quiet panel. */
 | {
    type: "pre";
    text: string;
}
/** Label and value pairs, one ruled row each: the label on the left, the value on the right. Plain strings. */
 | {
    type: "rows";
    rows: {
        label: string;
        value: string;
    }[];
} | {
    type: "note";
    text: string;
    level?: AlertLevel;
} | {
    type: "fine";
    text: string;
};
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
/**
 * A link is accepted only as https: or mailto:, with no space or control character in it and no
 * user or password before the host, which would let `https://trusted.example@evil.example/` read as the trusted name.
 * Anything else throws; the caller must not swallow it. The string comes back untouched, so
 * a token in the address is never rewritten.
 */
export declare function checkUrl(url: string): string;
export declare const LEVEL_WORD: Record<AlertLevel, string>;
/** Renders one template to a subject, an HTML part and a text part, from the same blocks. */
export declare function renderEmail<D>(template: Template<D>, data: D & Common): Rendered;
export { alert, emailChange, magicLink, notice, reset, securityNotice, verification, } from "./email-templates.ts";
export { htmlToBlocks } from "./html-to-blocks.ts";
