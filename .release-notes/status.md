# Status and badge

- Markup is unchanged: `.cap-status`, `.cap-pill`, `.cap-status-glyph`, `.cap-status-reason`, `data-tone`.
- New: `.cap-badge` is an alias of `.cap-pill`; `data-variant="default|secondary|outline|destructive|ghost|link"` on it gives shadcn's six badge variants; a badge may be an `<a>` or a `<button>` (focus ring, hover, disabled, 24 px hit area).
- A pill with no `data-tone` and no `data-variant` is still the grey no-data tint.
- Look: the pill is 20 px high (was about 21) and follows density; the glyph is `1.15em` (word) or `1em` (badge) instead of 14 px; the gap is `--space-2` (4 px, was 6).
- React: `Pill` takes an optional `tone`, plus `variant`, `href` and `onClick`; `Badge` is the same component. `Status` is unchanged.
