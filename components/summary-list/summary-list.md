---
name: summary-list
title: Summary list
summary: Labels and values in a description list, each row with an optional Change link.
parts: [css]
tool: native
states: [rows with Change links, a missing value, a row without actions, two actions on a row, narrow column stacked, the record form without rows]
added: 0.56.0
updated: 0.56.0
source: GOV.UK Summary list; detail-panel's dl.cap-detail-record, which it generalizes
replaces:
  - 'class="[^"]*\b(summary-list|kv)\b'
---

# Summary list

## Usage

```html
<dl class="cap-summary-list">
  <div>
    <dt>Address</dt>
    <dd>https://fieldnotes.example</dd>
    <dd class="cap-summary-actions"><a href="/sites/new/address">Change<span class="cap-sr-only"> address</span></a></dd>
  </div>
  <div>
    <dt>Quiet hours</dt>
    <dd class="cap-summary-missing">Not set</dd>
    <dd class="cap-summary-actions"><a href="/sites/new/quiet">Add<span class="cap-sr-only"> quiet hours</span></a></dd>
  </div>
</dl>

<dl class="cap-detail-record"><dt>Status</dt><dd>Blocked</dd></dl>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches each Change link, row by row |
| Enter | Follows it |

- Labels are `dt` and values `dd`; the actions are a `dd` too, as GOV.UK's are, so they are read with their row.
- Labels in rows take the text color and weight (GOV.UK); the record form keeps its muted labels, 4.5:1 in both themes.
