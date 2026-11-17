---
"capsomer": patch
---

Dialog: a dialog form's touched marks (`data-cap-dirty`) are now cleared when the dialog closes and when its form is reset, so a dialog reopened after Save or Cancel no longer ignores the backdrop and a swipe down with no unsaved input. A control changed back to its default value still counts as touched. No token, class or HTML contract is removed or renamed.
