---
name: router
title: React Router bindings
summary: "The router glue every Capsomer React part needs, in one place."
group: primitive
parts: [behavior, react]
tool: react-router
states: []
added: 0.93.0
source: dustinedwards.info app/components/admin/confirm-dialog.tsx (the router glue), app/lib/media/view.mjs (onlyDisplayChanged); Carrel app/routes/home.tsx (a row's fetcher form)
replaces:
  - 'renderForm=\{\(props\) => <Form \{\.\.\.props\} />\}'
  - "onlyDisplayChanged"
---

# React Router bindings

## Usage

```tsx
import { RouterConfirmModal, routerRenderForm, revalidateUnlessOnly, useRouterRowForm } from "capsomer/react/router";
import { onlyParamsChanged } from "capsomer/behavior/router";
```

## Accessibility

None of its own: the parts it binds keep theirs.

Nothing of its own. The router's Form and Link render the same `<form>` and `<a>` as the plain parts, so they work before the script runs.
