import { type AlertLevel, type Template, type Text } from "./email.ts";
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
    details?: Text[];
    pre?: string;
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
    body: Text[];
    action?: {
        label: string;
        url: string;
    };
}>;
export {};
