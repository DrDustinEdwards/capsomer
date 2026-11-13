---
name: contact-card
title: Contact card
summary: How to reach someone, by kind: links (email, profiles, a map) or labeled phone numbers, in cards or plain on the page.
parts: [css, react]
tool: native
states: [cards with ways, labeled numbers, numbers joined by a word, address, plain with a rule between, one column with trailing icons]
added: 0.132.0
updated: 0.140.0
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
- **The grid places itself** (auto-fit columns at 16rem, `--cap-contact-card-min`), and so do a card's ways (12rem, `--cap-contact-way-min`); `data-columns="1"`, `"2"` or `"3"` on one card's `.cap-contact-ways` sets its own count. julieedwards.info placed each link by inline `style`, which `style-src 'self'` refuses.
- **The look is the site's, from tokens.** The title: `--cap-contact-card-title-face` (`--display`), `-size` (`--fs-h3`), `-weight` (`--weight-heading`), `-color` (`--text`), `-tracking` (`normal`) and `-case` (`none`). A way and a linked address: `--cap-contact-way-color` (`--accent-text`), `--cap-contact-way-face` and `--cap-contact-way-size` (inherited). An address: `--cap-contact-address-color` (`--muted`), `-face` and `-size` (inherited).

## HTML contract

```html
<div class="cap-contact-grid">                 <!-- data-variant="plain" -->
  <div class="cap-contact-card">
    <h3 class="cap-contact-card-title">Telephone</h3>
    <dl class="cap-contact-lines">
      <div><dt>Editing</dt><dd><a href="tel:+1-555-010-0100">555-010-0100</a> <span>or</span> <a href="tel:+1-555-010-0101">555-010-0101</a></dd></div>
    </dl>
  </div>
  <div class="cap-contact-card">
    <h3 class="cap-contact-card-title">Email</h3>
    <ul class="cap-contact-ways" data-columns="1">   <!-- data-columns optional -->
      <li><a class="cap-contact-way" href="mailto:hello@example.com">hello@example.com<span aria-hidden="true"><svg>...</svg></span></a></li>
    </ul>
    <address class="cap-contact-address"><span>1 Example Way</span><span>Springfield, TX 75000</span></address>
  </div>
</div>
```

React: `ContactCard`, `ContactGrid` and `telHref` from `capsomer/react/contact-card`. A way takes `icon` (before its words) and `iconEnd` (after them, an arrow); a line takes `join`, a word between its numbers ("or"); the card takes `wayColumns`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the links in reading order |

## Accessibility

- An address with no map is an `address` element; one with a map is a link whose name is the address.
- Icons are decoration; the link's words name it.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
