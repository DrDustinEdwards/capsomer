---
name: mentions-list
title: Mentions list (for a site)
summary: One page of one site's mentions, the same in Carrel and in every site admin.
group: pattern
parts: [css, behavior, react]
tool: native + React (composes the moderation queue, tabs, status, bulk bar, message, empty and confirm dialog)
states: [site owner with every action, a site with no Back to waiting, after a bulk post with no script, reader, second page with a mention opened, nothing waiting opens on All, empty tab, delete confirmation page, sweep confirmation page, delivered HTML]
added: 0.6.0
source: dustinedwards.info, app/routes/admin.mentions.tsx (the status tabs with counts and the unverified count, the source as text and never a link, the per-row approve and reject, the typed delete, the sweep); Carrel, app/routes/mentions.tsx, mentions.api.ts, lib/mentions.server.ts (paging, the counts from the contract, the bulk decide one mention at a time, the sweep panel); Capsomer's moderation queue (the keys and Undo); docs/design/design-content-components.md section 2.4.3
replaces:
  - "MentionsTable|MentionsFilters|ModerationQueue"
  - 'className="(mentions-table|mentions-filters|mention-row)[ "]'
---

# Mentions list (for a site)

## Usage

```html
<section class="cap-mq cap-mentions" data-cap="mentions-list" data-view="pending" aria-labelledby="m-h">
  <h2 class="cap-sr-only" id="m-h">Mentions on example.com</h2>
  <nav class="cap-tabs-list cap-mentions-tabs" aria-label="Mentions by state">
    <a class="cap-tab" href="/mentions?view=pending" aria-current="page">Waiting<span class="cap-tab-count">3</span></a>
    ...Source not found, Approved, Rejected, All
  </nav>
  <div class="cap-mq-head"><p class="cap-mq-summary" role="status">3 waiting</p><a class="cap-pill" data-variant="secondary" href="/mentions?view=all">1 not yet checked</a><p class="cap-mentions-count">3 mentions</p></div>
  <ul class="cap-mentions-withheld">...</ul>
  <div class="cap-message cap-content-result" role="status">...</div>
  <form id="bulk" class="cap-mentions-bulk-form" method="post" action="/mentions"></form>
  <div class="cap-bulk" data-cap="bulk-bar" ...>...Approve, Reject, Delete as submit buttons with form="bulk"; the outcome list...</div>
  <ul class="cap-rows cap-mq-list" role="list">
    <li class="cap-row cap-mq-row" data-id="m-101" data-state="pending">
      <span class="cap-mq-check"><label class="cap-check"><input type="checkbox" name="ids" value="m-101" form="bulk">...</label></span>
      <span class="cap-row-status"><span class="cap-status" data-tone="info">...Waiting</span></span>
      <div class="cap-row-title"><a href="/mentions?open=m-101" aria-expanded="false">...Rosa Park fieldnotes.example</a></div>
      <p class="cap-row-detail">On Field notes: the spring survey: “...”</p>
      <span class="cap-row-meta"><time class="cap-time" datetime="...">...</time></span>
      <form class="cap-row-actions cap-mentions-act" method="post" action="/mentions" aria-label="Decide the mention from Rosa Park">
        <input type="hidden" name="ids" value="m-101"><input type="hidden" name="version" value="3">
        <button type="submit" name="intent" value="approve" data-cap-action="approve">Approve</button>
        <button type="submit" name="intent" value="reject" data-cap-action="reject">Reject</button>
        <button type="submit" name="intent" value="delete" data-cap-action="delete" data-variant="danger">Delete</button>
      </form>
      <div class="cap-mq-more">...open: the quote, From, Source as text, On, Received, Decided...</div>
    </li>
  </ul>
  <nav class="cap-mentions-pages" aria-label="Mentions pages">...First page, Next page...</nav>
  <form class="cap-mq-retention" method="post" action="/mentions"><p>...the site's retention...</p><button type="submit" name="intent" value="sweep">Remove 2 expired</button></form>
</section>
```

```tsx
import { MentionsList } from "capsomer/react/mentions-list";
<MentionsList data={data} action="/mentions" Form={Form} result={useActionData()} submit={fetcherSubmit} />
```

## Accessibility

| Key | Does |
| --- | --- |
| `j`, `k` | Move between the rows |
| `a` | Approves the focused row, or the whole selection when the row is part of it |
| `r` | Rejects it |
| `d` | Deletes it, after the confirm dialog with the count to type |
| `x` | Selects or unselects the focused row |
| `z` | Undo (the message region's key) |
| Esc | Clears the selection, from a row or the bulk bar |

With script, as the queue's (single keys can be turned off):

The keys do nothing in a text field, with Ctrl, Alt or Meta held, in an open dialog, or when single-key shortcuts are off (the shortcuts switch, `data-cap-single-keys="off"` on `<html>`; `z` is the message region's and follows it too); the hints and `aria-keyshortcuts` are shown only while the keys work.

- The list is a region named by its heading ("Mentions on example.com"); the tabs are a `nav` of links, the current one with `aria-current="page"`.
- Each row's decisions are a form named for its sender ("Decide the mention from Rosa Park"), and each button names the sender too.
- The live line is a polite status; the result box and the bar's outcome list are the content components' own.
- A status is a shape, a word and a color. Text reaches 4.5:1 and edges 3:1 in both themes.
