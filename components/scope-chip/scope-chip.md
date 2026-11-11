---
name: scope-chip
title: Scope chip
summary: A list's scope (every site, or one) as a GET form with one select, the choice kept in the address.
parts: [css, behavior, react]
tool: native
states: [every site, one site, one scope required (no unscoped choice), no script (Show button)]
added: 0.91.0
source: Carrel's ScopeChip (app/components/scope-chip.tsx, .app-scope in app/app.css)
replaces:
  - 'class="app-scope"'
  - 'className="app-scope"'
---

# Scope chip

A small form at the head of a list: a select of scopes (each site, each project), with one choice for all of them. Choosing one reloads the list for that scope; the choice is a query parameter, so a reload, a bookmark or a shared link keeps it.

## When to use it

A list that one person reads across several sites or projects, where most of the time they want all of them and sometimes one: posts, media, mentions.

## When not to

- **Two to five filters that combine**: filter chips.
- **Switching the whole app to another site**: the site header's switcher.
- **A choice that changes a form's value**: a field with a select; this one navigates.

## The default and its reason

- **A plain GET form**, so it works with no script, the address carries the scope, and Back returns to the scope before.
- **With script, choosing submits at once**, and the Show button (there for a page with no script) is hidden. Choosing a list's filter is not a change of context: the page is the same list, filtered (WCAG 3.2.2).
- **Other query values ride along** (`keep`: a status tab, a search) as hidden inputs, so changing the scope keeps them.
- **The label is hidden but present** ("Show posts from"): the select's options name themselves.
- **`all: null`** for a page that needs one scope (a media library is always one site's).
- **A router's form** through `renderForm` (React Router's `Form`), so the change is a client navigation.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the select (and to Show with no script) |
| Arrow keys, letters | Choose a scope (the browser's select); with script the list reloads on the change |

## Accessibility

- The select has a name from its label, hidden with `.cap-sr-only`.
- The Show button stays in the page until script runs, so a keyboard user with no script can submit.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

```html
<form method="get" class="cap-scope" data-cap="scope-chip">
  <input type="hidden" name="status" value="draft" />   <!-- one per kept value -->
  <label class="cap-scope-label">
    <span class="cap-sr-only">Show posts from</span>
    <select class="cap-select" name="site">
      <option value="">All sites</option>
      <option value="example-org">example.org</option>
    </select>
  </label>
  <button class="cap-btn cap-scope-submit" type="submit">Show</button>
</form>
```

React: `ScopeChip` from `capsomer/react/scope-chip` takes `options`, `value`, `label`, `all`, `name`, `keep`, `action` and `renderForm`. A page with no React calls `enhance()` from `capsomer/behavior/scope-chip`. Load `scope-chip.css` and `select.css`.

## Exceptions in production

None yet.
