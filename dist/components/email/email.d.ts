import { type EmailFamily } from "./colours.ts";
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
export type Block = {
    type: "heading";
    text: string;
} | {
    type: "paragraph";
    text: string;
} | {
    type: "button";
    label: string;
    url: string;
} | {
    type: "code";
    text: string;
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
export declare const escapeHtml: (value: string) => string;
/**
 * A link is accepted only as https: or mailto:, with no space or control character in it and no
 * user or password before the host, which would let `https://trusted.example@evil.example/` read as the trusted name.
 * Anything else throws; the caller must not swallow it. The string comes back untouched, so
 * a token in the address is never rewritten.
 */
export declare function checkUrl(url: string): string;
/** Renders one template to a subject, an HTML part and a text part, from the same blocks. */
export declare function renderEmail<D>(template: Template<D>, data: D & Common): Rendered;
interface LinkData {
    url: string;
    /** How long the link works, in words: "15 minutes". */
    expiresIn: string;
}
/** Sign in with one link. */
export declare const magicLink: Template<LinkData>;
/** Confirm an address. */
export declare const verification: Template<LinkData>;
/** Reset a password. */
export declare const reset: Template<LinkData>;
/** Something needs attention: a health check, a watchdog, a budget. The level is a word, never colour alone. */
export declare const alert: Template<{
    level: AlertLevel;
    what: string;
    when: string;
    details?: string[];
    url?: string;
}>;
/** A plain message: a decision, a digest line, a change of terms. */
export declare const notice: Template<{
    title: string;
    body: string[];
    action?: {
        label: string;
        url: string;
    };
}>;
