---
"capsomer": patch
---

Hero: the lead's type is set with longhands (`font-family`, `font-size`, `font-weight`, `line-height`). The old `font` shorthand ended in `var(--hero-lead-face, inherit)`; `inherit` is not valid inside a shorthand, so whenever a site left `--hero-lead-face` unset the browser dropped the whole declaration and the lead took the hero's own font size (40px on Foxhound's product pages). No token or class is removed or renamed and the HTML contract is unchanged; a site that worked around it by setting `--hero-lead-face` can drop the workaround or keep it.

`capsomer token-check` now also finds declarations the browser drops (a CSS-wide keyword such as `inherit` beside other values, written or reached through a var() fallback) and exits 1 on one. Raw-value warnings still never fail. New export: `invalidValues` from `capsomer/token-check`.
