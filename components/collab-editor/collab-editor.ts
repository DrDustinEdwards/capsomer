// The collab editor's parts that run anywhere, the room's server included: the shared copy as a Yjs
// document (load, patch, save, read its Markdown), the suggestion bookkeeping and the room's messages.
// The page's side (the room hook, the bar and the panels) is `capsomer/react/collab-editor`.

export {
  FRAGMENT,
  isSeeded,
  loadMarkdown,
  markdownOf,
  markSaved,
  patchMarkdown,
  readMeta,
  roomJson,
  roomMarkdown,
  roomSchema,
  type Patched,
  type RoomMeta,
} from "./collab-editor-doc.ts";
export type {
  ClientMessage,
  RoomComment,
  RoomPerson,
  RoomViewer,
  ServerMessage,
} from "./collab-editor-protocol.ts";
export {
  listSuggestions,
  settle,
  suggestionCounts,
  suggestingDispatch,
  suggestionPlugins,
  type JsonDoc,
  type Suggester,
  type Suggestion,
} from "./collab-editor-suggest.ts";
