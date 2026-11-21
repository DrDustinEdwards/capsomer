---
"capsomer": patch
---

A chart with a narrow drawing (narrowRedraw) now scales its wide drawing to the narrow one's height until the swap, on a site that loads Enarratio's own CSS unlayered. Before, Enarratio's unlayered `min-width` beat the layered rule, so the page moved when the swap came (germomics' Soho map, 615 px to 387 px).
