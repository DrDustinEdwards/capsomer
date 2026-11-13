---
"capsomer": minor
---

The site header's letterhead and search, and the family links' site icons, leave the stylesheets every page loads, so a site that does not use them stops downloading them.

- **Changed contract:** `site-header.css` no longer styles the family letterhead (`data-variant="letterhead"`) or the header's search (`.cap-site-header-search`, `-search-panel`, `-results`). They are in the new `capsomer/site-header-letterhead.css` (5.4 KB gzip) and `capsomer/site-header-search.css` (1.6 KB gzip). A site whose header is the letterhead (the Capsid Portal, Carrel, dustinedwards.info, Enarratio, Foxhound) imports `site-header-letterhead.css` after `site-header.css`; a site with header search (dustinedwards.info, Carrel) also imports `site-header-search.css`. `site-header.css` drops from 13.4 to 8.4 KB gzip.
- **Changed contract:** `link.css` no longer draws a family site's icon (`a[data-link="family"]`, the turned-out arrow and one mask per `data-site`). It is in the new `capsomer/link-family.css` (2.5 KB gzip): a site whose prose has family links (Prelum writes `data-link="family"`) imports it after `link.css`. `link.css` drops from 4.6 to 2.5 KB gzip.
- `admin-all.css` imports the letterhead and search with the header, so a site on it sees no change.
