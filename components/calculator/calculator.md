---
name: calculator
title: Calculator
summary: A form drawn from a list of fields beside a result drawn from a plain view tree, computed on the server so it reads complete with script off, and again on every input with the same function.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [default with the worked result, live as it is typed in, a value it cannot use, keyboard focus, embedded in another page]
added: 0.96.0
updated: 0.96.0
source: dustinedwards.info, app/components/phage-tool.tsx, app/lib/phage-tools.mjs (toolValues, resultView, textParts), app/enhance/tools.ts and app/styles/phage-tools.css
replaces:
  - '\.phage-tool(-form|-field|-status|-detail|-answer|-steps)?\s*\{'
  - 'data-tool-(status|detail|instance)'
---

# Calculator

A calculator a reader fills in and reads the working of: labeled fields on one side, the answer and its worked steps on the other. The site owns the arithmetic and passes it in as one function, `run(values)`, which returns a `CalculatorResult`; Capsomer owns the form, the result region and how the result is drawn. `.cap-calculator` from `capsomer/calculator.css`; `Calculator` from `capsomer/react/calculator`; `enhance(root, runs)` from `capsomer/behavior/calculator` for a page that is server-rendered and not hydrated.

## When to use it

- A small sum with a few inputs whose working a reader should see: a conversion, a dilution, a budget, a transfer estimate.
- The same calculator inside a longer page, folded under the step it serves (`embedded`).

## When not to

- Scaling the quantities on the page itself (servings, a count): the scale control.
- One number against a limit: the usage meter.
- A form that saves something: Field and a form, with its own submit.

## The default and its reason

- **It works with script off.** The form is a plain GET to the calculator's own page, which renders the result from the address (`initialValues(fields, params)`), so a copied link shows the same calculation, and a reader or an agent with no script reads it complete.
- **One description, two renderers.** `resultView(result)` turns the result into plain view nodes (`{ tag, className, children }`); React draws them with `renderNode`, the behavior module with `buildNode`, so the server's markup and the live markup are the same and neither parses HTML. A node may only use the tags in `VIEW_TAGS`; any other tag throws.
- **The answer is announced, the working is not.** The one line per section that holds a result sits in a `role="status"` region; the steps sit under it in the detail. Typing recomputes at once; Enter or Calculate recomputes in place without a reload.
- **The address follows the values**, so a copied URL is the calculation; an `embedded` calculator (several on one page) leaves the address alone, while its form still submits to the calculator's own page.
- **Powers are set as powers.** `10^7` in a hint, a step or a note becomes 10 with a superscript 7 (`textParts`), and the minus is a real minus.
- **An error is a sentence with an edge**: what to enter and why, in `--crit` and semibold with a bar at its start, so it is never color alone. The working is cleared.
- **Fields are Field's**: the label above, help (the hint, then "Default:" and its source link) between the label and the input, a text input with `inputmode="decimal"`, so "1e7" and "1 x 10^7" can be typed. Calculate is a secondary Button.
- **The form keeps about 17rem and the result takes the rest**, wrapping under the form when the result would be narrower than 20rem.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the fields, their source links and Calculate |
| Typing in a field | Recomputes the result at once |
| Enter in a field, or Calculate | Recomputes in place (with script off, loads the answer) |

## Accessibility

- Every field has a visible label with its unit, and its help is its description (`aria-describedby`).
- The status region is announced politely when the answer changes; the worked steps are a numbered list under a heading for each section.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

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

`data-embedded` on the root keeps the address still. An error is `<p class="cap-calculator-error">` alone in the status region.

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

On a hydrated page the React state does the live part and no call is needed. On a server-rendered page that is not hydrated, call `enhance(document, { transfer: runTransfer })` once; a calculator whose `data-calculator` has no run throws, so a form is never silently dead. `attach(root, run)` wires one calculator on its own. An `embedded` calculator's children follow the result: a link to its own page stands alone on its line, so it is `<a data-link="next">`, a whole target on a touch screen (link.md).

## Exceptions in production

None yet.
