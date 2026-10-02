# Message

- Markup gains a leading `<svg class="cap-message-glyph" aria-hidden="true">` and `data-kind="ok|warning|failure"` on each `.cap-message-item`. `say()`/`fail()` and the React provider write them; an app that renders items by hand adds them.
- Look: items use the popover surface (radius `--radius-l`, `--shadow-m`); a failure's edge is critical, not warning. Padding follows `--pad-x`.
- New exports from `message.ts`: `kindOf`, `GLYPHS`, `MessageKind`. Behaviour (`z`, Undo, lasting messages, `say`, `fail`, props) is unchanged.
