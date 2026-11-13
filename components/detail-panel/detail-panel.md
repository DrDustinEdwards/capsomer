---
name: detail-panel
title: Detail panel
summary: A record opened from its row, in a panel from the right.
parts: [css, behavior, react]
tool: native + own JavaScript (the shared dialog)
states: [driven by the address with a plain form, closed with its row links, open with a command to copy and a before and after list, comfortable density]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/app/Drawer.tsx and styles.css (.drawer, .kv, .kv.diff, .cmd), as of capsid master 2026-10-01
replaces:
  - 'className=\{?`?"?drawer'
  - 'class="drawer'
  - 'className="kv"'
---

# Detail panel

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Enter on a row's link | Opens the panel; focus on its first control (Close when it has none) |
| Tab, Shift Tab | Moves through the panel's controls; stays inside it |
| Enter or Space on the corner Close button | Closes; focus returns to the row's link |
| Esc | Closes; focus returns to the row's link |
| Alt Left, or the browser's Back | Closes, when the panel pushed a history entry |

- A modal `dialog` named by its title; the page behind is inert.
- Each section is a `section` named by its heading, so a screen reader can move between them.
- The Copy result is a `role="status"` line beside the button.
- Forced colors: the panel keeps its edge.
