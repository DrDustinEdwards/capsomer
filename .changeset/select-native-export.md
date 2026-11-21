---
"capsomer": minor
---

`capsomer/react/select-native` exports `NativeSelect`: the select markup with the browser's own select and no popup, so a page that only wants that leaves select.ts, the listbox and the popover out of its script (about 11 KB gzip on Foxing's pages). Same props and HTML contract as `<Select native>`. No removed or renamed token or class.
