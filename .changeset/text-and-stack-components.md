---
"capsomer": minor
---

**React `Title`, `Text` and `Stack`.** `capsomer/react/text` exports `Title` (`size` 1 to 6, `as`) and `Text` (`size`, `tone`, `weight`, `face`, `align`, `as`), which render `.cap-title` and `.cap-text` with their data attributes; `capsomer/react/stack` exports `Stack` (`gap` 1 to 9, `as`), which renders `.cap-stack`. A page that repeats the class and data attributes on every line carries that text in its server bundle every time; a component carries it once (txasm's Worker was 5.8 KiB over its size budget from this). No CSS changes and no class or attribute renamed or removed.
