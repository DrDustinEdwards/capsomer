---
name: scale-control
title: Scale control
summary: A quantity with steppers, an optional unit select and the button that sends them, as a plain GET that rescales the page it sits on, so every state is an address and works with script off.
parts: [css, react]
tool: native + own JavaScript (Field's steppers, Select's popup)
states: [a quantity and a unit system, a count alone at its least, keyboard focus, stepped up and down]
added: 0.98.0
updated: 0.98.0
source: dustinedwards.info, app/styles/procedure.css (.procedure-scale) and app/components/procedure-materials.tsx (ScaleForm)
replaces:
  - '\.procedure-scale\s*\{'
  - 'className="procedure-scale"'
---

# Scale control

## Usage

```html
<form class="cap-scale-control cap-field-row" method="get" action="/recipes/bread" aria-label="Scale this recipe">
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

```tsx
import { ScaleControl } from "capsomer/react/scale-control";

<ScaleControl action="/recipes/bread" label="Servings" name="servings" value={4} submitLabel="Show"
  units={{ label: "Units", name: "units", value: "", options: [{ value: "", label: "As written" }, { value: "metric", label: "Metric" }] }} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to the quantity, the unit select and the button |
| Up or Down arrow in the quantity | One step up or down |
| Page Up, Page Down, Home, End in the quantity | Ten steps, the least, the most |
| Enter in the quantity, or the button | Loads the page at the new scale |

- Each control has a visible label; the steppers are named for the quantity ("Increase servings") and disabled at its bounds.
- Name the form (`aria-label`, React `formLabel`) when the page has more than one form.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
