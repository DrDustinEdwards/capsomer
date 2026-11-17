---
"capsomer": minor
---

Disclosure: `Group` takes `body="list"` for rows that are a whole list of their own (a `RowList`). The rows sit in a `<div class="cap-group-rows">` in place of the group's `<ul>`, so they keep the row list's look and keys. The default (`<li>` children in `ul.cap-group-rows`) is unchanged. A new state, "Group holding a row list", shows it.
