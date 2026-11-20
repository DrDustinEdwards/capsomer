---
"capsomer": patch
---

`capsomer/behavior/chart-enhance` exports `enhanceFrames` and `watchFrames`, where it exported `enhanceCharts` and `watchCharts`: they enhance the frames Capsomer draws, not the charts Enarratio's functions of those names find, and the two packages no longer export one name for two jobs. Importing the module for its effect is unchanged; nothing in the network imported the old names.
