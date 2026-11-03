// The accessibility statement at /accessibility/, written into site/accessibility.html at build (site/vite.config.ts) from
// Prelum's accessibilityStatement, the one statement every public site serves (devkit-a11y item S6). Only the facts are
// this site's: it is built from Capsomer and draws Capsomer's links, problems go to dustinedwards.info's contact page (the
// site has none of its own), and the limitations are the open findings of devkit-a11y's run of 2026-11-01.
import { accessibilityStatement } from "@drdustinedwards/site-helpers/accessibility";
import { FOOTER, header, runningHead } from "./home.ts";

const STATEMENT = accessibilityStatement({
  siteName: "Capsomer's site",
  contact: { href: "https://dustinedwards.info/contact", label: "the contact page on dustinedwards.info" },
  date: "2026-11-01",
  capsomer: true,
  links: "marked",
  limitations: [
    "On the admin shell's page, one example's frame has an accessible name that does not begin with its visible label.",
    "In the theme builder, the corner radius slider shows no visible focus.",
    "The page for an address that does not exist has no skip link as its first Tab stop.",
  ],
});

export const ACCESSIBILITY_PAGE = { path: "/accessibility/", title: STATEMENT.title, description: STATEMENT.description };

/** The statement in the site's letterhead, running head and footer. */
export function renderAccessibility(version: string): string {
  return `${header("/", "")}
<main id="main" tabindex="-1">
${runningHead("", "Accessibility", `Release ${version}`)}
<div class="cap-page statement-page">
  <h1 class="statement-title">${STATEMENT.title}</h1>
  ${STATEMENT.html}
</div>
</main>
${FOOTER}`;
}
