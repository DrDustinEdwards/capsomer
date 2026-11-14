---
"capsomer": patch
---

`useConfirmAction` and the `ConfirmAsk` type are back in `capsomer/react/confirm-dialog`. 0.151.0 removed them as unused, but Carrel's editor, book file and project flags pages use them (Carrel was on 0.145 when the audit looked).

`AiEngineSettings`: `efforts` and `effortOptions` are optional again. Left out, the table has no Effort column (the caption drops "and effort"), for a site whose API runs take no effort (Carrel today). Passing them works as in 0.146.
