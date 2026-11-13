---
"capsomer": minor
---

**New scale steps the sites share, so their values become tokens without a visible change.** The network sweep onto 0.143.0's tokens found about 1,600 values with no exact token, most of them the same few sizes on Foxhound, germomics, bsw and Foxing. Dustin's ruling (2026-11-13): a value two or more sites use becomes a step; a one-off snaps to the nearest step.

- Spaces: `--space-4-5` (14px), `--space-5-5` (20px), `--space-6-5` (28px), `--space-7-5` (40px), `--space-8-5` (56px), `--space-9-5` (80px), `--space-10` (96px).
- Radii: `--radius-hair` (1px), `--radius-s-5` (4px), `--radius-m-5` (8px), `--radius-l-5` (12px), `--radius-xl-5` (16px).
- Type: `--display-1` to `--display-5` (4.5, 3.75, 3, 2.75 and 2.5rem) for marketing headlines; `--title-1-5` (2rem) and `--title-2-5` (1.75rem).
- Line heights: `--leading-tight-5` (1.25), `--leading-snug-5` (1.375), `--leading-relaxed-5` (1.625), `--leading-airy` (1.75); and a new group of line boxes as lengths, `--line-box-4` to `--line-box-10` (1rem to 2.5rem), which inherit as a length, the way a site's `line-height: 1.25rem` does.
- Tracking: `--tracking-spaced` (0.12em), `--tracking-spread` (0.18em). Motion: `--dur-quick` (150ms).
- **token-check reads a line height in rem or px correctly.** It compared a length such as `1.25rem` with the unitless leadings and suggested `1.7px`. Now a length that is a line-box step is that token (and `--fix` swaps it); any other length is reported as its ratio to the rule's own font size with the nearest leading, and is never swapped, since a ratio inherits differently from a length.
- No token or class is removed or renamed; no HTML contract changes.
