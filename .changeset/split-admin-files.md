---
"capsomer": patch
---

Smaller files in the admin family, with no change to any class, token, HTML contract or import path. `admin-shell.css` and `shell.css` each import the first part of their rules from a sibling (`capsomer/admin-shell-strip.css`, `capsomer/shell-rail.css`, new exports, bundled by the parent as before). The React wrappers of the admin shell, posts list, people and roles, and history list keep every export; the dialogs, filters, table, grid and lines they draw now live in sibling modules. `examples.html` `<!-- use:name -->` takes a quoted value (`key="a value"`).
