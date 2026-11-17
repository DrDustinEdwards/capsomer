---
"capsomer": minor
---

Collab editor: `loadMarkdown` takes `doc`, the editor's JSON, in place of the Markdown it reads, so a room can be loaded with a document brought in from elsewhere (a Google Doc) together with its pending suggestions. New `anchorAt(ydoc, from, to)` gives a comment thread's anchor on the room's server, the same relative positions an editor's selection gives. No token, class or HTML contract changed.
