---
"capsomer": minor
---

A table row that opens a detail now keeps every focusable element above its row link: `a[href]`, `button`, `input`, `select`, `textarea`, `summary`, `[tabindex]` (a tooltip trigger), `[role="button"]` and `.cap-check`, plus anything marked `data-cap-lift`. Before, only links, buttons and checkboxes were lifted, so a tabindex element's hover went to the row link.
