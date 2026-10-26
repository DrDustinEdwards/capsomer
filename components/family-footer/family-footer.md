---
name: family-footer
title: Family footer
summary: The foot every dustinedwards.info site closes with, under its own footer: the band in the site's color, the name, the profiles, the workspace logins and the site links.
parts: [css, behavior]
tool: native + own JavaScript
states: [on dustinedwards.info, under Capsid's footer, under Capsomer's footer]
added: 0.25.0
source: dustinedwards-info app/components/shell-footer.tsx, app/lib/footer.ts and the footer rules in app/styles/shell.css
replaces:
  - "\\.footer-social-link|\\.footer-private-lock|\\.site-shell-footer-note"
---

# Family footer

dustinedwards.info's footer, shared: dustinedwards.info, Capsid's public site and Capsomer's public site all end with it, the last two under their own footer (Dustin, 2026-10-26). The band at its top is the manual theme's livery in the page family's `--on`, so each site draws it in its own color: purple, teal, magenta. The letterhead's heavy rule is left off.

## Use

```ts
import { familyFooterHtml } from "capsomer/behavior/family-footer";
import "capsomer/manual.css"; // the band and the letterhead
import "capsomer/family-footer.css";

// On another site: the family's paths point at https://dustinedwards.info.
footer.insertAdjacentHTML("beforeend", familyFooterHtml());
// On dustinedwards.info itself: its own paths, and the Accessibility link only while that page is published.
familyFooterHtml({ origin: "", published: PUBLISHED_PAGES });
```

The links are data too (`SOCIAL_LINKS`, `PROFILE_LINKS`, `WORKSPACE_LINKS`, `siteLinks()`, `familyLinks()`), so dustinedwards.info's tests hold every path against its routes and the `rel="me"` set against its owner's profiles.

## Accessibility

- The Workspace and Site groups are `nav` landmarks named by their headings.
- Each social link's name is its text, hidden until hover or focus but never `display: none`.
- Each login's accessible name begins with its visible word and ends "(requires sign-in)".
- The band and every icon are `aria-hidden`.
