---
name: summary-list
title: Summary list
summary: Labels and their values in a description list, each row with an optional Change link that says what it changes; the detail panel's record is its form without rows.
parts: [css]
tool: native
states: [rows with Change links, a missing value, a row without actions, two actions on a row, narrow column stacked, the record form without rows]
added: 0.50.0
updated: 0.50.0
source: GOV.UK Summary list; detail-panel's dl.cap-detail-record, which it generalizes
replaces:
  - 'class="[^"]*\b(summary-list|kv)\b'
---

# Summary list

A `dl.cap-summary-list` of rows: each row a `div` with the label (`dt`), the value (`dd`) and, when a person can change it, `dd.cap-summary-actions` holding a link. Without rows and actions, `dl.cap-detail-record` is the same list as the detail panel draws it: label and value side by side.

## When to use it

A short record of facts about one thing, read as pairs: the answers on a "check before you send" page, a site's settings, a job's record in the detail panel.

## When not to

- **Many things compared by the same fields**: a table.
- **Values a person edits in place**: a form with fields. The summary list shows answers; its Change link goes to where they are edited.
- **A list of things that each open**: the row list.

## The default and its reason

- **A real `dl`**, so a screen reader pairs each label with its value. Rows are `div`s, which HTML allows inside a `dl`.
- **A Change link names what it changes** ("Change address", the rest in `.cap-sr-only`), as GOV.UK does, so a list of links read alone still makes sense (WCAG 2.4.4). It is a link to the place the answer is edited, at least `var(--target)` tall.
- **No data is a state**: a missing value says so in words (`.cap-summary-missing`, "Not set"), never a blank, and its action reads Add.
- **It stacks where it is narrow.** The list is its own container: under 480px each row is label, then value, then actions, so it fits any column without a media query.
- **A rule between rows** in `--line`, which forced colors draw as they are.
- The record form keeps the detail panel's columns (a label column of 7em to 150px) and stacks under the panel's own container query at 380px. Load `summary-list.css` with `detail-panel.css`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches each Change link, row by row |
| Enter | Follows it |

## Accessibility

- Labels are `dt` and values `dd`; the actions are a `dd` too, as GOV.UK's are, so they are read with their row.
- Labels in rows take the text color and weight (GOV.UK); the record form keeps its muted labels, 4.5:1 in both themes.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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

## Exceptions in production

None yet.
