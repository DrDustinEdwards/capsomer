---
"capsomer": minor
---

The site header's stylesheet comes in parts, so a site can skip what its header does not draw. `site-header.css` is unchanged for the sites that load it: it now imports `site-header-frame.css` (everything a header has, 8.4 KB gzip), `site-header-letterhead.css` (the family letterhead, `data-variant="letterhead"`, 5.4 KB) and `site-header-search.css` (the header's search, 1.6 KB). A site whose header is not the letterhead and has no `search` (txasm, germomics, Foxing, bsw, julieedwards.info) loads `site-header-frame.css` in place of `site-header.css` and saves about 7 KB gzip on every page. No class or HTML contract changes.
