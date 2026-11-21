---
"capsomer": minor
---

Every design value is a token, and the check now fails on one. Print's paper colors are `--paper`, `--paper-ink` and `--paper-rule` (`--print-rule` is gone), blurs are `--blur-s`, `--blur-m`, `--blur-l` and `--blur-xl`, and the fade masks use `CanvasText` instead of `#000`. `capsomer token-check` no longer skips print blocks or masks, also reads blurs, `text-underline-offset` and `border-spacing`, and `--strict` makes a raw value exit 1 (Capsomer's own CI uses it). A component's own geometry (width, height, grid tracks) stays literal, as DEFAULTS.md says.
