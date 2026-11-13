---
name: collab-editor
title: Collab editor
summary: "Several people in one file at once, around the rich editor: a shared Yjs copy, each person's caret in their color, Editing or Suggesting with tracked changes, comment threads on passages, and the bar and panels that show them."
group: pattern
parts: [css, behavior, react]
tool: own JavaScript (Yjs, y-partyserver, prosemirror-suggest-changes; all MIT)
states: [two people in one copy, suggesting, suggestions waiting, a comment thread on a passage, offline, connecting, only you]
added: 0.95.0
source: Carrel, app/lib/editor/collab.ts, suggest.ts, room-protocol.ts, app/components/editor/room-extensions.ts, use-room.ts, room-bar.tsx, comments-panel.tsx, suggestions-panel.tsx, room-editing.tsx and app/app.css (the room rules)
replaces:
  - 'from "y-partyserver/provider"'
  - 'from "@handlewithcare/prosemirror-suggest-changes"'
  - 'class="app-room-bar"'
---

# Collab editor

## Usage

```tsx
import "capsomer/collab-editor.css";
import { RichEditor } from "capsomer/react/rich-editor";
import { useRoomEditing } from "capsomer/react/collab-editor";

const editing = useRoomEditing({
  path: "/rooms/12/getting-started",
  initial: markdown,
  unsaved: false,
  viewer: { id: 7, name: "Alex Rivera", access: "edit" },
  names: { 7: "Alex Rivera", 9: "Sam Lee" },
  hideFrontMatter: true,
  mode, onMode: setMode, round, onRound: setRound,
});

{editing.bar}
{editing.rich ? (
  <RichEditor key={editing.rich.key} room={editing.rich} onReady={(h) => editing.setEditor(h.editor)} ... />
) : null}
{editing.panels}
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the bar (Editing, Suggesting), the text, then the panels' fields and buttons |
| Left arrow, Right arrow (bar) | Changes between Editing and Suggesting |
| Enter (comment field) | A new line; Send posts it |

Everything in the text is the rich editor's keyboard.

- The bar's line ("Only you are here.", "Sam Lee is here too.", Offline, Connecting) is a status region. The others' avatars are a group named "Also here: …".
- Carets are drawn decorations; the names are in the bar's line, so nothing depends on seeing a caret.
- Suggestions and comments are listed in panels, in reading order, with who and when; Accept, Reject, Resolve and Delete are buttons with names. A thread chosen in the text takes focus in its panel.
