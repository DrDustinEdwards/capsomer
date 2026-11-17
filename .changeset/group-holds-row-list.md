---
"capsomer": minor
---

Disclosure: `Group` takes `body="list"` for rows that are a whole list of their own (a `RowList`). The rows sit in a `<div class="cap-group-rows">` in place of the group's `<ul>`, so they keep the row list's look and keys. The default (`<li>` children in `ul.cap-group-rows`) is unchanged. A new state, "Group holding a row list", shows it.

Bulk action bar: a `BulkBarAction` takes `handOff(items)` for an app whose own flow does the whole action (a server preview and its own confirm and message). The bar hands it the selection and says nothing itself; `run`, the confirm fields, `said` and `undo` are not used.

Row list: `Row` takes `id`, the row's own id, so a link from elsewhere (a push alert) can land on it.

Two stylesheets split out so a page loads only what it draws: `capsomer/group.css` (the group row, `.cap-group*`, from disclosure.css) and `capsomer/check.css` (the checkbox and radio, `.cap-check`, from field.css). `disclosure.css` and `field.css` `@import` them, so a page importing either gets the same rules as before; no class is renamed or removed.

Row list: a control in a row's media column (a checkbox, its label, a button) sits above the row's stretched link, so pressing it ticks the box instead of opening the row.

Row list: in a narrow column (a phone) a row's detail wraps in full, as its title already did, instead of being cut at two lines.
