---
"capsomer": minor
---

collab-editor: `suggestions(schema, json)` replaces `suggestionCounts`. It gives each person's suggested changes (kind, id and text, a split run joined again) rather than a character count, so a room's suggest gate (site-runtime doc-room) can refuse a change to someone else's suggestion that keeps its length. Removed: `suggestionCounts`.
