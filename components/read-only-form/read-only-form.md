---
name: read-only-form
title: Read-only form
summary: A form a read-only visitor can press but not send, with the reason shown in place.
parts: [css, react]
tool: native
states: [refused]
added: 0.118.0
source: Foxhound, app/components/demo-guarded-form.tsx (DemoGuardedForm)
replaces:
  - 'DemoGuardedForm'
---

# Read-only form

`ReadOnlyForm` is a form for a visitor who may look but not change (a demo, a viewer without the right). With `readOnly`, a submit stays in the browser and `message` shows under the form in a neutral banner, so the visitor stays where they were instead of meeting an error page.

It is not the security boundary: the server refuses the write too, for a post with no script or made by hand. Pass the app's form element as `form` (React Router's `Form`); every other prop goes to it.

The form is `form.cap-read-only-form`; the refusal is Capsomer's banner (`div.cap-banner`), after the form's controls.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. The banner is a status region, so the reason is announced when it appears.

```tsx
import { ReadOnlyForm } from "capsomer/react/read-only-form";

<ReadOnlyForm form={Form} method="post" readOnly={isDemo} message="This is a demo: changes are not saved.">...</ReadOnlyForm>
```
