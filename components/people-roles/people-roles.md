---
name: people-roles
title: People and roles
summary: "An app's members page showing who has access, their title and end date, with add and remove."
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [a lead's page, review open, changing a title, one person's history, an Owner's page after adding someone, a change Cloudflare refused, nobody added yet, role grid]
added: 0.7.0
updated: 0.106.0
source: capsid docs/design/design-identity-roles.md, "The members page"; Dustin's rulings of 2026-10-09
replaces:
  - 'href="/people"'
---

# People and roles

## Usage

```html
<section class="cap-people" data-cap="people-roles" aria-labelledby="pr-h">
  <div class="cap-people-head"><h2 id="pr-h">Lab members</h2><p class="cap-people-count">5 people have access</p></div>
  <p class="cap-people-lead">You manage Lab workers and Safety officers.</p>
  <p class="cap-people-result" role="status" data-tone="ok"><span class="cap-status" data-tone="ok">[ok glyph]<span class="cap-sr-only">Done:</span></span><span>Added Sam Ortiz.</span></p>

  <form class="cap-people-card cap-people-review" data-variant="review" method="post" action="/lab/members" aria-labelledby="pr-rv">
    <input type="hidden" name="intent" value="review">
    <h3 id="pr-rv">Still on your team?</h3>
    <div class="cap-people-review-list">
      <fieldset class="cap-people-review-item"><legend>Rosa Park <span class="cap-people-review-who">Lab worker</span></legend>
        <label class="cap-check"><input type="radio" name="answer-0" value="keep"> Keep, until May 14, 2027</label>
        <label class="cap-check"><input type="radio" name="answer-0" value="remove"> Remove</label>
        <input type="hidden" name="email-0" value="rosa.park@example.edu">
      </fieldset>
    </div>
    <div class="cap-people-review-foot"><button type="submit" class="cap-btn" data-variant="primary">Save review</button><p class="cap-people-tally" data-cap-part="tally" aria-live="polite">0 to keep, 0 to remove, 1 not answered.</p></div>
  </form>

  <div class="cap-table-wrap" role="region" aria-labelledby="pr-h" tabindex="0">
    <table class="cap-table cap-people-table">
      <thead><tr><th scope="col">Person</th><th scope="col">Title</th><th scope="col">Access</th><th scope="col">Cloudflare</th><th scope="col"><span class="cap-sr-only">Actions</span></th></tr></thead>
      <tbody>
        <tr data-status="active" data-email="rosa.park@example.edu" data-name="Rosa Park">
          <th scope="row" class="cap-people-who"><span class="cap-people-name">Rosa Park</span><span class="cap-people-email cap-mono">rosa.park@example.edu</span></th>
          <td>Lab worker</td>
          <td><span class="cap-people-end" data-soon>[warn glyph]Ends Dec 18, 2026, in 18 days</span></td>
          <td><span class="cap-status" data-tone="ok">[ok glyph]Ready: they can sign in</span></td>
          <td class="cap-people-actions"><div class="cap-people-acts">
            <form method="post" action="/lab/members"><input type="hidden" name="intent" value="renew"><input type="hidden" name="email" value="rosa.park@example.edu"><button type="submit" class="cap-btn" data-size="sm">Renew to May 14, 2027<span class="cap-sr-only"> for Rosa Park</span></button></form>
            <details class="cap-menu-form" data-cap="menu-form"><summary class="cap-btn cap-menu-trigger" aria-label="Actions for Rosa Park">Actions[chevron]</summary>
              <form class="cap-popover cap-menu" action="/lab/members" method="post"><input type="hidden" name="email" value="rosa.park@example.edu">
                <a class="cap-option cap-menu-item" href="?change=rosa.park%40example.edu">Change title</a>
                <a class="cap-option cap-menu-item" href="?person=rosa.park%40example.edu">History</a>
                <hr class="cap-listbox-separator cap-menu-separator">
                <button type="submit" class="cap-option cap-menu-item" name="intent" value="remove" data-tone="crit">Remove</button>
              </form></details>
          </div></td>
        </tr>
        <tr class="cap-people-edit" id="pr-change-rosa"><td colspan="5"><form class="cap-people-change cap-field-row" data-cap="field" method="post">...title select, reason (required), Change title, Cancel...</form></td></tr>
      </tbody>
    </table>
  </div>

  <section class="cap-people-history" aria-labelledby="pr-hi">...<ol class="cap-people-history-list"><li class="cap-people-history-item"><time class="cap-people-history-when">...</time><div><p class="cap-people-history-what">Renewed, until May 14, 2027</p><span class="cap-people-history-by">By Maya Chen</span></div><span class="cap-status" data-tone="info">...Waiting for Cloudflare</span></li></ol></section>

  <form class="cap-people-card cap-people-add" data-cap="field" method="post" aria-labelledby="pr-add">...email, name, title (each option's data-end), end date (max is the title's default)...</form>
</section>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the review's choices and Save review, the table's scroll region, each row's inline action (Retry or Renew) and its Actions menu, then the add form |
| Enter or ArrowDown on Actions | Opens the menu; the arrow keys move through it, Esc closes it (the form menu's own keys) |
| Arrow keys in a review item | Move between Keep and Remove (the browser's own radios) |
| Enter on a form's button | Posts it; on Remove, opens the confirm first |
| Esc in the remove confirm | Cancels, focus back on the page |
| Enter in the reason field | Changes the title; with no reason, says so beside the field and keeps focus there |

- Every inline action carries the person's name for a screen reader ("Renew to May 14, 2027 for Rosa Park"), and each Actions menu is named for its person ("Actions for Rosa Park"), so a column of buttons is not six "Actions".
- The person is the row header (`th scope="row"`), so each cell reads with their name.
- Each status is a word and a shape (ok, the running arc, critical, warning), never color alone; the shapes are hidden from the accessibility tree.
- The result line is a status region when it worked and an alert when it did not, with "Done:" or "Not done:" before the words.
- The review's tally is a polite live region.
- Forced colors: the cards' and the result's edges become CanvasText.
