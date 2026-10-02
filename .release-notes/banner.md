# Banner and alert

- Markup from 0.1 keeps working (`.cap-banner`, `.cap-banner-text`, `.cap-banner-actions`, `.cap-alert`, `.cap-alert-text`, the glyph, `data-tone`).
- New: `data-tone="neutral|info|ok"` on both; `.cap-banner-body` / `.cap-alert-body` holding an optional `.cap-banner-title` / `.cap-alert-title` above the text; `.cap-alert-action`.
- Look: `.cap-alert` is now a bordered box on the tone's tint (was bare critical text). An alert beside a field gains a border, padding and a top margin; check the layout around it. Both are `--radius-l` and follow `--pad-x`.
- An alert with no `data-tone` is critical; a banner with no `data-tone` is a warning (both as before). React: `Banner` and `Alert` take `tone` (all five) and `title`; `Alert` gains `tone`, wraps `action` in `.cap-alert-action`, and renders a `title` in a body.
