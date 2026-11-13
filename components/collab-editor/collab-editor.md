---
name: collab-editor
title: Collab editor
summary: Several people in one file at once, around the rich editor: a shared Yjs copy, each person's caret in their color, Editing or Suggesting with tracked changes, comment threads on passages, and the bar and panels that show them.
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

**Provenance.** EXTRACTED from Carrel's file rooms: the shared copy (`collab-editor-doc.ts`: load, patch from Markdown, mark saved, read the Markdown a save writes), tracked changes with who, round and when (`collab-editor-suggest.ts`), the carets, suggesting and comment-mark extensions, the room hook over y-partyserver, the room bar, and the suggestions and comments panels. REWROTE the classes (`app-room-*`, `app-caret*`, `app-thread*`, `app-comment*`, `app-suggestion*` became `cap-collab-*`), the hook-up to the editor (`useRichRoom` builds the rich editor's `room`, so the editor carries no Yjs), the viewer (no app roles: `access` and `deletesAny`), and the person's choices (mode and round come from the app, which remembers them where it keeps its other choices). The room's server, who may enter and the storage stay in the app.

## When to use it

For a file several people open at once, where each sees the others' work as it happens, and a person who may only suggest makes tracked changes an editor accepts or rejects.

## When not to

One person writing alone uses the rich editor without a room. Review after the fact, not live, is the draft compare.

## The default and its reason

- **One copy, kept the same by Yjs**, which the app's room (a y-partyserver Durable Object) holds and the editors bind to. The editor is made only once the copy has arrived, so it never writes an empty document into the room. A change the room refuses starts this page again from the room's copy, and says why.
- **The save writes the text as if every pending suggestion were rejected** (`settle`), so nothing suggested reaches a site or a repository until someone accepts it. Blocks the save did not change keep their bytes, as the rich editor's do.
- **A caret's name is the room's word**, looked up by Yjs client id in the room's list of people, never what the other browser says; a caret the room does not list is not drawn. Each person has one of the eight series colors, the same on every screen (`personSlot`).
- **Suggesting**: insertions underlined, deletions struck through, in the text color on a tint, so the line, not hue alone, says which (WCAG 1.4.1). Source blocks are read-only while suggesting, because Markdown cannot carry the marks.
- **Comment threads sit on passages** by Yjs relative positions, so they stay put as people type; a thread whose text is gone says so.
- **Unload is pagehide.** The sites' Permissions-Policy forbids `unload`; the provider's listener is moved to `pagehide`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the bar (Editing, Suggesting), the text, then the panels' fields and buttons |
| Left arrow, Right arrow (bar) | Changes between Editing and Suggesting |
| Enter (comment field) | A new line; Send posts it |

Everything in the text is the rich editor's keyboard.

## Accessibility

- The bar's line ("Only you are here.", "Sam Lee is here too.", Offline, Connecting) is a status region. The others' avatars are a group named "Also here: …".
- Carets are drawn decorations; the names are in the bar's line, so nothing depends on seeing a caret.
- Suggestions and comments are listed in panels, in reading order, with who and when; Accept, Reject, Resolve and Delete are buttons with names. A thread chosen in the text takes focus in its panel.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

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

The server side: `import { loadMarkdown, patchMarkdown, roomMarkdown, markSaved, settle } from "capsomer/behavior/collab-editor"`.

Peers (optional): `yjs`, `y-protocols`, `y-partyserver`, `@tiptap/extension-collaboration`, `@tiptap/y-tiptap`, `@handlewithcare/prosemirror-suggest-changes`, plus the rich editor's.
