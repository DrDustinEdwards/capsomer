---
name: error-summary
title: Error summary
summary: After a failed submit, a titled list of links to every field in error at the top of the form; it takes focus and the page title starts "Error:".
group: pattern
parts: [css, behavior, react]
tool: own JavaScript
states: [as the server renders it, written by Field's submit check, hidden when the form is valid]
added: 0.56.0
source: GOV.UK Design System Error summary (https://design-system.service.gov.uk/components/error-summary/)
replaces:
  - 'class="[^"]*\b(error-summary|errorlist|form-errors)\b'
---

# Error summary

## Usage

```html
<form data-cap="field" method="post">
  <div class="cap-error-summary" data-cap="error-summary" tabindex="-1" role="alert" aria-labelledby="es-t" autofocus>
    <h2 class="cap-error-summary-title" id="es-t">There is a problem</h2>
    <ul class="cap-error-summary-list">
      <li><a href="#name">Give the job a name, such as Nightly backup.</a></li>
      <li><a href="#every-hour">Choose how often it runs.</a></li>
    </ul>
  </div>
  ...the fields, each with the same message beside it...
</form>
```

```tsx
import { ErrorSummary } from "capsomer/react/error-summary";
<form onSubmit={check}>
  <ErrorSummary errors={[{ id: "name", text: "Give the job a name, such as Nightly backup." }]} />
  ...
</form>
```

## Accessibility

| Key | Does |
| --- | --- |
| (a submit finds two or more fields in error) | Focus moves to the summary; its title and links are read |
| Tab | Moves through the links, then on into the form |
| Enter on a link | Puts focus in that field, with its label in view; a link to a group (a fieldset, a repeater) lands on its control in error, else its first empty one (`focusTarget`) |

- `role="alert"`, `tabindex="-1"` and `aria-labelledby` its title: announced as it appears and named "There is a problem".
- The title is an `h2` (an `h3` where the form sits under an `h2`).
- Each link is at least `--target` high; links are `--crit` on the surface, semibold, at 4.5:1 in both themes.
- Forced colors: the edge is CanvasText and the links LinkText.
- No motion.
