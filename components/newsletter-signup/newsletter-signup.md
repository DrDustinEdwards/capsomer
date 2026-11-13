---
name: newsletter-signup
title: Newsletter sign-up
summary: An email field and its button, a consent line, and the answer in its place once sent; the site's action does double opt-in.
group: pattern
parts: [css, react]
tool: native
states: [card, plain, with an error, sent, phone]
added: 0.132.0
source: germomics' subscribe page newsletter (app/routes/subscribe.tsx)
replaces:
  - 'name="consent"'
---

# Newsletter sign-up

## Usage

```html
<section class="cap-newsletter" aria-labelledby="nl-title">          <!-- data-variant="plain" -->
  <h2 class="cap-newsletter-title" id="nl-title">Newsletter</h2>
  <p class="cap-newsletter-text">One line.</p>
  <form class="cap-newsletter-form" method="post" action="/subscribe" aria-labelledby="nl-title">
    <div class="cap-newsletter-row">
      <label class="cap-sr-only" for="nl-email">Email address</label>
      <input id="nl-email" class="cap-input" type="email" name="email" required autocomplete="email" inputmode="email" spellcheck="false" placeholder="you@example.com" />
      <button type="submit" class="cap-btn" data-variant="primary">Subscribe</button>
    </div>
    <label class="cap-check cap-newsletter-consent"><input type="checkbox" name="consent" required /><span>I agree ... <a href="/privacy">privacy policy</a>.</span></label>
  </form>
  <p class="cap-newsletter-error" id="nl-error" role="alert">Please enter a valid email address.</p>   <!-- on error -->
</section>
<!-- sent: the form becomes <p class="cap-newsletter-done" role="status">Almost done: check your inbox ...</p> -->
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Field, button, consent box, and the privacy link |
| Enter | In the field, sends the form |
| Space | Ticks the consent box |

- A `section` named by its heading; the form named the same.
- The sent line and the error are announced when they appear.
