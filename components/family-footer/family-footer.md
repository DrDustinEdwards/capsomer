---
name: family-footer
title: Family footer
summary: "The one footer of every dustinedwards.info site, with the family strip, profiles and legal links."
group: pattern
parts: [css, behavior]
tool: native + own JavaScript
states: [on dustinedwards.info, on Capsid with its own part, on Capsomer with its own part]
added: 0.25.0
source: dustinedwards-info app/components/shell-footer.tsx, app/lib/footer.ts and the footer rules in app/styles/shell.css
replaces:
  - "\\.footer-social-link|\\.footer-private-lock|\\.site-shell-footer-note"
---

# Family footer

## Usage

```ts
import { familyFooterHtml } from "capsomer/behavior/family-footer";
import "capsomer/manual.css"; // the double stripe and the letterhead
import "capsomer/family-footer.css";

// On another site: its own part, and the family's paths point at https://dustinedwards.info.
footer.innerHTML = familyFooterHtml({ site: "capsid", center });
// On dustinedwards.info itself: its own paths, and the Accessibility link only while that page is published.
familyFooterHtml({ site: "dustinedwards", origin: "", published: PUBLISHED_PAGES });
// A site that serves its own accessibility statement: the Legal group's Accessibility link goes to it.
familyFooterHtml({ site: "capsid", center, statement: "/accessibility" });
```

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

## Accessibility

- The strip of sites, the Workspace, Site and Legal groups are `nav` landmarks named by their headings; the site you are on is `aria-current="page"`.
- The site you are on is marked by a heavier border, not by color alone, so it holds in forced colors.
- Each social link's name is its text, hidden until hover or focus but never `display: none`.
- Each login's accessible name begins with its visible word and ends "(requires sign-in)".
- The stripes and every icon are `aria-hidden`.
