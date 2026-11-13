---
name: contact-card
title: Contact card
summary: How to reach someone, by kind: links (email, profiles, a map) or labeled phone numbers, in cards or plain on the page.
parts: [css, react]
tool: native
states: [cards with ways, labeled numbers, address, plain with a rule between]
added: 0.132.0
source: BioScience Writers' contact page (app/routes/contact-us.tsx); julieedwards.info's Contact section (app/components/Sections.tsx), whose grid was placed by inline styles
replaces:
  - 'function Tel\('
  - 'contact-grid'
  - 'contact-link'
---

# Contact card

A card per way of reaching someone: a heading, then links (`.cap-contact-ways`: an email, a profile, a booking page), labeled phone numbers (`.cap-contact-lines`, a description list), or an address. Cards sit in `.cap-contact-grid`. `data-variant="plain"` puts them on the page's own ground with a rule between, for a contact section that closes a page.

## When to use it

A contact page; the contact section of a one-page site.

## When not to

- **A form to write in**: a form with [fields](../field/field.md).
- **One email in a sentence**: a link.
- **A site's footer contact line**: the [footer](../family-footer/family-footer.md).

## The default and its reason

- **Every number is a `tel:` link** (`telHref`, RFC 3966 with a country code), so a phone dials it.
- **Links are 24px targets at least** (`--target`, WCAG 2.5.8), in `--accent-text` and bold, as the sites drew them.
- **The grid places itself** (auto-fit columns at 16rem). julieedwards.info placed each link by inline `style`, which `style-src 'self'` refuses.

## HTML contract

```html
<div class="cap-contact-grid">                 <!-- data-variant="plain" -->
  <div class="cap-contact-card">
    <h3 class="cap-contact-card-title">Telephone</h3>
    <dl class="cap-contact-lines">
      <div><dt>Editing</dt><dd><a href="tel:+1-555-010-0100">555-010-0100</a></dd></div>
    </dl>
  </div>
  <div class="cap-contact-card">
    <h3 class="cap-contact-card-title">Email</h3>
    <ul class="cap-contact-ways"><li><a class="cap-contact-way" href="mailto:hello@example.com">hello@example.com</a></li></ul>
    <address class="cap-contact-address"><span>1 Example Way</span><span>Springfield, TX 75000</span></address>
  </div>
</div>
```

React: `ContactCard`, `ContactGrid` and `telHref` from `capsomer/react/contact-card`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the links in reading order |

## Accessibility

- An address with no map is an `address` element; one with a map is a link whose name is the address.
- Icons are decoration; the link's words name it.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
