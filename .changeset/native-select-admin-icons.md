---
"capsomer": patch
---

RatingInput draws `NativeSelect` (components/select/select-native.react.tsx), the select markup without select.ts, so a page with a rating no longer ships the custom select's script it never runs. `Select` renders `NativeSelect` and adds the popup; its props and HTML contract are unchanged.

Admin shell icons set `--icon-stroke: 1.6` on themselves. Since 0.151.0, settings-row.css imports icons.css after admin-shell.css, so `.cap-icon`'s `var(--icon-stroke)` won and a site that sets `--icon-stroke: 2` (Foxhound) drew its admin menu icons at 2.
