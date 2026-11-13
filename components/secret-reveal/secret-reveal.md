---
name: secret-reveal
title: Secret reveal
summary: A secret shown once (an API key, a recovery code) that takes focus, with the warning and the copy button beside it.
parts: [css, react]
tool: native
states: [shown]
added: 0.118.0
source: Foxhound, routes/app/settings/api-keys.tsx (RevealKey)
replaces:
  - 'function RevealKey'
  - 'will not be shown again'
---

# Secret reveal

## Usage

```html
<section class="cap-secret" aria-labelledby="k-h">
  <h2 class="cap-secret-title" id="k-h">Your new API key</h2>
  <pre class="cap-secret-value" tabindex="-1" aria-labelledby="k-h" aria-describedby="k-n">sample_live_4f9c...</pre>
  <div class="cap-secret-foot">
    <p class="cap-secret-note" id="k-n">This will not be shown again. Copy it now and store it somewhere safe.</p>
    <!-- the copy button -->
  </div>
</section>
```
