---
name: secret-reveal
title: Secret reveal
summary: A secret shown once (an API key, a recovery code) that takes focus, with the warning and the copy button beside it.
parts: [css, react]
tool: native
states: [shown]
added: 0.98.0
source: Foxhound, routes/app/settings/api-keys.tsx (RevealKey)
replaces:
  - 'function RevealKey'
  - 'will not be shown again'
---

# Secret reveal

The answer to the action that made a secret: its heading, the secret in a mono block that wraps anywhere, "This will not be shown again", and the copy button.

## When to use it

Once, right after an API key, a webhook secret or recovery codes are made.

## When not to

A value that can be shown again (an id, a public key): a copy button beside the text.

## The default and its reason

- **The block takes focus when it appears** (`tabIndex=-1`), named by the heading and described by the warning, because the form that had focus is gone. Nothing visible changes; `focusOnShow={false}` turns it off.
- **It wraps anywhere and selects as one** (`user-select: all`), so a long key never scrolls sideways and a triple click takes all of it.
- **The copy button is the app's**: Capsomer's `CopyButton` with `text={secret}` and a name ("Copy API key"), so the copied and failed messages are the network's.
- **Nothing stores the secret here.** It lives in the action's answer and is gone on the next page.

## Accessibility

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

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

React: `import { SecretReveal } from "capsomer/react/secret-reveal"`.

## Exceptions in production

None yet.
