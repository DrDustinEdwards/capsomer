---
"capsomer": patch
---

`.cap-leader-index-link` wraps (`flex-wrap: wrap`), and `.cap-leader-index-fact` takes `margin-inline-start: auto`: when a row's name and fact cannot sit side by side at their longest words, the fact drops to its own line at the row's end. Since 0.155.1 such a row (a phone, a long path as the fact) ran past the screen and scrolled the page sideways, and in an auto grid track the index widened its column. No class or HTML contract changes.
