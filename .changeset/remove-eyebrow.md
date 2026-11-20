---
"capsomer": minor
---

Removed the Eyebrow component: the `capsomer/eyebrow.css` entry, `.cap-eyebrow` (with `data-variant` and `data-tone`), `.cap-label[data-variant="mono"]`, the `Eyebrow` React part and the `--cap-eyebrow-color`, `--cap-eyebrow-size`, `--cap-eyebrow-weight` and `--cap-eyebrow-tracking` variables (the dustinedwards site layer no longer sets the last). The label parts of Consent, AI sample and Annotated figure and App frame's "Sample data" foot are now plain: `.cap-permissions-heading`, `.cap-ai-sample-title`, `.cap-ai-sample-label` and `.cap-annotated-key-num` carry their own small rules in sentence case, and the App frame foot uses `.cap-meta`.
