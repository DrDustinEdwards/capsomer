---
name: ai-sample
title: AI sample
summary: A live AI call the reader runs on a marketing page, the output shown as labeled fields and marked as AI-written for a fictional person.
parts: [css, behavior, react]
tool: own JavaScript
states: [a sample, generating, failed]
added: 0.123.0
source: Foxhound's home page email generator (app/components/email-samples.tsx, app/islands/email-generator.ts)
replaces:
  - 'data-island="email-generator"'
---

# AI sample

A panel where the reader picks an input, presses a button and sees what the product's model writes for it. The output is labeled fields (a subject, a body) and a note that says it was written by AI for a fictional person.

## When to use it

Showing a product's AI on its own marketing page, on a real call, with nothing stored passed off as live.

## When not to

- **An answer to the reader's question, with sources**: the [ask panel](../ask-panel/ask-panel.md).
- **A fixed example**: write it on the page; no live badge, no button.

## The default and its reason

- **A form**, so the inputs are native (a [segmented control](../segmented/segmented.md) or radios) and Generate is its submit button, reached by Enter.
- **Choosing another input clears the last sample**, so the sample on screen always matches the input that is chosen.
- **The busy label replaces the button's words** and the button is `aria-busy` and disabled while the call runs; a newer call wins over a slower earlier one.
- **The output region is polite live**, so the sample or the failure line is announced when it lands.
- **Every write is `textContent`.** Generated text is never markup.
- **A failure says so** ("Generation failed. Try again.") rather than showing a stored sample as a generated one.
- **The live dot pulses** under no-preference motion only.

## HTML contract

```html
<form class="cap-ai-sample" data-cap="ai-sample">
  <div class="cap-ai-sample-head">
    <p class="cap-ai-sample-title">Live email writer</p>
    <span class="cap-ai-sample-live">Calls real AI</span>
  </div>
  <div class="cap-ai-sample-controls">
    <fieldset class="cap-seg">…</fieldset>
    <div class="cap-ai-sample-action">
      <button type="submit" class="cap-btn" data-variant="primary" data-ai-sample-generate data-busy-label="Writing...">
        <span class="cap-btn-label">Write a sample email</span>
      </button>
      <p class="cap-ai-sample-hint">A live AI call for a fictional customer.</p>
    </div>
  </div>
  <div class="cap-ai-sample-out" aria-live="polite"></div>
</form>
```

`enhance(root, { generate })` from `capsomer/behavior/ai-sample` wires it on a page that does not hydrate; `generate(formData)` returns `{ fields: [{ label, value, mono? }], note? }` or `{ error: true }`. `drawSample(out, result)` draws one by hand. React: `AiSample` from `capsomer/react/ai-sample` draws the same markup from the page's state (`busy`, `result`, `onGenerate`, `onChange`).

## Keyboard

| Key | Does |
| --- | --- |
| Arrow keys | Choose an input (native radios) |
| Enter, Space on the button | Generate |

## Accessibility

- The live badge is text ("Calls real AI"), its dot decoration.
- The failure line is `--crit` text with its words, not color alone.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
