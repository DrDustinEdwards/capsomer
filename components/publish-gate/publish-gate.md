---
name: publish-gate
title: Publish gate
summary: One region beside the publish button listing what stops a post going out, with a state per site.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [blocked, ready, held, published, one row per destination, required failing, advisory failing, passing checks folded, check that flips while you watch, publish button states, first publication previewed, republish at once, unpublish with Undo, form without a script hook, narrow column, comfortable density]
added: 0.3.0
source: dustinedwards.info admin (app/lib/editor/publish-transition.mjs, publish-policy.mjs, app/components/admin/publish-actions.tsx, editor-bar.tsx, live-notice.tsx, app/lib/admin/check-copy.mjs); Carrel's rule that an open flag holds publish; shadcn/ui Item and Accordion
replaces:
  - 'class="(publish-gate|publish-checks|checklist|preflight)[ "-]'
  - "className=\"(publish-gate|publish-checks|preflight)[ \"-]"
---

# Publish gate

## Usage

```html
<div class="cap-gate-bar">
  <!-- The page's own publish control comes first, so a keyboard user reaches it before the checks, paired with the region by data-gate and data-site: -->
  <div data-cap-actions data-gate="pg" data-site="example" data-btn-size="default">
    <button type="submit" name="intent" value="publish" class="cap-btn" data-cap-part="publish" data-site="example"
            data-variant="secondary" aria-disabled="true" aria-describedby="pg-sum">Publish blocked</button>
  </div>

  <section class="cap-gate" data-cap="publish-gate" id="pg" data-state="blocked" aria-labelledby="pg-h">
    <header class="cap-gate-head">
      <h2 class="cap-gate-title" id="pg-h">Publish checks</h2>
      <p class="cap-gate-summary" id="pg-sum" role="status" aria-live="polite" aria-atomic="true" data-cap-part="summary">
        <span class="cap-status" data-tone="crit">[critical glyph]Blocked</span>: 2 required checks failing on example.com
      </p>
    </header>
    <ul class="cap-rows cap-gate-all" data-cap="row-list" role="list" aria-labelledby="pg-h">
      <li class="cap-gate-section" data-section="sites">
        <h3 class="cap-gate-group-title" id="pg-g-sites">Destination</h3>
        <ul class="cap-gate-section-rows" role="list" aria-labelledby="pg-g-sites">
          <li class="cap-row cap-gate-site" id="pg-s-example" data-site="example" data-name="example.com" data-state="blocked" data-first data-tone="crit">
            <span class="cap-row-status" id="pg-s-example-s">[status]Blocked</span>
            <div class="cap-row-title"><span class="cap-gate-site-name">example.com</span></div>
            <p class="cap-row-detail" id="pg-s-example-d">2 required checks failing: The cover image has no alt text; The title is empty</p>
            <span class="cap-row-meta"></span>
            <!-- With several destinations each row holds its own buttons:
            <div class="cap-row-actions" data-cap-actions data-gate="pg" data-site="example" data-site-label="example.com">…</div> -->
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

```html
<a class="cap-btn" data-cap-part="view" href="https://example.com/blog/why-the-editor-waits">View<span class="cap-sr-only"> live page</span></a>
<button type="button" class="cap-btn" data-cap-part="unpublish" data-variant="quiet" data-site="example">Unpublish</button>
```

```ts
import { enhance, attachPublishGate, gateState, sortChecks, describeGate, siteState, worstState, countChecks } from "capsomer/behavior/publish-gate";

enhance(document, {
  publish: (siteIds) => api.publish(slug, siteIds), // resolve when it is live; reject with an Error saying why not
  unpublish: (siteIds) => api.unpublish(slug, siteIds),
});

const gate = attachPublishGate(region, hooks);
gate.setCheck("alt", { ok: true });                       // or flip data-ok on the row
gate.setHold("example", { by: "Rosa", reason: "review", untilLabel: "Fri 09:00" });

gateState(checks, hold);   // "blocked" | "held" | "ready"
sortChecks(checks);        // failing required, failing advisory, passing; stable
```

```tsx
import { PublishGate } from "capsomer/react/publish-gate";
<PublishGate label="Publish checks" sites={sites} checks={checks} publish={(ids) => api.publish(slug, ids)} unpublish={(ids) => api.unpublish(slug, ids)} />
```

## Accessibility

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

- The region is a `section` named by its heading, holding one `ul` (`role="list"`); each group is a list item named by its heading and holds its own list.
- The summary is `role="status"` with `aria-live="polite"` and `aria-atomic="true"`, and describes the publish buttons that are not ready (`aria-describedby`).
- Status is a glyph, a word and a color: "Failing", "Advisory", "Passed", "Blocked", "Held", "Ready", "Published".
- A published destination's button becomes a link "View" (named with the destination) and a button "Unpublish".
- Each check row's link is described by its status and detail (`aria-describedby`), so moving by link still says "Failing" and the fix.
- Forced colors: the region keeps its border; the critical edge turns CanvasText.
