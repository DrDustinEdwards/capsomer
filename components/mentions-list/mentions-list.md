---
name: mentions-list
title: Mentions list (for a site)
summary: One page of one site's mentions, the same in Carrel and in every site admin. The moderation queue on the site-api contract's states (Waiting, Approved, Rejected, Not yet checked, Source not found), with tabs and the site's counts, each row's decisions as forms, the bulk bar with each mention's outcome, Undo where the site can reverse a decision, paging, and delete and the retention sweep behind a confirm. Every action is a form post, so it all works with no script; with script the keys decide.
parts: [css, behaviour, react]
tool: native + React (composes the moderation queue, tabs, status, bulk bar, message, empty and confirm dialog)
states: [site owner with every action, a site with no Back to waiting, after a bulk post with no script, reader, second page with a mention opened, nothing waiting opens on All, empty tab, delete confirmation page, sweep confirmation page, delivered HTML]
added: 0.6.0
source: dustinedwards.info, app/routes/admin.mentions.tsx (the status tabs with counts and the unverified count, the source as text and never a link, the per-row approve and reject, the typed delete, the sweep); Carrel, app/routes/mentions.tsx, mentions.api.ts, lib/mentions.server.ts (paging, the counts from the contract, the bulk decide one mention at a time, the sweep panel); Capsomer's moderation queue (the keys and Undo); docs/design/design-content-components.md section 2.4.3
replaces:
  - "MentionsTable|MentionsFilters|ModerationQueue"
  - 'className="(mentions-table|mentions-filters|mention-row)[ "]'
---

# Mentions list (for a site)

A site's webmentions as one component: what Carrel shows for each site and what each site's own admin shows for itself. It renders one page of view data and posts intents; it never holds a key and never calls a site. The server half (the content kit, in site-api) turns a site into that data and runs each intent through the site-api contract.

It is the moderation queue moved onto the contract. The rows, the open row, the statuses and the retention line are the queue's markup and stylesheet (`.cap-mq`); the tabs are `tabs` as links; the bulk bar is `bulk-bar` in form mode with its outcome list; the results, Undo and confirmation are the loop the content components share (`useIntents`). This page covers what the list adds.

**Provenance.** MIXED. EXTRACTED from dustinedwards.info (`admin.mentions.tsx`): the tabs with counts and an unverified count, the source host and address as text and never a link (a stranger chose them), approve and reject on each row, delete behind a typed confirm, the sweep. From Carrel (`mentions.tsx`, `mentions.server.ts`): cursor paging with First page and Next page, the counts from the contract's `MentionCounts` (the whole site, not the page), the bulk decide sent one mention at a time in order (`mentions.server.ts:166-204`), the sweep's confirm. From Capsomer's moderation queue: the keys, Undo, the row and its open state. REWROTE: the states (the contract's, with Dustin's words, 2026-10-09), the per-row decisions as forms, and Undo only where the contract can reverse a decision.

## When to use it

Any screen where a person decides one site's mentions: Carrel's per-site mentions page and each site admin's.

## When not to

- Strangers' submissions that are not a site's mentions (comments in an app of its own, form entries): the moderation queue directly, with your own data and events.
- What readers see on a post: that is the site's own.

## The default and its reason

