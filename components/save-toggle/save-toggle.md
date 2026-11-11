---
name: save-toggle
title: Save toggle
summary: Save for later, kept in this browser only: a toggle button whose bookmark fills when the item is saved.
parts: [css, behavior, react]
tool: own JavaScript
states: [not saved, saved, hover, storage blocked]
added: 0.94.0
source: germomics' SaveButton (app/components/content/PostDetail.tsx)
replaces:
  - 'germomics-saved'
  - 'function SaveButton'
---

# Save toggle

A small toggle on a post or an episode: Save, and once pressed, Saved with the bookmark filled. The list of saved ids lives in this browser's storage under the site's key; there is no account and nothing reaches the server.

## When to use it

A reading site with no sign-in where a reader wants to come back to an item: an episode, a post.

## When not to

- **A signed-in app**: save to the account, so it follows the person to another device.
- **A setting**: the switch.

## The default and its reason

- **A toggle button** (`aria-pressed`), not a checkbox: it acts at once and says its state.
- **The words change with the state** (Save, Saved) as well as the icon, so the state is never in the icon alone.
- **Kept in this browser only** (localStorage, a JSON array of ids under one key per site). Every read and write is in try/catch: in a private window that blocks storage the button still renders and simply keeps nothing.
- **Every button for the same id stays in step**, in this tab and in others (the `storage` event).
- **The server renders "Save"**, so hydration matches; the stored state follows when the page runs.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the button |
| Enter, Space | Saves or unsaves |

## Accessibility

- `aria-pressed` carries the state; the visible words change with it.
- The pill is at least `--target` tall.
- In forced colors the saved bookmark is filled in ButtonText.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

```html
<button type="button" class="cap-chip cap-save" data-size="sm" data-cap="save-toggle" data-key="example-saved" data-id="spring-update" aria-pressed="false">
  <svg class="cap-save-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M4 2.5h8v11L8 10.5l-4 3z"/></svg>
  <span class="cap-save-label">Save</span>
</button>
```

React: `SaveToggle` from `capsomer/react/save-toggle` takes `storageKey`, `id`, `label` and `savedLabel`. A page with no React calls `enhance()` from `capsomer/behavior/save-toggle`; `savedIds(savedRaw(key))` lists what a reader saved. Load `chips.css` (the pill is a toggle chip) and `save-toggle.css`.

## Exceptions in production

None yet.
