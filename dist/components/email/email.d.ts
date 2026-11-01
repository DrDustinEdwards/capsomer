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
interface MagicLinkData extends LinkData {
    /** A one-time code that signs in the page that asked, for a link opened in another browser. Optional. */
    code?: string;
}
/** Sign in with one link, and with a code typed into the page that asked when the product sends one. */
export declare const magicLink: Template<MagicLinkData>;
/** Confirm an address. */
export declare const verification: Template<LinkData>;
/** Reset a password. */
export declare const reset: Template<LinkData>;
/**
 * One of an email change's two mails: `step: "current"` asks the account's current address to approve a change to
 * `newEmail`, then `step: "new"` asks the new address to confirm it (Better Auth's change-email flow, each link opening
 * site-runtime's `./sign-in` emailConfirmURL page, which acts only on its button). The link works until it expires,
 * not once, so this says only when it expires. The mail goes `to` the address it asks.
 */
export declare const emailChange: Template<{
    step: "current" | "new";
    newEmail?: string;
    url: string;
    expiresIn: string;
}>;
/** Something needs attention: a health check, a watchdog, a budget. The level is a word, never color alone. */
export declare const alert: Template<{
    level: AlertLevel;
    what: string;
    when: string;
    details?: string[];
    url?: string;
}>;
/**
 * A change to how a person signs in: what happened, when, the device and the place it came from, and what to do if it
 * was not them (NIST SP 800-63B-4 4.6). site-runtime's `./sign-in` gives `title`, `what` (null when the title says it all), `when`, `device`, `location`
 * and `secure` as its notice's `detail`; `url` is the product's own account page. The mail holds no link that signs in.
 */
export declare const securityNotice: Template<{
    title: string;
    what?: string | null;
    when: string;
    device?: string | null;
    location?: string | null;
    secure: string;
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
