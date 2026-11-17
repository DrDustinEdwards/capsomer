---
"capsomer": minor
---

Disclosure: `Group` takes `body="list"` for rows that are a whole list of their own (a `RowList`). The rows sit in a `<div class="cap-group-rows">` in place of the group's `<ul>`, so they keep the row list's look and keys. The default (`<li>` children in `ul.cap-group-rows`) is unchanged. A new state, "Group holding a row list", shows it.

Bulk action bar: a `BulkBarAction` takes `handOff(items)` for an app whose own flow does the whole action (a server preview and its own confirm and message). The bar hands it the selection and says nothing itself; `run`, the confirm fields, `said` and `undo` are not used.

Row list: `Row` takes `id`, the row's own id, so a link from elsewhere (a push alert) can land on it.
