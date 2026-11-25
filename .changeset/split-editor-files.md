---
"capsomer": patch
---

Splits the markdown editor, rich editor, field, combobox and listbox files that passed the size cap along their seams; every export keeps its path and no class, token or HTML contract changes. `field.css` now imports its frame (label, help, error, the layouts of fields) from `field-frame.css`, which is a new export beside `check.css`.
