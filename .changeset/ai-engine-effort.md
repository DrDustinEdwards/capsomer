---
"capsomer": minor
---

**AI engine settings: an effort per job.** Each job's row gains an Effort column beside its model (`effort-<key>`, read back by `settingsFromForm` as `efforts`), and the spend by job can split by effort (`usage[].effort`), so a person sees what a higher effort cost. **Changed React contract: `AiEngineSettings` requires `efforts` and `effortOptions`** (the same shape as `models` and `modelOptions`). The table gains one column; no token or class changes.
