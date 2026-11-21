---
"capsomer": patch
---

ChartFrame measures its column before the first paint, so a chart drawn in the browser (a heat strip, which keeps its own height) is not shown at the server's width and then redrawn taller, which moved the page.
