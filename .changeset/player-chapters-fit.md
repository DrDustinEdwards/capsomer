---
"capsomer": patch
---

The player's chapter list (`.cap-player-chapters`) is one shrinkable column (`grid-template-columns: minmax(0, 1fr)`). Before, a long chapter title widened the list past a phone's screen and the page scrolled sideways; the title now ellipsizes inside the row. No class or token is removed or renamed and the HTML is unchanged.
