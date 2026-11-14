---
"capsomer": patch
---

A row's title wraps in full in a narrow list again, as row-list.md says. The narrow rule (`.cap-row-title :is(a, button)`) was weaker than the two-line clamp it lifts (`.cap-row-title :is(a, button, .cap-row-text)`, which counts as a class), so phone titles stayed cut at two lines with an ellipsis. It now names the same three. No token, class or HTML contract changes.
