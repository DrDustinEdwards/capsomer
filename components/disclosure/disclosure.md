---
name: disclosure
title: Disclosure
summary: Show and hide, a section that opens in place and a group row in a list.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [summary hover, summary pressed, accordion variant, card variant, compact card, triangle marker, group row pressed and disabled, section closed, section open, sections that open one at a time, group row collapsed with its count, group row expanded, two levels, group row in a heading, inline variant, sign marker, screen-only section, expand toggle, table detail row]
added: 0.1.0
updated: 0.102.0
source: the approved mockup ("4 notices", collapsed); patterns.md "Show or hide"
replaces:
  - '<details(?![^>]*cap-disclosure)'
  - '<details[^>]*class(Name)?="[^"]*\bcard\b'
  - 'aria-expanded=\{?"?(true|false|\w+)'
---

# Disclosure

## Usage

```html
<details class="cap-disclosure" name="limits">
  <summary>Why is example.com marked degraded?</summary>
  <div class="cap-disclosure-body"><p>Its median response over the last hour is 2.4 seconds.</p></div>
</details>

<div class="cap-group" data-cap="disclosure">
  <button type="button" class="cap-group-toggle" aria-expanded="false" aria-controls="notices-rows">
    <span class="cap-group-label">Notices</span><span class="cap-sr-only">, </span><span class="cap-group-count">4</span>
  </button>
  <ul class="cap-group-rows" id="notices-rows" hidden>
    <li>api: 3 dependency updates waiting</li>
    <!-- a second level: <li class="cap-group-nest"><div class="cap-group" data-cap="disclosure">...</div></li> -->
  </ul>
</div>
```

```html
<button type="button" class="cap-link-btn cap-expand-toggle" data-cap="expand" aria-expanded="false" aria-controls="email-preview"
  data-open-label="Hide email" data-closed-label="View email"><span class="cap-expand-label">View email</span></button>
<div class="cap-expand-region" id="email-preview" hidden>...</div>

<tr><th scope="row"><button type="button" class="cap-link-btn cap-expand-toggle cap-expand-row" data-cap="expand" aria-expanded="false"
  aria-controls="evt-1-payload"><span class="cap-expand-label">invoice.payment_failed</span><span class="cap-sr-only"> payload</span></button></th>...</tr>
<tr class="cap-expand-detail" id="evt-1-payload" hidden><td colspan="3">...</td></tr>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches each summary and each group button |
| Enter or Space on a summary | Opens or closes the section |
| Enter or Space on a group button | Shows or hides its rows; `aria-expanded` follows |

- `summary` is announced as a button with its expanded state by the browser; the group button sets `aria-expanded` itself.
- Hidden rows use `hidden`, so they leave the accessibility tree and the tab order.
- Forced colors: the chevrons take the text color.
