---
name: read-only-form
title: Read-only form
summary: A form a read-only visitor can press but not send, with the reason shown in place.
group: pattern
parts: [css, react]
tool: native
states: [refused]
added: 0.118.0
source: Foxhound, app/components/demo-guarded-form.tsx (DemoGuardedForm)
replaces:
  - 'DemoGuardedForm'
---

# Read-only form

## Usage

```tsx
import { ReadOnlyForm } from "capsomer/react/read-only-form";

<ReadOnlyForm form={Form} method="post" readOnly={isDemo} message="This is a demo: changes are not saved.">...</ReadOnlyForm>
```
