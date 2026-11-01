---
name: family-footer
title: Family footer
summary: The one footer of every dustinedwards.info site: the site's own part under a thin stripe, the strip of the family's sites, then the double stripe over the name, the profiles, the workspace logins and the site links.
parts: [css, behavior]
tool: native + own JavaScript
states: [on dustinedwards.info, on Capsid with its own part, on Capsomer with its own part]
added: 0.25.0
source: dustinedwards-info app/components/shell-footer.tsx, app/lib/footer.ts and the footer rules in app/styles/shell.css
replaces:
  - "\\.footer-social-link|\\.footer-private-lock|\\.site-shell-footer-note"
---

# Family footer

The one footer of every dustinedwards.info site (Dustin, 2026-10-26), set out as NASA's agency and its centers. A thin stripe in the page's color opens the site's own part: its name, what it is, its links and a stamp. Under it, the strip of the family's sites, each marked in its family's color (`--family-<name>`, tokens/family-marks.css), with the one you are on carrying a heavy top edge. Then the double stripe (the manual theme's livery) over dustinedwards.info's letterhead: the name, the profiles, the workspace logins, the site links and the copyright. Both stripes are the page family's `--on`. The letterhead's heavy rule is left off.

## Use

```ts
import { familyFooterHtml } from "capsomer/behavior/family-footer";
import "capsomer/manual.css"; // the double stripe and the letterhead
import "capsomer/family-footer.css";

// On another site: its own part, and the family's paths point at https://dustinedwards.info.
footer.innerHTML = familyFooterHtml({ site: "capsid", center });
// On dustinedwards.info itself: its own paths, and the Accessibility link only while that page is published.
familyFooterHtml({ site: "dustinedwards", origin: "", published: PUBLISHED_PAGES });
// A site that serves its own accessibility statement: the Site group's Accessibility link goes to it.
familyFooterHtml({ site: "capsid", center, statement: "/accessibility" });
```

A statement speaks for one site, so a site with its own `/accessibility` (Prelum's `accessibilityStatement`) passes `statement`; the other Site links stay dustinedwards.info's.

`center` is the site's own HTML, built from these classes:

```html
<div class="cap-family-footer-center">
  <div><p class="cap-family-footer-center-name">Capsid</p><p class="cap-family-footer-about">What it is.</p></div>
  <div class="cap-family-footer-columns">
    <ul class="cap-family-footer-links"><li><a href="/tools">Tools</a></li></ul>
    <!-- up to three groups, on the letterhead's columns -->
  </div>
  <p class="cap-family-footer-stamp"><span>Data as of 2026-10-26</span></p>
</div>
```

The links are data too (`SOCIAL_LINKS`, `PROFILE_LINKS`, `WORKSPACE_LINKS`, `siteLinks()`, `familyLinks()`, `FAMILY_SITES`), so dustinedwards.info's tests hold every path against its routes and the `rel="me"` set against its owner's profiles. A new site joins `FAMILY_SITES`, and its family gets a `[data-family-mark]` line in family-footer.css.

## Accessibility

- The strip of sites, the Workspace and the Site groups are `nav` landmarks named by their headings; the site you are on is `aria-current="page"`.
- The site you are on is marked by a heavier border, not by color alone, so it holds in forced colors.
- Each social link's name is its text, hidden until hover or focus but never `display: none`.
- Each login's accessible name begins with its visible word and ends "(requires sign-in)".
- The stripes and every icon are `aria-hidden`.
