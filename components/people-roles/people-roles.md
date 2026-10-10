---
name: people-roles
title: People and roles
summary: An app's members page. Who has access, their title, when it ends and whether Cloudflare matches, with add, change title, renew, remove, the term review and each person's history.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [a lead's page, review open, changing a title, one person's history, an Owner's page after adding someone, a change Cloudflare refused, nobody added yet]
added: 0.7.0
updated: 0.7.0
source: capsid docs/design/design-identity-roles.md, "The members page"; Dustin's rulings of 2026-10-09
replaces:
  - 'href="/people"'
---

# People and roles

The one members page every app with staff uses: the lab, txasm, Foxing and Foxing Edu. Each app keeps its own list and its own titles; this component draws them the same way everywhere. Adding a person here is what puts their email on the app's Cloudflare Access allow list, and removing them takes it off, so nobody edits Cloudflare by hand.

## When to use it

For the people who run an app (lab managers and workers, a society's officers, a press's staff), each with a title that expires at the end of a term. The server decides everything with site-runtime's `./members` (`checkChange`, `defaultEndDate`) and passes the page only what the viewer may do: `manageable` on each row, `renewTo`, and the titles below the viewer's layer.

## When not to

For an app's users (readers, teachers, merchants, authors), who sign in through the app's own login and take no Cloudflare seat: they belong in that app's own user admin. For agents and their grants, use `permission-matrix` with `switch-reason`. To show who holds which permission without changing anything, use `permission-matrix`.

## The default and its reason

- **Every action is a form post with an `intent`** (`add`, `change_title`, `renew`, `remove`, `retry`, `review`), so the page works with no script, and the server answers with `result`. The script adds the confirm before a removal, the end date that follows the chosen title, and the review's running tally. With `onIntent`, React runs the same posts in place.
- **A Cloudflare column on every row**, in words and a shape: "Ready: they can sign in", "Waiting for Cloudflare" (the running arc) with Retry, or "Cloudflare refused" with Cloudflare's own reason and Retry. A change is never shown as done before the allow list matches it (design: "a failure is shown and retried, never ignored").
- **The end date is a date, never a countdown alone.** Within three weeks of it the row says "Ends 18 Dec 2026, in 18 days" in bold beside the warning shape, the same window that opens the review.
- **One action on the row, the rest in its Actions menu.** The row shows Retry while Cloudflare has not caught up, otherwise Renew; Change title, History and Remove (last, after a separator) sit in the shared form menu (`menu`), so six people do not make thirty buttons. `rowActions(person)` decides which.
- **Renew is one click** and names the date it sets ("Renew to 14 May 2027"), which the server worked out.
- **Remove asks first** (any submit whose `intent` is `remove`, found by its submitter), saying what follows: refused on the next request, off the allow list, seat freed, row kept. The confirm is the shared confirm dialog; with no script, the post comes back as the confirm page (`ConfirmPage`) until it carries `confirmed=yes`.
- **Change title needs a one-line reason**, recorded with the change. It opens as its own row under the person, by the address (`?change=<email>`), so the table's columns stay put and the form works with no script.
- **The review is a checklist at the top** while one is open: Keep or Remove per person, a tally that counts what is left, and the rule in one sentence: anyone not answered loses access on the end date.
- **Removed and expired people stay in the list, quieter**, so their runs and edits keep their name. An expired person can be renewed; a removed one is added again.
- **The viewer's own row is marked You and has no actions**: nobody manages their own layer.
- **The table scrolls on a phone** (DEFAULTS.md), in a labelled, focusable region.

## Matches

shadcn/ui `Table` (from `table`), `Field`, `Input` and `NativeSelect` (from `field` and `select`), `Badge` (the status words and the You pill, from `status`), `Button`, `Alert Dialog` (the remove confirm, from `confirm-dialog`), `RadioGroup` (the review's Keep or Remove) and `Card` (the review and the add form). shadcn has no members page; the closest is its "Team members" block, a card with a role select per person. Deliberately different: a role here changes only with a reason, and every row says whether Cloudflare has caught up.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the review's choices and Save review, the table's scroll region, each row's inline action (Retry or Renew) and its Actions menu, then the add form |
| Enter or ArrowDown on Actions | Opens the menu; the arrow keys move through it, Esc closes it (the form menu's own keys) |
| Arrow keys in a review item | Move between Keep and Remove (the browser's own radios) |
| Enter on a form's button | Posts it; on Remove, opens the confirm first |
| Esc in the remove confirm | Cancels, focus back on the page |
| Enter in the reason field | Changes the title; with no reason, says so beside the field and keeps focus there |

## Accessibility

- Every inline action carries the person's name for a screen reader ("Renew to 14 May 2027 for Rosa Park"), and each Actions menu is named for its person ("Actions for Rosa Park"), so a column of buttons is not six "Actions".
- The person is the row header (`th scope="row"`), so each cell reads with their name.
- Each status is a word and a shape (ok, the running arc, critical, warning), never colour alone; the shapes are hidden from the accessibility tree.
- The result line is a status region when it worked and an alert when it did not, with "Done:" or "Not done:" before the words.
- The review's tally is a polite live region.
- Forced colours: the cards' and the result's edges become CanvasText.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

The React wrapper renders the contract, and the states page is generated from it. In outline:

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
        <label class="cap-check"><input type="radio" name="answer-0" value="keep"> Keep, until 14 May 2027</label>
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
          <td><span class="cap-people-end" data-soon>[warn glyph]Ends 18 Dec 2026, in 18 days</span></td>
          <td><span class="cap-status" data-tone="ok">[ok glyph]Ready: they can sign in</span></td>
          <td class="cap-people-actions"><div class="cap-people-acts">
            <form method="post" action="/lab/members"><input type="hidden" name="intent" value="renew"><input type="hidden" name="email" value="rosa.park@example.edu"><button type="submit" class="cap-btn" data-size="sm">Renew to 14 May 2027<span class="cap-sr-only"> for Rosa Park</span></button></form>
            <details class="cap-menu-form" data-cap="menu-form"><summary class="cap-btn cap-menu-trigger" aria-label="Actions for Rosa Park">Actions[chevron]</summary>
              <form class="cap-popover cap-menu" action="/lab/members" method="post"><input type="hidden" name="email" value="rosa.park@example.edu">
                <a class="cap-option cap-menu-item" href="?change=rosa.park%40example.edu">Change title</a>
                <a class="cap-option cap-menu-item" href="?person=rosa.park%40example.edu">History</a>
                <hr class="cap-listbox-separator cap-menu-separator">
                <button type="submit" class="cap-option cap-menu-item" name="intent" value="remove" data-tone="crit">Remove</button>
              </form></details>
          </div></td>
        </tr>
        <tr class="cap-people-edit" id="pr-change-rosa"><td colspan="5"><form class="cap-people-change" data-cap="field" method="post">...title select, reason (required), Change title, Cancel...</form></td></tr>
      </tbody>
    </table>
  </div>

  <section class="cap-people-history" aria-labelledby="pr-hi">...<ol class="cap-people-history-list"><li class="cap-people-history-item"><time class="cap-people-history-when">...</time><div><p class="cap-people-history-what">Renewed, until 14 May 2027</p><span class="cap-people-history-by">By Maya Chen</span></div><span class="cap-status" data-tone="info">...Waiting for Cloudflare</span></li></ol></section>

  <form class="cap-people-card cap-people-add" data-cap="field" method="post" aria-labelledby="pr-add">...email, name, title (each option's data-end), end date (max is the title's default)...</form>
</section>
```

In React, `import { PeopleRoles } from "capsomer/react/people-roles"` and pass `data` (`heading`, `lead`, `people`, `titles`, and when the address asks, `review`, `history`, `changing`, `result`), `action`, and optionally `onIntent(intent, fields)`, `hrefFor` and `closeHref`. In plain HTML, `import { enhance } from "capsomer/behaviour/people-roles"`. The words and the row's actions come from pure functions an app can reuse: `rowActions`, `accessText`, `endsSoon`, `syncText`, `actionText`, `cloudflareText`, `endHelp`, `tallyText`, `removeBody`, `dayText`, `timeText`.

What each post carries: `intent` and `email` on every row action; `title` and `reason` on `change_title`; `email`, `name`, `title` and `end_date` on `add`; `answer-<n>` (`keep` or `remove`) with `email-<n>` on `review`; `confirmed=yes` on a confirmed `remove`. The server checks every one again with `checkChange`; the page offering an action is not permission to take it.

## Exceptions in production

None yet.
