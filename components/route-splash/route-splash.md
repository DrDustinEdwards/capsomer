---
name: route-splash
title: Route splash
summary: The app's mark over "Loading...", in place of a page while a navigation to one of its slow pages loads.
group: pattern
parts: [css, behavior, react]
tool: native
states: [loading]
added: 0.94.0
source: Foxhound's RouteSplash and shouldShowRouteSplash (app/components/route-splash.tsx, app/lib/navigation/route-splash.ts, from Recova's loading.tsx)
replaces:
  - 'function RouteSplash'
  - 'shouldShowRouteSplash'
---

# Route splash

## Usage

```html
<div class="cap-route-splash" role="status">
  <img class="cap-route-splash-mark" src="/icon-512.png" alt="Example Co" width="96" height="96" />
  <p class="cap-route-splash-label">Loading...</p>
</div>
```

## Accessibility

None: it holds no control, and focus stays where the navigation left it.

- `role="status"` announces "Loading..." once.
- The label is `--muted` on `--ground` and reaches 4.5:1 (checked in the spec).
