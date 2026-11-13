---
"capsomer": minor
---

**The layout classes and the text roles come in parts, so a site can load only what it uses.** `layout.css` and `text.css` are unchanged for the sites that load them: each now imports its parts. New stylesheets:

- `capsomer/layout-stack.css`: `.cap-stack`, its `data-align` and a button or check straight in a stack.
- `capsomer/layout-cluster.css`: `.cap-cluster`, its `data-justify`, and `.cap-push`.
- `capsomer/layout-spread.css`: `.cap-spread`.
- `capsomer/layout-grid.css`: `.cap-grid` and `data-cols`.
- `capsomer/layout-panes.css`: `.cap-panes`, `data-flip` and `data-even`.
- `capsomer/layout-items.css`: `.cap-measure`, `.cap-grow`, `.cap-shrink`, `.cap-keep`, `.cap-full` and `.cap-column`.
- `capsomer/layout-gap.css`: every layout's `data-gap` and a cluster's or spread's `data-align`, which a site loading the layout parts loads with them.
- `capsomer/text-role.css`: `.cap-text` and its attributes.
- `capsomer/text-title.css`: `.cap-title`.
- `capsomer/text-clamp.css`: `.cap-clamp`.

A site that uses a few loads those parts in place of `layout.css` or `text.css` (the Capsid Portal: stack, cluster, panes and the text roles). **Removed from `base.css`:** the older copy of `.cap-clamp` that `css/utilities.css` kept beside `text.css`'s since 0.127.0. A page that loads `text.css` (or `text-clamp.css`) clamps as before, and one that uses `.cap-clamp` without it now needs that import. No class is renamed and no HTML contract changes.
