---
name: contact-card
title: Contact card
summary: "How to reach someone by kind, as links or labeled phone numbers, in cards or plain."
group: pattern
parts: [css, react]
tool: native
states: [cards with ways, labeled numbers, numbers joined by a word, address, plain with a rule between, one column with trailing icons]
added: 0.132.0
updated: 0.142.0
source: BioScience Writers' contact page (app/routes/contact-us.tsx); julieedwards.info's Contact section (app/components/Sections.tsx), whose grid was placed by inline styles
replaces:
  - 'function Tel\('
  - 'contact-grid'
  - 'contact-link'
---

# Contact card

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the links in reading order |

- An address with no map is an `address` element; one with a map is a link whose name is the address.
- Icons are decoration; the link's words name it.
