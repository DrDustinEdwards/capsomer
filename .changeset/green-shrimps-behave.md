---
"capsomer": patch
---

Media: the files over the size cap are split along their seams, with no change to what they draw or do. `capsomer/media-grid.css` (the toolbar, groups, tiles and list layout, `.cap-media-*`) is split out of media.css, which imports it, so `capsomer/media.css` gives the same rules as before; no class is renamed or removed. The behavior, the React inspector, the library page and their specs and specimen are in smaller files, and every existing import path stays.
