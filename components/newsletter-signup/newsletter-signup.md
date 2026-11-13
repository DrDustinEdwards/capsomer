---
name: newsletter-signup
title: Newsletter sign-up
summary: An email field and its button, a consent line, and the answer in its place once sent; the site's action does double opt-in.
parts: [css, react]
tool: native
states: [card, plain, with an error, sent, phone]
added: 0.132.0
updated: 0.140.0
source: germomics' subscribe page newsletter (app/routes/subscribe.tsx)
replaces:
  - 'name="consent"'
---

# Newsletter sign-up

A form that asks for an email address and sends a confirmation link: the field and its button on one row (stacked under 28rem of its own width), a required consent checkbox, and, once the site's action answers, "check your inbox" in place of the form, or the error under it.

## When to use it

A site that mails a newsletter. The action must do double opt-in: nothing is subscribed until the address's owner opens the link.

## When not to

- **Following in a podcast app or by RSS**: the subscribe links.
- **Signing in**: the sign-in form.

## The default and its reason

- **A real `form` that posts** (`method="post"`), so it works with no script; `renderForm` takes React Router's `Form` so it posts without a reload.
- **`type="email"`, `autocomplete="email"`, `inputmode="email"`, no spell check** (WCAG 1.3.5, the HTML autofill tokens).
- **The field's label is visually hidden but present**; the placeholder is an example, not the label.
- **Consent is a required, unticked checkbox** whose label says what the reader agrees to and links the privacy page.
- **The answer is announced**: the sent line is `role="status"`, an error `role="alert"` and named by the field's `aria-describedby`.

## HTML contract

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

Load `newsletter-signup.css`, `field.css` and `button.css`. React: `NewsletterSignup` from `capsomer/react/newsletter-signup` takes `action`, `title`, `text`, `consent`, `state` (the action's `{ ok }` or `{ ok: false, error }`), `done`, `button`, `plain` and `renderForm`, which is given `NewsletterFormProps` (the class, `method: "post"`, `action`, its label and the fields), so React Router's `Form` takes them spread with no cast. The card's ground is `--cap-newsletter-bg` (`--surface`), apart from the field's own `--surface`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Field, button, consent box, and the privacy link |
| Enter | In the field, sends the form |
| Space | Ticks the consent box |

## Accessibility

- A `section` named by its heading; the form named the same.
- The sent line and the error are announced when they appear.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
