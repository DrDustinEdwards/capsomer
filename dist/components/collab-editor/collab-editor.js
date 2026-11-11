// The collab editor's parts that run anywhere, the room's server included: the shared copy as a Yjs
// document (load, patch, save, read its Markdown), the suggestion bookkeeping and the room's messages.
// The page's side (the room hook, the bar and the panels) is `capsomer/react/collab-editor`.
export { FRAGMENT, isSeeded, loadMarkdown, markdownOf, markSaved, patchMarkdown, readMeta, roomJson, roomMarkdown, roomSchema, } from "./collab-editor-doc.js";
export { listSuggestions, settle, suggestionCounts, suggestingDispatch, suggestionPlugins, } from "./collab-editor-suggest.js";
