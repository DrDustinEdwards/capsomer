---
name: faq
title: FAQ
summary: Questions and answers, as an accordion that keeps one answer open with no script, as cards, or as a list with every answer shown.
parts: [css, react]
tool: native
states: [accordion, accordion with the first open, cards, list]
added: 0.132.0
source: BioScience Writers' Faq (app/components/Faq.tsx, FAQS in app/data/content.ts, the FAQPage in config/structured-data.ts); Foxhound's ProductFAQ (app/components/product-sections-cap.tsx) and pricing questions (app/routes/pricing.tsx)
replaces:
  - 'ProductFAQ'
  - 'FaqAccordion'
  - 'faq-item'
  - 'PRICING_FAQS'
---

# FAQ

A page's questions and answers. **Accordion** (the default) and **cards** are [disclosures](../disclosure/disclosure.md) that share one `name`, so the browser keeps one answer open with no script; **list** shows every answer, for questions a reader scans (a pricing page).

The items are `{ question, answer }`, the shape Prelum's `faqPage(faqs)` takes, so one list feeds the page and its FAQPage JSON-LD and the two cannot disagree (Google's FAQ rules ask that the data say what the page says).

## When to use it

A product, pricing or service page's common questions.

## When not to

- **One section to show and hide**: a [disclosure](../disclosure/disclosure.md).
- **Help with many topics**: a help page with its own headings and search.

## The default and its reason

- **Every answer is in the HTML**, collapsed or not, and prints open, so a reader with no script, a search engine and a printout all have it.
- **Each question is a heading inside its summary** (`h3` by default), so the questions are in the page's heading list.
- **One open at a time** by the platform (`details name`, HTML), not a script.

## HTML contract

```html
<ul class="cap-faq">                              <!-- data-variant="cards" | "list" -->
  <li>
    <details class="cap-disclosure" data-variant="accordion" name="faq">
      <summary><h3 class="cap-faq-question">How long does an edit take?</h3></summary>
      <div class="cap-disclosure-body"><div class="cap-faq-answer"><p>Five business days.</p></div></div>
    </details>
  </li>
</ul>

<ul class="cap-faq" data-variant="list">
  <li><h3 class="cap-faq-question">Is there a minimum?</h3><div class="cap-faq-answer"><p>No.</p></div></li>
</ul>
```

Load `faq.css` and `disclosure.css`. A site's look sets `--cap-faq-face`, `--cap-faq-size` and `--cap-faq-measure`.

React: `Faq` from `capsomer/react/faq` takes `items`, `variant`, `name`, `openFirst` and `headingLevel`. Pass the same `items` to Prelum's `faqPage` for the JSON-LD.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves from question to question |
| Enter, Space | Opens or closes the question; opening one closes the one open |

## Accessibility

- Native `details` and `summary`: the browser gives the expanded state.
- Question `--text`, answer `--muted`: in the contrast report.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
