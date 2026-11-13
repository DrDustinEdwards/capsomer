---
name: email
title: Email templates
summary: Magic link, verification, reset, email change, alert, notice and security notice mails from one definition, with the HTML and the text made from the same blocks, in the family's colors.
group: pattern
parts: [ts]
tool: own JavaScript
states: [magic link, verification, reset, email change, alert, notice, digest, security notice]
added: 0.5.0
updated: 0.132.0
source: design/email-templates.md (D7.2); the senders in Foxhound, Foxing, TXASM, Carrel and dustinedwards-info are unverified, this driver could not read them
replaces: []
---

# Email templates

## Usage

```ts
import { renderEmail, magicLink } from "capsomer/email";

const { subject, html, text } = renderEmail(magicLink, {
  brand: { name: "Example Co", family: "purple" },
  to: "reader@example.com",
  url: "https://app.example.com/auth/verify?t=EXAMPLE-NOT-A-TOKEN",
  expiresIn: "15 minutes",
});
```

## Accessibility

- The document has a language, a title (the subject) and one `h1`; the button is a real link with a visible text label.
- Body and link text is 16px or more (the footer is 14px), and every text pair is in the contrast report for all three families in both themes.

Last checked by hand: not yet. The check in a real mail client (Gmail, Apple Mail, Outlook, a phone) is Dustin's own, from his inbox; it has not been done.
