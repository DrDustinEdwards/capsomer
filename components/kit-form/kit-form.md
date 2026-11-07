---
name: kit-form
title: Kit form
summary: The form and the submit a React Router app hands the posts, media and mentions lists.
parts: [react]
tool: native
states: []
added: 0.78.0
source: Carrel, app/components/kit-form.tsx; dustinedwards.info, app/routes/admin.media._index.tsx
---

# Kit form

`KitForm` is the `Form` prop of the posts, media and mentions lists: a GET goes through React Router's `Form` (a tab, the filters, a page), a post is a plain form that reaches the route's action without script. `useKitSubmit(endpoint)` is their `submit`: with script each intent posts to the screen's JSON endpoint and the page reads its data again after it.

Needs `react-router` (an optional peer of Capsomer). No CSS, class or HTML contract.
