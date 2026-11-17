---
"capsomer": minor
---

Two shared scale steps for the token sweep (Dustin's ruling, 2026-11-13: values two or more sites use become steps):
`--fs-tiny-5` (0.6875rem, a fixed 11px label in every density; Foxhound, Foxing and germomics) and
`--leading-normal-5` (1.55; Foxhound and dustinedwards.info). token-check now prefers a fixed step over a density step
of the same value, so `--fix` swaps 0.6875rem for `--fs-tiny-5` instead of leaving it raw. Nothing is removed or renamed.
