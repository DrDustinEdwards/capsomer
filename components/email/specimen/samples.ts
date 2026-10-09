// Sample mails for the states page. Invented, with an obviously fake token. Each frame is the
// real renderEmail output in an iframe. A frame forced to light drops the dark rules; one forced
// to dark applies them whatever the page's own scheme, so both show on one page.
import { alert, magicLink, notice, renderEmail, reset, verification, type Common } from "../email.ts";

const common: Common = { brand: { name: "Carrel", family: "purple" }, to: "reader@example.com" };
const link = { url: "https://carrel.example/auth/verify?t=EXAMPLE-NOT-A-TOKEN", expiresIn: "15 minutes" };

const SAMPLES: Record<string, () => string> = {
  magicLink: () => renderEmail(magicLink, { ...common, ...link }).html,
  verification: () => renderEmail(verification, { ...common, ...link }).html,
  reset: () => renderEmail(reset, { ...common, ...link }).html,
  alert: () =>
    renderEmail(alert, {
      ...common,
      level: "crit",
      what: "Backups have not run for 26 hours",
      when: "08:15 UTC on 8 October",
      details: ["The nightly backup job failed twice. The last good copy is from 6 October."],
      url: "https://carrel.example/admin/health",
    }).html,
  notice: () =>
    renderEmail(notice, {
      ...common,
      title: "Your drafts moved",
      body: ["Drafts now live under Writing in the sidebar.", "Nothing was deleted, and the links you shared still work."],
      action: { label: "Open Writing", url: "https://carrel.example/writing" },
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
