---
name: publish-gate
title: Publish gate
summary: One region beside the publish button that lists what stops a post going out, required apart from advisory, each cause linked to where it is, with a state for every destination site.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [blocked, ready, held, published, one row per destination, required failing, advisory failing, passing checks folded, check that flips while you watch, publish button states, first publication previewed, republish at once, unpublish with Undo, form without a script hook, narrow column, comfortable density]
added: 0.3.0
source: dustinedwards.info admin (app/lib/editor/publish-transition.mjs, publish-policy.mjs, app/components/admin/publish-actions.tsx, editor-bar.tsx, live-notice.tsx, app/lib/admin/check-copy.mjs); Carrel's rule that an open flag holds publish; shadcn/ui Item and Accordion
replaces:
  - 'class="(publish-gate|publish-checks|checklist|preflight)[ "-]'
  - "className=\"(publish-gate|publish-checks|preflight)[ \"-]"
---

# Publish gate

The answer to "can this go out?" in one place, beside the button that sends it. If it cannot, the region says which required checks are failing, names the cause of each, and links to the passage, field or setting that causes it, with a hint for the fix.

**Provenance.** MIXED. EXTRACTED from the site admin: the publish transitions and their one ceremony, only for a post that has never been public, with the sentence it shows (`publish-transition.mjs`, `FIRST_PUBLICATION_NOTE`); the policy that publishing for the first time is a decision for the owner and that an unknown intent fails closed to a draft (`publish-policy.mjs`); the unpublish that is not destructive but takes something off the public site; a failing check named in the words the operator uses, with the finding in plain English, failing ones first, and a repair only where there is one (`check-copy.mjs`, ADMIN-DESIGN "The overview"); the publish button as a real submit that works before script (`publish-actions.tsx`); results in a polite region and a refusal in an alert (`live-notice.tsx`). Carrel's rule that an open flag holds publish until it is fixed or dismissed is why a required check is a hold on the button. REWROTE: the region itself (the admin shows these as a table on the overview and as a disabled button), the destinations list, the held state and the live summary.

## When to use it

In an editor or a draft page, beside the publish button, for anything that is checked before it goes public: a post, a page, a procedure, a publication, to one site or several.

## When not to

- The flags raised against passages of the text, with their quotes and suggestions, are the flag list (`components/flag-list`). A gate row links to the field or passage; the flag list is the detail behind a text-level problem.
- Whole-site health (drift, backups) is a table of checks with repairs, as the admin's overview has it.
- A confirmation before a one-way action is the confirm dialog; the gate uses it for a first publication and does not replace it.

## The default and its reason

