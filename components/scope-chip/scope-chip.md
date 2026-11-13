---
name: scope-chip
title: Scope chip
summary: A list's scope (every site, or one) as a GET form with one select, the choice kept in the address.
parts: [css, behavior, react]
tool: native
states: [every site, one site, one scope required (no unscoped choice), no script (Show button)]
added: 0.94.0
source: Carrel's ScopeChip (app/components/scope-chip.tsx, .app-scope in app/app.css)
replaces:
  - 'class="app-scope"'
  - 'className="app-scope"'
---

# Scope chip

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to the select (and to Show with no script) |
| Arrow keys, letters | Choose a scope (the browser's select); with script the list reloads on the change |

- The select has a name from its label, hidden with `.cap-sr-only`.
- The Show button stays in the page until script runs, so a keyboard user with no script can submit.
