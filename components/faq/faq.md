---
name: faq
title: FAQ
summary: Questions and answers as an accordion that keeps one open, as cards, or as a full list.
group: pattern
parts: [css, react]
tool: native
states: [accordion, accordion with the first open, cards, list]
added: 0.132.0
updated: 0.142.0
source: BioScience Writers' Faq (app/components/Faq.tsx, FAQS in app/data/content.ts, the FAQPage in config/structured-data.ts); Foxhound's ProductFAQ (app/components/product-sections-cap.tsx) and pricing questions (app/routes/pricing.tsx)
replaces:
  - 'ProductFAQ'
  - 'FaqAccordion'
  - 'faq-item'
  - 'PRICING_FAQS'
---

# FAQ

## Usage

```html
<ul class="cap-faq">                              <!-- data-variant="cards" | "list" -->
  <li>
    <details class="cap-disclosure" data-variant="accordion" name="faq">
      <summary><h3 class="cap-faq-question">How long does an edit take?</h3></summary>
      <div class="cap-disclosure-body cap-faq-answer"><p>Five business days.</p></div>
    </details>
  </li>
</ul>

<ul class="cap-faq" data-variant="list">
  <li><h3 class="cap-faq-question">Is there a minimum?</h3><div class="cap-faq-answer"><p>No.</p></div></li>
</ul>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves from question to question |
| Enter, Space | Opens or closes the question; opening one closes the one open |

- Native `details` and `summary`: the browser gives the expanded state.
- Question `--text`, answer `--muted`: in the contrast report.
