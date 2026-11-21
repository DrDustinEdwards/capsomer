---
"capsomer": patch
---

The rich text cleaner reads a long run of unclosed `<a`, `<em` or `<!--` in linear time. Before, each opener scanned the rest of the text for a close that was not there, so the largest allowed input took about half a second and a loaded CI runner could miss the 2 s bound in its unit test. The output is unchanged.
