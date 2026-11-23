---
"capsomer": patch
---

Security: the media library, cited-by and record-facts draw an address as a link only when it is http(s) or a path on the site, so a stored `javascript:` or `data:` address shows as text. The patch view escapes a revision name and the compare and patch ids. Media copy snippets escape alt text, names and the address. The ask panel's source check uses site-runtime's `isSameOriginPath` (a `/\host` address is no longer same-origin). `catalogMarkdown` escapes link text and the address. The theme route reads its body to a 1 KB cap as it streams. `settingsFromForm` throws a `RangeError` for a malformed or negative cap instead of reading it as no cap. New export `linkable` in hooks.
