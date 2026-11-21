---
"capsomer": minor
---

`Document`'s `script` prop is now an object, `{ src, integrity, crossOrigin }`, which is what devkit's `SITE_SCRIPT` (`virtual:islands`) holds, so the page's script tag carries the integrity Integrity-Policy needs. It was a path string (`"/site.js"`); pass `SITE_SCRIPT` instead.
