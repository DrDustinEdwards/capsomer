---
name: scale-control
title: Scale control
summary: A quantity with steppers, an optional unit select and the button that sends them, as a plain GET that rescales the page it sits on, so every state is an address and works with script off.
parts: [css, react]
tool: native + own JavaScript (Field's steppers, Select's popup)
states: [a quantity and a unit system, a count alone at its least, keyboard focus, stepped up and down]
added: 0.93.0
updated: 0.93.0
source: dustinedwards.info, app/styles/procedure.css (.procedure-scale) and app/components/procedure-materials.tsx (ScaleForm)
replaces:
  - '\.procedure-scale\s*\{'
  - 'className="procedure-scale"'
---

# Scale control

One line over a recipe or a protocol that rescales it: how many (servings, tubes, copies), in which units if the page offers a choice, and the button that shows it. `.cap-scale-control` from `capsomer/scale-control.css` lays out parts that already exist: Field's number with steppers, Select, and a Button. `ScaleControl` from `capsomer/react/scale-control` renders it.

It is its own component, not a part of the calculator, because its contract is different: it has no result region. The page it sits on is the result, rendered again by the server from the address; a calculator keeps its page and answers beside its form.

## When to use it

- Scaling the quantities on the page: a recipe's servings and units, a protocol's number of tubes.

## When not to

- A sum whose working is shown beside the form: the calculator.
- A filter over a list: chips, or a search field.

## The default and its reason

- **A plain GET to the page itself.** With no script the button loads the page at the new scale; the state lives in the address, where an agent reading the page sees the same numbers as a person, and a copied link keeps the scale.
- **The quantity is Field's number**: `type="number"` with `min`, `max` and `step` (`step="any"` for a quantity that need not be whole, so `?servings=1.5` passes the browser's check; the steppers then step by 1), and Decrease and Increase steppers that show with script (Field's `enhance()`), out of the Tab order because the arrow keys do the same.
- **The unit choice is a Select** whose first option is "As written", so the page's own units stay the default.
- **Nothing rescales until the button is pressed** (Show, Scale): a page that moves under every keystroke loses the reader's place.
- **One line that wraps**, the fields aligned at their inputs' edge, the button last.
- **In the UI face, and gone from print.** It sets `--ui`, so it looks the same inside a page's prose; a printed page is already at the scale in its address, so the control is hidden there.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the quantity, the unit select and the button |
| Up or Down arrow in the quantity | One step up or down |
| Page Up, Page Down, Home, End in the quantity | Ten steps, the least, the most |
| Enter in the quantity, or the button | Loads the page at the new scale |

## Accessibility

- Each control has a visible label; the steppers are named for the quantity ("Increase servings") and disabled at its bounds.
- Name the form (`aria-label`, React `formLabel`) when the page has more than one form.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<form class="cap-scale-control" method="get" action="/recipes/bread" aria-label="Scale this recipe">
  <div class="cap-field">
    <label class="cap-field-label" for="servings">Servings</label>
    <div class="cap-input-group">
      <div class="cap-input-addon" data-align="inline-start"><button type="button" class="cap-btn" data-size="xs" data-variant="quiet" data-icon-only data-cap-part="step-down" tabindex="-1" aria-label="Decrease servings" hidden>&minus;</button></div>
      <input class="cap-input" id="servings" name="servings" type="number" min="1" max="1000" step="1" value="4" />
      <div class="cap-input-addon" data-align="inline-end"><button type="button" class="cap-btn" data-size="xs" data-variant="quiet" data-icon-only data-cap-part="step-up" tabindex="-1" aria-label="Increase servings" hidden>+</button></div>
    </div>
  </div>
  <div class="cap-field">
    <label class="cap-field-label" for="units">Units</label>
    <div class="cap-select-wrap" data-cap="select">
      <select class="cap-select" id="units" name="units"><option value="" selected>As written</option><option value="metric">Metric</option></select>
    </div>
  </div>
  <button type="submit" class="cap-btn" data-variant="secondary">Show</button>
</form>
```

Call Field's `enhance()` (`capsomer/behavior/field`) for the steppers and Select's (`capsomer/behavior/select`) for the popup; without them the form still works.

```tsx
import { ScaleControl } from "capsomer/react/scale-control";

<ScaleControl action="/recipes/bread" label="Servings" name="servings" value={4} submitLabel="Show"
  units={{ label: "Units", name: "units", value: "", options: [{ value: "", label: "As written" }, { value: "metric", label: "Metric" }] }} />
```

## Exceptions in production

None yet.
