---
"capsomer": patch
---

ErrorPage draws its own skip link to main when it gets no `siteHeader`, so a 404 on a site with no header of its own has a skip link as its first Tab stop. The dustinedwards site layer sets `--z-skip: 1000`, above its pinned bar's `--z-sticky: 100`, so the focused skip link is no longer covered by the header.
