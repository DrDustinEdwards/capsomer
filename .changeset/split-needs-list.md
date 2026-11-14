---
"capsomer": minor
---

- **Breaking: the work queue's rules are `capsomer/needs-list.css`, no longer part of `attention-list.css`.** The Portal's Problems list shipped the work queue's rules for nothing, and Carrel's Home (a work queue) shipped the attention list's frame. The rules are unchanged and the new file stands alone. A site that draws `NeedsList` (`.cap-need-group`, `.cap-need-head`, `.cap-need-rows`, `.cap-need-count`, `.cap-need-row`, `.cap-need-keys`, `.cap-need-key`) adds `import "capsomer/needs-list.css"` beside `row-list.css` (Carrel's Home), and can drop `attention-list.css` if it draws no `AttentionList`. No token, class or HTML contract changes.
