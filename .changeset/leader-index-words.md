---
"capsomer": patch
---

`.cap-leader-index-name` and `.cap-leader-index-fact` wrap at word boundaries and keep the width of their longest word: `overflow-wrap: anywhere` with `min-inline-size: 0` let flexbox shrink a name to a few characters before the dotted leader, breaking words mid-word at phone width ("plo|t"). They now use `overflow-wrap: break-word` and `min-inline-size: min(min-content, 100%)`, so the leader gives way first and only a word wider than the row breaks. No class or HTML contract changes.
