---
name: route-splash
title: Route splash
summary: The app's mark over "Loading...", in place of a page while a navigation to one of its slow pages loads.
parts: [css, behavior, react]
tool: native
states: [loading]
added: 0.93.0
source: Foxhound's RouteSplash and shouldShowRouteSplash (app/components/route-splash.tsx, app/lib/navigation/route-splash.ts, from Recova's loading.tsx)
replaces:
  - 'function RouteSplash'
  - 'shouldShowRouteSplash'
---

# Route splash

A full-height splash, the app's mark at 96px over "Loading...", that the app's persistent layout renders in place of its page while a navigation to one of its slow pages is still loading.

## When to use it

An app whose few heavy pages (a dashboard, a payments list) take long enough to load that the old page staying on screen reads as broken.

## When not to

- **A page whose shape is known**: skeleton rows in place of its data, so the layout does not jump.
- **After a form post**: the page stays, with the button busy; the splash would blank it.
- **A public reading page**: it renders on the server whole.

## The default and its reason

- **Only during a plain navigation**: `shouldShowRouteSplash(navigation, isSplashPath)` is true when the state is `loading` and there is no `formMethod`. React Router's revalidation after a post is also `loading`, with the post's method; splashing then would blank the page after every action.
- **Only on the paths the app names** (`isSplashPath`), exact paths, so a new page is not splashed by a prefix. A trailing slash is the same page.
- **A polite status** (`role="status"`), so a screen reader hears "Loading" while the screen shows it.
- **The mark is the app's own image** with its name as alt text.

## Keyboard

None: it holds no control, and focus stays where the navigation left it.

## Accessibility

- `role="status"` announces "Loading..." once.
- The label is `--muted` on `--ground` and reaches 4.5:1 (checked in the spec).

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

```html
<div class="cap-route-splash" role="status">
  <img class="cap-route-splash-mark" src="/icon-512.png" alt="Example Co" width="96" height="96" />
  <p class="cap-route-splash-label">Loading...</p>
</div>
```

React: `RouteSplash` from `capsomer/react/route-splash` takes `mark` (`src`, `alt`) and `label`; `shouldShowRouteSplash(useNavigation(), isSplashPath)` from `capsomer/behavior/route-splash` decides when. Load `route-splash.css`.

## Exceptions in production

None yet.
