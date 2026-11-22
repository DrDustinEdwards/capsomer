---
"capsomer": patch
---

Removes the `isTypingKey` re-exports from `history-list` and `moderation-queue` (import it from `row-list`) and `attachListKeys` from `history-list` (use `attachRowList` from `row-list`). Adds `enhanceEach` and `listenInto` to `hooks`, which replace three copies of the enhance loop and three of the listener helper.
