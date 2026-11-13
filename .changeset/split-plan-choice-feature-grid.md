---
"capsomer": minor
---

- **Breaking: the plan choice's rules are `capsomer/plan-choice.css`, no longer part of `price-card.css`; the feature cards' rules are `capsomer/feature-grid.css`, no longer part of `feature.css`.** A page of price cards or feature blocks shipped the plan choice and the card grid for nothing (about 0.9 KB gzip on Foxhound's product pages). The rules are unchanged and each new file stands alone. A site that draws `PlanChoice` (`.cap-plan-choice`, `.cap-plan-choice-options`, `.cap-plan-option`, `.cap-plan-option-name`, `.cap-plan-option-price`, `.cap-plan-option-note`) adds `@import "capsomer/plan-choice.css"` (Foxing's paywall); one that draws `FeatureGrid` or `FeatureCard` (`.cap-feature-grid`, `.cap-feature-card`, `.cap-feature-card-icon`, `-head`, `-tag`, `-title`, `-text`) adds `@import "capsomer/feature-grid.css"`, and can drop `feature.css` if it draws no blocks. No token, class or HTML contract changes.
