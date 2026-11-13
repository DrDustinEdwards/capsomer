---
name: calculator
title: Calculator
summary: A form drawn from a list of fields beside a result computed on the server, working with script off.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [default with the worked result, live as it is typed in, a value it cannot use, keyboard focus, embedded in another page]
added: 0.98.0
updated: 0.98.0
source: dustinedwards.info, app/components/phage-tool.tsx, app/lib/phage-tools.mjs (toolValues, resultView, textParts), app/enhance/tools.ts and app/styles/phage-tools.css
replaces:
  - '\.phage-tool(-form|-field|-status|-detail|-answer|-steps)?\s*\{'
  - 'data-tool-(status|detail|instance)'
---

# Calculator

## Usage

```html
<div class="cap-calculator" data-cap="calculator" data-calculator="transfer">
  <form class="cap-calculator-form" method="get" action="/tools/transfer">
    <div class="cap-field">
      <label class="cap-field-label" for="transfer-weight">Page weight<span class="cap-calculator-unit"> (KB)</span></label>
      <p class="cap-field-help" id="transfer-weight-help">Default: <a href="/reports/page-weight">Annual report</a>.</p>
      <input class="cap-input" id="transfer-weight" name="weight" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="1800" aria-describedby="transfer-weight-help" />
    </div>
    <button type="submit" class="cap-btn" data-variant="secondary">Calculate</button>
  </form>
  <div class="cap-calculator-output">
    <div class="cap-calculator-status" role="status"><p class="cap-calculator-answer">Monthly transfer: <strong>45 GB per month</strong></p></div>
    <div class="cap-calculator-detail">
      <div class="cap-calculator-section"><h3>Monthly transfer</h3><ol class="cap-calculator-steps"><li>…</li></ol><p class="cap-calculator-note">…</p></div>
    </div>
  </div>
</div>
```

```ts
type CalculatorResult =
  | { ok: true; sections: Array<{ heading: string; result?: string; steps: string[]; notes?: string[] }> }
  | { ok: false; error: string };
```

```tsx
import { Calculator } from "capsomer/react/calculator";
import { initialValues } from "capsomer/behavior/calculator";

<Calculator id="transfer" action="/tools/transfer" fields={FIELDS} values={initialValues(FIELDS, params)} run={runTransfer} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the fields, their source links and Calculate |
| Typing in a field | Recomputes the result at once |
| Enter in a field, or Calculate | Recomputes in place (with script off, loads the answer) |

- Every field has a visible label with its unit, and its help is its description (`aria-describedby`).
- The status region is announced politely when the answer changes; the worked steps are a numbered list under a heading for each section.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