- **The contract's states, in Dustin's words.** Waiting (`pending`), Approved, Rejected, Not yet checked (`unverified`) and Source not found (`failed`). The queue's Spam, Bin and Source gone are gone: the contract has no bin, a delete is final, and Source gone is `failed` with the site's `failureReason`.
- **Tabs with the site's counts.** Waiting, Source not found, Approved, Rejected, All, each a link with its count from `MentionCounts`, which covers the whole site and not just the page. With no `view` the list opens on Waiting, or on All when nothing waits. "N not yet checked" is a pill that links to All.
- **Only what can be decided offers a decision.** Approve and Reject on waiting, approved and rejected mentions; a mention not yet checked or whose source was not found has none (the contract refuses it with 422), only Delete. A bulk decision sends one decide per mention, and a mention it does not apply to comes back as that mention's refusal in the bar's outcome list.
- **Every action is a form post.** A row's decisions are a form (`ids`, `version`, and the submit button's `intent`), the bulk bar's actions post the ticked boxes, the sweep is a form, the tabs and pages are links, and a sender's name links to `?open=<id>`, which the server renders open. With no script the page comes back with `result`: the sentence, Undo as a form, each mention's outcome.
- **With script,** `submit` keeps the page where it is: a decision runs at once, the message says so with Undo (`z`), and focus goes to the next row. A sender's name opens the row in place. The keys decide (below).
- **Undo is what the contract can do.** Between approved and rejected it is the opposite decision, on every site. From waiting it needs site-api v0.6's `reset` (`offers.reset`), which also shows Back to waiting on decided rows. On a site without it a decision on a waiting mention has no Undo, and the kit's message says so; the list says it once, in words, under the tabs.
- **One-way actions ask first.** Delete answers with `result.confirm` and the count to type; the sweep answers with the counts in the contract's `expiring`, by kind. With script that is the confirm dialog, without it the confirm page.
- **An action is offered only when the site supports it and the person may run it** (`data.offers`, `data.can.decideMentions`), and a withheld one is named in words.
- **A source is text.** The host in the row, the address in the open row, both as text. Only a source marked `external` is a link, with `rel="nofollow ugc noopener"`. A stranger's text is escaped, as React does.

## Keyboard

With script, as the queue's (single keys can be turned off):

| Key | Does |
| --- | --- |
| `j`, `k` | Move between the rows |
| `a` | Approves the focused row, or the whole selection when the row is part of it |
| `r` | Rejects it |
| `d` | Deletes it, after the confirm dialog with the count to type |
| `x` | Selects or unselects the focused row |
| `z` | Undo (the message region's key) |
| Esc | Clears the selection, from a row or the bulk bar |

The keys do nothing in a text field, with Ctrl, Alt or Meta held, in an open dialog, or when `data-cap-single-keys="off"` is on the page; the hints and `aria-keyshortcuts` are shown only while the keys work.

## Accessibility

- The list is a region named by its heading ("Mentions on dustinedwards.info"); the tabs are a `nav` of links, the current one with `aria-current="page"`.
- Each row's decisions are a form named for its sender ("Decide the mention from Rosa Park"), and each button names the sender too.
- The live line is a polite status; the result box and the bar's outcome list are the content components' own.
- A status is a shape, a word and a colour. Text reaches 4.5:1 and edges 3:1 in both themes.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

React renders it; a server renders the same HTML. The parts, in order:

```html
<section class="cap-mq cap-mentions" data-cap="mentions-list" data-view="pending" aria-labelledby="m-h">
  <h2 class="cap-sr-only" id="m-h">Mentions on dustinedwards.info</h2>
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
      <p class="cap-row-detail">On Phage lambda: lysis or lysogeny: “...”</p>
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

Props: `data` (`MentionsData` from `capsomer/content`), `action`, `Form`, `submit`, `result`, `now`.

The intents it posts, each with `ids`: `approve`, `reject` and `reset` (with `version` from a row), `delete` (answered with `result.confirm`, then posted again with `confirm`, the typed count), `sweep` (answered with `result.confirm`, then posted again with its `fields`), and whatever `result.undo` names.

`import { mentionsHref, currentView, mentionActions } from "capsomer/behaviour/mentions-list"`: the pure helpers. The states, their words and the decision table are the queue's (`capsomer/behaviour/moderation-queue`: `decide`, `actionsFor`, `undoAction`, `STATE_LABEL`).

**Dependencies.** It needs the stylesheets of the parts it composes: moderation-queue, row-list, tabs, status, avatar, time, bulk-bar, message, empty, dialog, confirm-dialog and content (the shared result box), with this one.

## Exceptions in production

None yet.
