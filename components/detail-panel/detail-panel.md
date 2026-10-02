---
name: detail-panel
title: Detail panel
summary: A record opened from its row, in a panel from the right.
parts: [css, behaviour, react]
tool: native + own JavaScript (the shared dialog)
states: [closed with its row links, open with a command to copy and a before and after list, comfortable density]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/app/Drawer.tsx and styles.css (.drawer, .kv, .kv.diff, .cmd), as of capsid master 2026-10-01
replaces:
  - 'className=\{?`?"?drawer'
  - 'class="drawer'
  - 'className="kv"'
---

# Detail panel

**Provenance.** MIXED, against the Portal's `app/Drawer.tsx` and `styles.css` (`.drawer`, `.kv`, `.kv.diff`, `.cmd`) as of capsid master on 2026-10-01. Extracted: the CSS (width, the slide in and out with the fading backdrop, the record's columns, the command block, the before and after list) and the focus rules (back to the row, or to the page when the row has gone). Rewritten: the markup and behaviour are framework-free and generic. The Portal's panel is driven by its router (an address `/<view>/<type>/<id>` opens it, its feed supplies the content, a row inside it opens another record in its place); here `data-cap-history` is the opt-in and the app fills the content. As the Portal's, the Close is an icon button named by an aria-label (0.1 used the word; 0.2 takes the shared dialog's corner button).

The whole of one record (a job, a site, an agent, a mention) opened from its row without leaving the list. The shared dialog (`components/dialog`) as a side sheet on the right of the window: a native `dialog` opened with `showModal()`.

## When to use it

When a list's rows each have more to show than fits in a row, and the person will usually come back to the list: triage, a queue, moderation.

## When not to

When the record is a place someone links to or works in for a while (a draft, a post), give it its own page with its own address. A short yes or no about a row is a confirm dialog, not a panel.

## The default and its reason

- **The title is in plain words, the identifier beneath it** in mono: "Push the capsomer branch and open a pull request", then `job_7f3a92c1d4e0`. People read the words; the id is for copying.
- **The order inside: what to do first, the controls, the record (a `dl`), then the source.** What needs the person comes before what describes the thing; the source line says where the data came from and how fresh it is.
- **A command to run is a sunken mono block with a Copy button**, and a status line says whether it was copied. Where the clipboard is refused, the text is selected and the line says how to copy it.
- **Controls sit together; the destructive one stands apart** at the far end, and opens the confirm dialog.
- **Esc closes it, and so do Close and a click on the backdrop.** Focus returns to the row's link. On open, focus goes to the first control inside (shadcn's Sheet does the same), or to Close when the panel has nothing to press.
- **Back closes it when the app asked for a history entry** (`data-cap-history`, or `history: true`), which puts `#detail-<id>` in the address; closing it any other way takes that entry back, so Back then goes where it went before.
- **A before and after list for a change** (`cap-detail-diff` in a record's `dd`): the old value struck through above the new, each led by the words "before" and "after" for a screen reader, so the tint is never the only cue. Where the person typed a reason, show it above, under its own heading.
- **35rem (560 px) wide, at most 85% of the window on a phone**, so the backdrop is still there to press. The record's two columns stack when the panel is narrower than 380 px (a container query).
- Slides 2.5rem in from the right with a fade on open and out on close, its blurred backdrop fading with it, under `prefers-reduced-motion: no-preference` only; under reduced motion it appears and goes.
- **A record linked from inside the panel** is a real link or button in the panel, reachable by Tab and Enter. The Portal replaces the open panel with the linked record through its router; here the app does that by closing this panel and opening the other, with `data-cap-return` on the panel naming where focus goes if the first row is gone.

## Keyboard

| Key | Does |
| --- | --- |
| Enter on a row's link | Opens the panel; focus on its first control (Close when it has none) |
| Tab, Shift Tab | Moves through the panel's controls; stays inside it |
| Enter or Space on the corner Close button | Closes; focus returns to the row's link |
| Esc | Closes; focus returns to the row's link |
| Alt Left, or the browser's Back | Closes, when the panel pushed a history entry |

## Accessibility

- A modal `dialog` named by its title; the page behind is inert.
- Each section is a `section` named by its heading, so a screen reader can move between them.
- The Copy result is a `role="status"` line beside the button.
- Forced colours: the panel keeps its edge.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<a href="#detail-job_7f3a92c1d4e0" data-cap-detail-open="job-panel">Push the capsomer branch and open a pull request</a>

<dialog class="cap-dialog cap-detail" data-cap="detail-panel" data-placement="right" data-size="md"
        id="job-panel" data-cap-detail-id="job_7f3a92c1d4e0" data-cap-history="detail" aria-labelledby="job-title">
  <div class="cap-dialog-header" data-divider>
    <div class="cap-detail-heading">
      <p class="cap-detail-kind">Job, capsomer</p>
      <div class="cap-detail-titlerow">
        <h2 class="cap-dialog-title" id="job-title">Push the capsomer branch and open a pull request</h2>
        [status pill]
      </div>
      <p class="cap-detail-id">job_7f3a92c1d4e0</p>
    </div>
  </div>
  <div class="cap-dialog-body cap-detail-body">
    <section class="cap-detail-section" aria-labelledby="job-first">
      <h3 class="cap-detail-section-title" id="job-first">Do this first</h3>
      <pre class="cap-detail-cmd" id="job-cmd">git push -u origin build/c-overlays</pre>
      <div class="cap-detail-controls">
        <button type="button" class="cap-btn" data-cap-copy="job-cmd" data-cap-copy-what="Command">Copy command</button>
        <span class="cap-detail-copied" role="status" data-cap-part="status"></span>
      </div>
    </section>
    <section class="cap-detail-section" aria-labelledby="job-change">
      <h3 class="cap-detail-section-title" id="job-change">Change it</h3>
      <div class="cap-detail-controls">
        <button type="button" class="cap-btn" data-variant="primary">Resume</button>
        <button type="button" class="cap-btn" data-variant="danger">Mark failed…</button>
      </div>
    </section>
    <section class="cap-detail-section" aria-labelledby="job-record">
      <h3 class="cap-detail-section-title" id="job-record">Record</h3>
      <dl class="cap-detail-record"><dt>Status</dt><dd>Blocked</dd></dl>
    </section>
    <p class="cap-detail-source">Source: live, D1 jobs row job_7f3a92c1d4e0. Read 40 seconds ago.</p>
  </div>
  <button type="button" class="cap-btn cap-dialog-close" data-variant="quiet" data-icon-only data-cap-part="close" aria-label="Close"><svg>…</svg></button>
</dialog>
```

The header, title, body and Close are the shared dialog's parts; `data-cap-history="detail"` makes the address `#detail-<id>`. Only the `cap-detail-*` classes belong to this component.

`enhance()` wires every panel and every `[data-cap-detail-open]` trigger; a Ctrl or middle click on a trigger link still opens its href in a new tab. `openDetail(dialog, opener, { history })` and `closeDetail(dialog)` do it by hand. In React, `<DetailPanel open onClose id title identifier history>` with `DetailSection` and `DetailCommand` inside.

## Matches shadcn

Sheet (Base UI flavour, nova), side right: the blurred backdrop, the full-height panel with a hairline edge and a large shadow, the header with title and description, the Close icon button in the corner, a 2.5rem slide with a fade at 200 ms. The shared dialog supplies all of it.

## Deliberately different

- **The record's content is Capsomer's own**: kind, title and identifier, sections, the command block with Copy, the record's columns and the before and after list; Sheet has none.
- **A header divider** (`data-divider`) separates the heading from the scrolling record; Sheet has none.
- **Sheet at 75% of the window, here 85%**, so a record's columns still fit with the backdrop left to press (a rule of the shared dialog).
- **The Close is the corner icon button**, named "Close" (`aria-label`), as Sheet's; 0.1 had a text Close in the header.
- **Back closes it** (`data-cap-history`), which a Sheet does not do.

## Exceptions in production

None yet.
