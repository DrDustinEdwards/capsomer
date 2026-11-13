---
name: form-status
title: Form status
summary: The result of a form's post, said where the form is.
group: pattern
parts: [css, react]
tool: native
states: [saved, failed, before a post]
added: 0.125.0
updated: 0.125.0
source: txasm (abstract edit, review, decisions, book and program pages; written five times)
replaces:
  - 'ref=\{statusRef\}'
---

# Form status

## Usage

```html
<p tabindex="-1" role="alert" class="cap-alert cap-form-status" data-tone="crit">
  <svg class="cap-status-glyph" aria-hidden="true">...</svg>
  <span class="cap-alert-body">The title is empty. Write a title, then save again.</span>
</p>
```

```html
<p tabindex="-1" role="status" class="cap-alert cap-form-status" data-tone="ok">
  <svg class="cap-status-glyph" aria-hidden="true">...</svg>
  <span class="cap-alert-body">Your abstract was saved.</span>
</p>
<p tabindex="-1" role="status" class="cap-sr-only cap-form-status"></p>
```

```tsx
import { FormStatus, useActionStatus } from "capsomer/react/form-status";
<FormStatus status={useActionStatus(actionData)} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | From the result, on into the form |

- Focus lands on the result after each post; its words are its name.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
