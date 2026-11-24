---
"capsomer": patch
---

Leftover code-review cleanups. The React DropZone now runs the behavior module instead of a second copy. Authorship remembers its choice through `useRemembered`. The player's sliders use the shared Range, and its chapter lists share one list. Status glyphs for scripted rows come from the status component (`glyphEl`, `statusEl`) instead of five copies; `glyph` is no longer exported from the media module. `confirmRemove(form, perform?)` serves both people-roles forms. The message provider shares its Undo steps and timers with the script. A popover without a title is named by its trigger.
