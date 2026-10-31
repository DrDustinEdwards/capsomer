---
name: error-summary
title: Error summary
summary: After a failed submit, a titled list of links to every field in error at the top of the form; it takes focus and the page title starts "Error:".
parts: [css, behavior, react]
tool: own JavaScript
states: [as the server renders it, written by Field's submit check, hidden when the form is valid]
added: 0.56.0
source: GOV.UK Design System Error summary (https://design-system.service.gov.uk/components/error-summary/)
replaces:
  - 'class="[^"]*\b(error-summary|errorlist|form-errors)\b'
---

# Error summary

A box at the top of a form that says "There is a problem" and lists each field in error as a link, in the same words as the message beside the field. A link puts focus in its field, with the field's label or legend scrolled into view. Field's submit check (`form[data-cap="field"]`) writes it; a page the server renders after a failed post writes the same markup.

## When to use it

Any form whose submit finds two or more fields in error, and any page the server sends back with errors.

## When not to

- One field in error: focus goes to the field and its message is announced (Field), which is what one link would do.
- A failure that is not about a field ("The server did not answer"): an alert (`.cap-alert`) or the status region (Message).
- An error found when a field is left: the message beside it, alone. The summary is for a submit.

## The default and its reason

- **At the top of the form, and focus moves to it**, so a screen reader hears the title and the list, and a magnifier is taken to where the problems are said (GOV.UK). Its ring shows for any focus, not only the keyboard's, because script moved it there.
- **The page title starts "Error: "** until the form is sent, so the tab and a screen reader's title say it too (GOV.UK). It goes when a submit finds nothing wrong.
- **The words are the field's own message**, so the link and the message beside the field say the same thing.
- **A link goes to the control** (the first radio of a group, the first part of a date in error) and scrolls the field's label or legend into view, so the question is seen as well as the box.
- **It is not color alone**: a thick critical edge on its start side, the title in words, and semibold links.
- **Field makes one when the form has none**, as the form's first child. Write your own `.cap-error-summary` in the form to choose where it goes or what the title says.
- **A server-rendered summary takes focus with `autofocus`**, which needs no script.

## Keyboard

| Key | Does |
| --- | --- |
| (a submit finds two or more fields in error) | Focus moves to the summary; its title and links are read |
| Tab | Moves through the links, then on into the form |
| Enter on a link | Puts focus in that field, with its label in view |

## Accessibility

- `role="alert"`, `tabindex="-1"` and `aria-labelledby` its title: announced as it appears and named "There is a problem".
- The title is an `h2` (an `h3` where the form sits under an `h2`).
- Each link is at least `--target` high; links are `--crit` on the surface, semibold, at 4.5:1 in both themes.
- Forced colors: the edge is CanvasText and the links LinkText.
- No motion.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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

Leave the summary out and Field makes it (with `hidden` until a submit fails). `import { enhance, showSummary, hideSummary, summaryFor, setTitleError } from "capsomer/behavior/error-summary"`: `enhance()` wires the links of a summary the server rendered; Field calls the rest.

In React the app checks on submit and passes what it found:

```tsx
import { ErrorSummary } from "capsomer/react/error-summary";
<form onSubmit={check}>
  <ErrorSummary errors={[{ id: "name", text: "Give the job a name, such as Nightly backup." }]} />
  ...
</form>
```

A new `errors` list takes focus and puts "Error: " on the title; an empty list leaves the summary hidden.

## Deliberate differences

- **None for a single error** (GOV.UK shows one always). See Field.
- **Inside the form**, not above it at the top of `main`, so a page with two forms says which one is wrong.

## Exceptions in production

None yet.
