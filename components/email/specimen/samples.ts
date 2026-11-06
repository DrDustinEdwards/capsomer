// Sample mails for the states page. Invented, with an obviously fake token. Each frame is the
// real renderEmail output in an iframe. A frame forced to light drops the dark rules; one forced
// to dark applies them whatever the page's own scheme, so both show on one page.
import { alert, emailChange, magicLink, notice, renderEmail, reset, securityNotice, verification, type Common, type Template } from "../email.ts";

const common: Common = { brand: { name: "Example Co", family: "purple" }, to: "reader@example.com" };
const link = { url: "https://app.example.com/auth/verify?t=EXAMPLE-NOT-A-TOKEN", expiresIn: "15 minutes" };

// A product's own template from the same blocks: a digest with a section heading, ruled rows, a bold figure, a
// sign-off in two lines and a preformatted excerpt.
const digest: Template<{ week: string }> = {
  name: "digest",
  subject: (d) => `Your weekly summary, ${d.week}`,
  blocks: (d) => [
    { type: "heading", text: "Your weekly summary" },
    { type: "paragraph", text: [["You kept ", { bold: "12 readers" }, ` in the week of ${d.week}.`]] },
    { type: "subheading", text: "Readers" },
    {
      type: "rows",
      rows: [
        { label: "Opened a mail", value: "48" },
        { label: "Signed in on a new device", value: "3" },
        { label: "Asked for a new sign-in link, then did not use it", value: "5" },
      ],
    },
    { type: "subheading", text: "Last error" },
    { type: "pre", text: "Error: mail to reader@example.com was refused\n    at send (mail.js:41)\n    at run (cron.js:9)" },
    { type: "paragraph", text: ["Thanks,", "Example Co"] },
  ],
};

const SAMPLES: Record<string, () => string> = {
  digest: () => renderEmail(digest, { ...common, week: "October 26" }).html,
  magicLink: () => renderEmail(magicLink, { ...common, ...link }).html,
  magicLinkCode: () => renderEmail(magicLink, { ...common, ...link, code: "000000" }).html,
  verification: () => renderEmail(verification, { ...common, ...link }).html,
  reset: () => renderEmail(reset, { ...common, ...link }).html,
  emailChangeCurrent: () =>
    renderEmail(emailChange, { ...common, url: link.url, expiresIn: "1 hour", step: "current", newEmail: "new-reader@example.com" }).html,
  emailChangeNew: () =>
    renderEmail(emailChange, { ...common, to: "new-reader@example.com", url: link.url, expiresIn: "1 hour", step: "new" }).html,
  alert: () =>
    renderEmail(alert, {
      ...common,
      level: "crit",
      what: "Backups have not run for 26 hours",
      when: "08:15 UTC on October 8",
      details: ["The nightly backup job failed twice. The last good copy is from October 6."],
      url: "https://app.example.com/admin/health",
    }).html,
  notice: () =>
    renderEmail(notice, {
      ...common,
      title: "Your drafts moved",
      body: ["Drafts now live under Writing in the sidebar.", "Nothing was deleted, and the links you shared still work."],
      action: { label: "Open Writing", url: "https://app.example.com/writing" },
    }).html,
  securityNotice: () =>
    renderEmail(securityNotice, {
      ...common,
      title: "A passkey from Apple Passwords was added to your account",
      when: "October 31, 2026 at 1:52 AM UTC",
      device: "Safari on iPhone",
      location: "Portland, Oregon, United States",
      secure: "If this was not you, sign in now, remove any passkey or sign-in method you do not recognize, and sign out of every other device.",
      url: "https://app.example.com/account",
    }).html,
};

const DARK_RULES = /@media \(prefers-color-scheme: dark\)\{[\s\S]*?\n\}\n/;

export function renderSamples(root: ParentNode = document): void {
  for (const frame of root.querySelectorAll<HTMLIFrameElement>("iframe[data-email]")) {
    const html = SAMPLES[frame.dataset.email ?? ""]?.();
    if (html === undefined) throw new Error(`no sample for ${frame.dataset.email}`);
    frame.style.setProperty("inline-size", `${frame.dataset.width ?? "600"}px`);
    frame.srcdoc = frame.dataset.scheme === "light" ? html.replace(DARK_RULES, "") : html.replace("@media (prefers-color-scheme: dark)", "@media all");
  }
}
