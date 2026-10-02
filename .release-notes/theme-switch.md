# Theme switch

- Markup: the fieldset is `class="cap-theme"` and the options box `class="cap-theme-options"`; the `cap-seg` and `cap-seg-options` classes are gone from it. Each label now holds an icon and the word: `<label><input ...><svg class="cap-theme-icon" aria-hidden="true">...</svg><span class="cap-theme-text">Light</span></label>`. The React `<ThemeSwitch />` renders this; an app that hand-wrote the 0.1 markup must update it (the old markup still works, but unstyled by this component, since its CSS no longer targets `.cap-seg`).
- Words are visually hidden under 820 px (the icons stay); they remain in the accessibility tree.
- The chosen segment is the accent tint with an accent bar, not the segmented control's accent edge.
- `readTheme`, `applyTheme`, `applyStoredTheme`, `effectiveTheme`, `toggleTheme`, `enhance`, `data-theme`, the `cap-theme` key and the `ThemeSwitch` props are unchanged.
