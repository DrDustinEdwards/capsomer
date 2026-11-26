// The stock templates: sign-in, verification, reset, address change, alert, security notice and a plain notice.
// Each is a Template (email.ts) that names its blocks; email.ts renders them to HTML and text.
import { LEVEL_WORD, } from "./email.js";
const linkBlocks = (d, defaults) => {
    const k = d.copy ?? {};
    return [
        { type: "heading", text: k.heading ?? defaults.heading },
        { type: "paragraph", text: k.intro ?? defaults.intro },
        { type: "button", label: k.button ?? defaults.button, url: d.url },
        { type: "fine", text: `The link works once and expires in ${d.expiresIn}.` },
        { type: "fine", text: k.ignore ?? defaults.ignore },
    ];
};
/** Sign in with one link, and with a code typed into the page that asked when the product sends one. */
export const magicLink = {
    name: "magic-link",
    subject: (d) => d.copy?.subject ?? `Your sign-in link for ${d.brand.name}`,
    blocks: (d) => {
        const blocks = linkBlocks(d, {
            heading: `Sign in to ${d.brand.name}`,
            intro: `Someone asked to sign in to ${d.brand.name} as ${d.to}.`,
            button: "Sign in",
            ignore: d.code
                ? "If this was not you, ignore this message. Nothing happens unless the link or the code is used."
                : "If this was not you, ignore this message. Nothing happens unless the link is used.",
        });
        if (!d.code)
            return blocks;
        // A link opens in the mail app's browser, which is often not the one that asked (a private window, another
        // device), so the code follows the button and the expiry line covers both.
        return [
            ...blocks.slice(0, 3),
            { type: "paragraph", text: "Or enter this code on the page where you asked:" },
            { type: "code", text: d.code },
            { type: "fine", text: `The link and the code work once and expire in ${d.expiresIn}.` },
            ...blocks.slice(4),
        ];
    },
};
/** Confirm an address. */
export const verification = {
    name: "verification",
    subject: (d) => d.copy?.subject ?? `Confirm your email address for ${d.brand.name}`,
    blocks: (d) => linkBlocks(d, {
        heading: "Confirm your email address",
        intro: `Someone used ${d.to} to register with ${d.brand.name}. Confirm the address to finish.`,
        button: "Confirm email address",
        ignore: "If this was not you, ignore this message. The address stays unconfirmed.",
    }),
};
/** Reset a password. */
export const reset = {
    name: "reset",
    subject: (d) => d.copy?.subject ?? `Reset your ${d.brand.name} password`,
    blocks: (d) => linkBlocks(d, {
        heading: "Reset your password",
        intro: `Someone asked to reset the password for ${d.to} on ${d.brand.name}. Use the button to choose a new one.`,
        button: "Reset password",
        ignore: "If this was not you, ignore this message. Your password has not changed.",
    }),
};
/**
 * One of an email change's two mails: `step: "current"` asks the account's current address to approve a change to
 * `newEmail`, then `step: "new"` asks the new address to confirm it (Better Auth's change-email flow, each link opening
 * site-runtime's `./sign-in` emailConfirmURL page, which acts only on its button). The link works until it expires,
 * not once, so this says only when it expires. The mail goes `to` the address it asks.
 */
export const emailChange = {
    name: "email-change",
    subject: (d) => d.copy?.subject ??
        (d.step === "current"
            ? `Approve the change to your ${d.brand.name} email address`
            : `Confirm your new ${d.brand.name} email address`),
    blocks: (d) => {
        const k = d.copy ?? {};
        const current = d.step === "current";
        if (current && !d.newEmail)
            throw new Error("emailChange: step current needs newEmail");
        return [
            {
                type: "heading",
                text: k.heading ??
                    (current ? "Approve the change to your email address" : "Confirm your new email address"),
            },
            {
                type: "paragraph",
                text: k.intro ??
                    (current
                        ? `Someone signed in to your ${d.brand.name} account asked to change its email address to ${d.newEmail}. If it was you, approve it here, then confirm from the new address.`
                        : `Confirm this address to finish moving your ${d.brand.name} account to it. Sign-in links will come here.`),
            },
            {
                type: "button",
                label: k.button ?? (current ? "Approve the change" : "Confirm this address"),
                url: d.url,
            },
            { type: "fine", text: `The link expires in ${d.expiresIn}.` },
            {
                type: "fine",
                text: k.ignore ??
                    (current
                        ? "If this was not you, ignore this message and your address stays as it is. Then sign in and check your passkeys and signed-in devices."
                        : "If you did not ask for this, ignore this message. Nothing changes unless the link is used."),
            },
        ];
    },
};
/** Something needs attention: a health check, a watchdog, a budget. The level is a word, never color alone. */
export const alert = {
    name: "alert",
    subject: (d) => d.copy?.subject ?? `${LEVEL_WORD[d.level]}: ${d.what}`,
    blocks: (d) => {
        const k = d.copy ?? {};
        const out = [
            { type: "heading", text: k.heading ?? d.what },
            { type: "note", level: d.level, text: k.intro ?? `${d.what} at ${d.when}.` },
            ...(d.details ?? []).map((text) => ({ type: "paragraph", text })),
            ...(d.pre ? [{ type: "pre", text: d.pre }] : []),
        ];
        if (d.url)
            out.push({ type: "button", label: k.button ?? "Open", url: d.url });
        return out;
    },
};
/**
 * A change to how a person signs in: what happened, when, the device and the place it came from, and what to do if it
 * was not them (NIST SP 800-63B-4 4.6). site-runtime's `./sign-in` gives `title`, `what` (null when the title says it all), `when`, `device`, `location`
 * and `secure` as its notice's `detail`; `url` is the product's own account page. The mail holds no link that signs in.
 */
export const securityNotice = {
    name: "security-notice",
    subject: (d) => d.copy?.subject ?? `${d.brand.name}: ${d.title}`,
    blocks: (d) => {
        const k = d.copy ?? {};
        const out = [
            { type: "heading", text: k.heading ?? d.title },
            ...((k.intro ?? d.what)
                ? [{ type: "paragraph", text: (k.intro ?? d.what) }]
                : []),
            { type: "fine", text: `When: ${d.when}` },
            ...(d.device ? [{ type: "fine", text: `Device: ${d.device}` }] : []),
            ...(d.location ? [{ type: "fine", text: `Near: ${d.location}` }] : []),
            { type: "note", text: d.secure },
        ];
        if (d.url)
            out.push({ type: "button", label: k.button ?? "Review your account", url: d.url });
        out.push({
            type: "fine",
            text: k.ignore ??
                "You get this email whenever your sign-in settings change. It has no sign-in link.",
        });
        return out;
    },
};
/** A plain message: a decision, a digest line, a change of terms. */
export const notice = {
    name: "notice",
    subject: (d) => d.copy?.subject ?? d.title,
    blocks: (d) => {
        const k = d.copy ?? {};
        const out = [
            { type: "heading", text: k.heading ?? d.title },
            ...(k.intro === undefined ? d.body : [k.intro, ...d.body.slice(1)]).map((text) => ({
                type: "paragraph",
                text,
            })),
        ];
        if (d.action)
            out.push({ type: "button", label: k.button ?? d.action.label, url: d.action.url });
        return out;
    },
};
