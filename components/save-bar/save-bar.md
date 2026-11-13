---
name: save-bar
title: Save bar
summary: "The foot of a settings form, with the last save's result and the Save button."
group: pattern
parts: [css, react]
tool: native
states: [nothing saved yet, saving, saved, failed, no button, saves as it changes, sticky]
added: 0.113.0
updated: 0.125.0
source: Foxhound, app/routes/app/settings/ (notifications, email twice, account, brand-voice, disputes, audit), each a copy of Recova's SaveBar.
---

# Save bar

## Usage

```html
<div class="cap-save-bar">
  <p role="status" class="cap-save-bar-status"><span class="cap-status" data-tone="ok">...Saved</span></p>
  <button type="submit" class="cap-btn" data-variant="primary">Save changes</button>
</div>
```

```tsx
import { SaveBar } from "capsomer/react/save-bar";

<SaveBar pending={busy} saved={result?.ok === true} error={result?.ok === false ? "Failed to save. Please try again." : null} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches the button after the form's fields |
| Enter in a field | Posts the form |

- `role="status"` is polite: the result is read after what the reader is saying.
- The result carries its glyph as well as its color (the status component).
- The button keeps its words while saving and shows the spinner (`aria-busy`).
