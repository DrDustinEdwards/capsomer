---
"capsomer": patch
---

Mythos review round 5. The rich text cleaner reads at most 50,000 characters (`RICH_TEXT_MAX_INPUT`) and drops the rest, because its tag scan is quadratic on a long run of `<a` with no `>` or of `<!--` with no `-->`. No field holds that much.
