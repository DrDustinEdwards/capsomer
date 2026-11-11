---
name: router
title: React Router bindings
summary: The router glue every Capsomer React part needs, in one place: Form for renderForm, the confirm dialog on the router, a row's own fetcher form, and a shouldRevalidate that skips the loader when only a display parameter changed.
parts: [behavior, react]
tool: react-router
states: []
added: 0.105.0
source: dustinedwards.info app/components/admin/confirm-dialog.tsx (the router glue), app/lib/media/view.mjs (onlyDisplayChanged); Carrel app/routes/home.tsx (a row's fetcher form)
replaces:
  - 'renderForm=\{\(props\) => <Form \{\.\.\.props\} />\}'
  - "onlyDisplayChanged"
---

# React Router bindings

Capsomer's React parts take their links and forms as props (`renderLink`, `renderForm`, `useRowForm`), so they work in any React app. Every network site is a React Router app, so the bindings for that router are written here once, not in each site.

**Provenance.** EXTRACTED from dustinedwards.info: `ConfirmDialog` (app/components/admin/confirm-dialog.tsx, the router's Form as the dialog's form and Cancel as a client navigation that keeps the scroll position) as `RouterConfirmModal`; `onlyDisplayChanged` (app/lib/media/view.mjs) as `onlyParamsChanged`, with the media library's own axes made arguments. From Carrel's Home (app/routes/home.tsx): a row action posted through the row's own fetcher, so the row can leave the list while it is sent, as `useRouterRowForm`.

## When to use it

- A part with `renderForm` (ConfirmPage, ConfirmModal): `renderForm={routerRenderForm}`, or `RouterConfirmModal` for the whole dialog.
- A part with `useRowForm` (the attention list's needs list): `useRowForm={useRouterRowForm}`.
- A route whose loader reads nothing a display parameter changes (a media library's view, grouping or size): `export const shouldRevalidate = revalidateUnlessOnly(["view", "group", "size"], { view: "grid" })`.
- A part with `renderLink`: `routerRenderLink` from `capsomer/react/link`.

## When not to

An app on another router writes its own three lines for the same props; the parts do not need this entry.

## The default and its reason

- **Cancel keeps the scroll position.** The page behind a confirm dialog is where the reader still is (dustinedwards.info's rule), so Cancel is `navigate(cancelHref, { preventScrollReset: true })`. Pass `onCancel` for a dialog opened from the page's state, which has no address to go back to.
- **A display parameter alone skips the loader; identical addresses never do.** A revalidation after an action has the same address on both sides, and skipping it would hide the write. A missing parameter reads as its default, so `?view=grid` and the bare address are one state when grid is the default.
- **Each row its own fetcher.** A row that posts (Later, Bring back) hides itself while its post is under way and comes back if the server refused it, without holding the rest of the list.

## Keyboard

None of its own: the parts it binds keep theirs.

## Accessibility

Nothing of its own. The router's Form and Link render the same `<form>` and `<a>` as the plain parts, so they work before the script runs.

## Markup

```tsx
import { RouterConfirmModal, routerRenderForm, revalidateUnlessOnly, useRouterRowForm } from "capsomer/react/router";
import { onlyParamsChanged } from "capsomer/behavior/router";
```

## Exceptions in production

None yet.
