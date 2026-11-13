---
name: ai-sample
title: AI sample
summary: A live AI call the reader runs on a marketing page, shown as labeled fields marked as AI-written.
group: pattern
parts: [css, behavior, react]
tool: own JavaScript
states: [a sample, generating, failed]
added: 0.132.0
updated: 0.142.0
source: Foxhound's home page email generator (app/components/email-samples.tsx, app/islands/email-generator.ts)
replaces:
  - 'data-island="email-generator"'
---

# AI sample

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Arrow keys | Choose an input (native radios) |
| Enter, Space on the button | Generate |

- The live badge is text ("Calls real AI"), its dot decoration.
- The failure line is `--crit` text with its words, not color alone.
