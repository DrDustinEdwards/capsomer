---
"capsomer": minor
---

- **Hero: the look tokens 0.150.0's notes listed are in `hero.css` now.** A merge in #422 kept the old file, so 0.150.0 shipped without them. Each defaults to today's look: `--hero-title-weight` (unset, the heading's own weight), `--hero-title-leading`, `--hero-title-tracking`, `--hero-lead-weight`, `--hero-lead-leading`, `--hero-card-pad`, `--hero-card-radius`, `--hero-card-blur`, `--hero-card-shadow` and `--hero-card-max`.
- **Removed: `.cap-hero-eyebrow`**, which nothing rendered after 0.150.0 (the hero draws the eyebrow component). The eyebrow keeps its `--space-4` gap above the title again (`.cap-hero-text > .cap-eyebrow`); since 0.150.0 it sat on the title.