- **Failing checks first, required apart from advisory, passing ones folded.** Two groups, "Required, 2 failing" then "Advisory, 3", and "9 checks passed" in a disclosure (the person is not asked to read nine passes to find two failures). A group with nothing failing is not shown; with nothing failing at all the region says "No checks are failing."
- **Every row names its cause and links to it.** The row's one link is the cause in words ("The cover image has no alt text") and goes to the passage, field or setting that causes it (`href="#field-alt"`). The detail gives the rule's name and the fix: "Alt text. Fix: Describe what the image shows, in a sentence."
- **Four states, each shape, word and colour.** Blocked (critical glyph), Held (square), Ready (tick), Published (tick). Blocked wins over held, held over ready; the overall state is the worst of the destinations'.
- **A blocked button is `aria-disabled="true"`, never `disabled`, and described by the summary.** A keyboard or screen reader user can reach it and hear "Blocked: 2 required checks failing on dustinedwards.info"; a `disabled` button is skipped and says nothing. Pressing it does nothing. It reads "Publish blocked"; a held one "Publish held"; the one at work "Publishing..." with `aria-busy`.
- **The summary is a polite live region** that is written only when its words change, so a check that flips announces once. The region is a labelled `section`.
- **One row per destination, each with its own state and button.** Publishing to each site is separate: the sites differ in what blocks them (a site's canonical address is its own check), and one blocked site does not stop another. The overall state is the worst.
- **A hold is a person or a schedule, and says so**: "Held for review by Rosa until Fri 09:00", with a note for anything more. Nothing in the gate lifts a hold; the person who placed it does.
- **Publishing is one-way for a first publication, so it is previewed.** The click opens the shared confirm dialog listing the destination and what a first publication does ("It has never been public. Publishing puts it on the blog, in the feed, the sitemap, the search index and the AI answer layer."), with focus on Cancel. Republishing something that has been public is reversible (Unpublish) and happens at once. Unpublishing happens at once and offers Undo in the message region.
- **Works before script.** Every row is in the delivered HTML. The publish button is a real `submit` (`name="intent" value="publish"`): in a form with no script hook it posts, a first publication with the intent `publish-confirmed` after the preview, and the server must refuse an unconfirmed first publication as the admin's does.
- **An app flips data, the region follows.** A check row's `data-ok`, a destination's `data-hold-text` or `data-published-at` changed anywhere redraws the groups, counts, destination rows, buttons and summary (a `MutationObserver`), or call `setCheck`, `setHold`, `setPublished`.

## The shadcn component it matches

Item (`item.tsx`) for the rows, Accordion for the folded passes, Badge for the status words, Button for the pair, Alert for the summary's place above the list. shadcn has no publish gate, destinations or live summary.

## Deliberately different

- **The blocked button is not `disabled`** (shadcn's Button dims a disabled button and takes it out of the tab order; here it stays focusable so its reason can be heard).
- **No tabs and no stepper.** A checklist of eleven items is a list; a person reads two failing rows, not a wizard.
- **The first publication is previewed in the shared confirm dialog**, whose perform button is in the danger style. That is the dialog's one look for a one-way change; the title and the list say what it does.
- **The summary sentence is composed from the checks, not written by hand**, so it cannot say Ready while a required check fails.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the Publish button first, then each check's link, in reading order; a blocked or held Publish button is reachable and its reason is read |
| Enter or Space on Publish (ready) | Opens the preview for a first publication, with focus on Cancel; publishes at once for a republication |
| Enter or Space on Publish (blocked or held) | Does nothing; the summary is its description |
| Enter on a check's link | Goes to the passage, field or setting that causes it |
| Enter or Space on Unpublish | Takes it off the public site at once and says so with Undo |
| Enter or Space on the "9 checks passed" summary | Opens or closes the passing checks |
| `j`, `k` | Move between the checks' links (when single-key shortcuts are on) |
| Esc in the preview | Closes it; nothing is published |
| `z` | Runs the newest Undo in the message region |

## Accessibility

- The region is a `section` named by its heading, holding one `ul` (`role="list"`); each group is a list item named by its heading and holds its own list.
- The summary is `role="status"` with `aria-live="polite"` and `aria-atomic="true"`, and describes the publish buttons that are not ready (`aria-describedby`).
- Status is a glyph, a word and a colour: "Failing", "Advisory", "Passed", "Blocked", "Held", "Ready", "Published".
- A published destination's button becomes a link "View" (named with the destination) and a button "Unpublish".
- Each check row's link is described by its status and detail (`aria-describedby`), so moving by link still says "Failing" and the fix.
- Forced colours: the region keeps its border; the critical edge turns CanvasText.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

The region and the button it describes:

```html
<div class="cap-gate-bar">
  <!-- The page's own publish control comes first, so a keyboard user reaches it before the checks, paired with the region by data-gate and data-site: -->
  <div data-cap-actions data-gate="pg" data-site="dustinedwards" data-btn-size="default">
    <button type="submit" name="intent" value="publish" class="cap-btn" data-cap-part="publish" data-site="dustinedwards"
            data-variant="secondary" aria-disabled="true" aria-describedby="pg-sum">Publish blocked</button>
  </div>

  <section class="cap-gate" data-cap="publish-gate" id="pg" data-state="blocked" aria-labelledby="pg-h">
    <header class="cap-gate-head">
      <h2 class="cap-gate-title" id="pg-h">Publish checks</h2>
      <p class="cap-gate-summary" id="pg-sum" role="status" aria-live="polite" aria-atomic="true" data-cap-part="summary">
        <span class="cap-status" data-tone="crit">[critical glyph]Blocked</span>: 2 required checks failing on dustinedwards.info
      </p>
    </header>
    <ul class="cap-rows cap-gate-all" data-cap="row-list" role="list" aria-labelledby="pg-h">
      <li class="cap-gate-section" data-section="sites">
        <h3 class="cap-gate-group-title" id="pg-g-sites">Destination</h3>
        <ul class="cap-gate-section-rows" role="list" aria-labelledby="pg-g-sites">
          <li class="cap-row cap-gate-site" id="pg-s-dustinedwards" data-site="dustinedwards" data-name="dustinedwards.info" data-state="blocked" data-first data-tone="crit">
            <span class="cap-row-status" id="pg-s-dustinedwards-s">[status]Blocked</span>
            <div class="cap-row-title"><span class="cap-gate-site-name">dustinedwards.info</span></div>
            <p class="cap-row-detail" id="pg-s-dustinedwards-d">2 required checks failing: The cover image has no alt text; The title is empty</p>
            <span class="cap-row-meta"></span>
            <!-- With several destinations each row holds its own buttons:
            <div class="cap-row-actions" data-cap-actions data-gate="pg" data-site="dustinedwards" data-site-label="dustinedwards.info">…</div> -->
          </li>
        </ul>
      </li>
      <li class="cap-gate-section" data-section="required">
        <h3 class="cap-gate-group-title" id="pg-g-req">Required, 2 failing</h3>
        <ul class="cap-gate-section-rows" role="list" aria-labelledby="pg-g-req">
          <li class="cap-row cap-check" id="pg-c-alt" data-check="alt" data-name="Alt text" data-required data-ok="false"
              data-cause="The cover image has no alt text" data-pass="Every image has alt text"
              data-href="#field-alt" data-fix="Describe what the image shows, in a sentence." data-order="0" data-tone="crit">
            <span class="cap-row-status" id="pg-c-alt-s">[status]Failing</span>
            <div class="cap-row-title"><a href="#field-alt" aria-describedby="pg-c-alt-s pg-c-alt-d">The cover image has no alt text</a></div>
            <p class="cap-row-detail" id="pg-c-alt-d"><span class="cap-check-name">Alt text</span>. <span class="cap-check-fix">Fix: Describe what the image shows, in a sentence.</span></p>
            <span class="cap-row-meta"></span>
          </li>
        </ul>
      </li>
      <li class="cap-gate-section" data-section="advisory">…the same, headed "Advisory, 3"…</li>
      <li class="cap-gate-section" data-section="passed">
        <details class="cap-disclosure">
          <summary>9 checks passed</summary>
          <div class="cap-disclosure-body"><ul class="cap-gate-section-rows" role="list" aria-label="Passing checks">…rows with data-ok="true"…</ul></div>
        </details>
      </li>
    </ul>
    <p class="cap-gate-clear" data-cap-part="clear" hidden>No checks are failing.</p>
  </section>

</div>
```

The button in each state: Publish (`data-variant="primary"`, no `aria-disabled`); Publishing... (`aria-busy="true" aria-disabled="true"`); Publish blocked and Publish held (`aria-disabled="true" aria-describedby="pg-sum"`); published, a link and a button:

```html
<a class="cap-btn" data-cap-part="view" href="https://dustinedwards.info/blog/why-foxhound-waits">View<span class="cap-sr-only"> live page</span></a>
<button type="button" class="cap-btn" data-cap-part="unpublish" data-variant="quiet" data-site="dustinedwards">Unpublish</button>
```

A held destination has `data-hold-text="Held for review by Rosa until Fri 09:00"` and optional `data-hold-note`; a published one has `data-published-at` (ISO) and `data-published-url`; `data-first` marks one that has never been public.

```ts
import { enhance, attachPublishGate, gateState, sortChecks, describeGate, siteState, worstState, countChecks } from "capsomer/behaviour/publish-gate";

enhance(document, {
  publish: (siteIds) => api.publish(slug, siteIds), // resolve when it is live; reject with an Error saying why not
  unpublish: (siteIds) => api.unpublish(slug, siteIds),
});

const gate = attachPublishGate(region, hooks);
gate.setCheck("alt", { ok: true });                       // or flip data-ok on the row
gate.setHold("dustinedwards", { by: "Rosa", reason: "review", untilLabel: "Fri 09:00" });

gateState(checks, hold);   // "blocked" | "held" | "ready"
sortChecks(checks);        // failing required, failing advisory, passing; stable
```

Each `check` is `{ id, name, required, ok, cause, pass?, href?, fix?, site? }`; a destination is `{ id, name, hold?, published?, first? }`. The page needs one message region (`components/message`) for results and Undo. In React:

```tsx
import { PublishGate } from "capsomer/react/publish-gate";
<PublishGate label="Publish checks" sites={sites} checks={checks} publish={(ids) => api.publish(slug, ids)} unpublish={(ids) => api.unpublish(slug, ids)} />
```

Load `row-list.css`, `status.css`, `button.css`, `disclosure.css`, `message.css`, `time.css` and `confirm-dialog.css` with `publish-gate.css`.

## Exceptions in production

None yet.
