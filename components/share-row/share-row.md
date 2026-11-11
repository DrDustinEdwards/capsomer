---
name: share-row
title: Share row
summary: A "Share" label and a plain link to each service's own share intent, ruled off under a post's lead.
parts: [css, behavior, react]
tool: native
states: [X and LinkedIn, every service, with a copy button, hover]
added: 0.93.0
source: Foxhound's ShareRow (app/components/blog/share-row.tsx, ported from Recova's ShareBar)
replaces:
  - 'function ShareRow'
  - 'x.com/intent/tweet'
---

# Share row

A row under a post's lead: the word Share, then X, LinkedIn and any other service the site picks, each a plain link to that service's own share page with the post's address and title filled in, and the copy button for "Copy link".

## When to use it

On a post or an article that people pass on, once, under the lead or at the foot.

## When not to

- **Following the site** (podcast apps, a feed): subscribe links.
- **A share sheet in an app**: the platform's `navigator.share()` from a button.

## The default and its reason

- **Plain links, no script, no tracker.** Each service's own intent address (`x.com/intent/tweet`, `linkedin.com/sharing/share-offsite`, `bsky.app/intent/compose`, `facebook.com/sharer`, `mailto:`) does the sharing; no service's script loads on the page.
- **Each link names the service in words** ("X", "LinkedIn") beside its mark, and its accessible name says the action ("Share on X").
- **X and LinkedIn by default**; a site adds Bluesky, Facebook or Email with `targets`.
- **"Copy link" is Capsomer's copy button**, passed as a child, so the copied state and its announcement are the copy component's.
- **The row is a named group** ("Share this page"); the visible "Share" label is hidden from assistive technology so it is not read twice.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the services, then the copy button |
| Enter | Opens the service's share page |

## Accessibility

- Every link is at least `--target` tall and its text reaches 4.5:1 (checked in the spec).
- Marks are `aria-hidden`; the names are text.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

```html
<div class="cap-share" role="group" aria-label="Share this page">
  <span class="cap-share-label" aria-hidden="true">Share</span>
  <a class="cap-share-link" href="https://x.com/intent/tweet?text=...&url=..." aria-label="Share on X" rel="external noopener"><svg aria-hidden="true">...</svg>X</a>
  <a class="cap-share-link" href="https://www.linkedin.com/sharing/share-offsite/?url=..." aria-label="Share on LinkedIn" rel="external noopener"><svg aria-hidden="true">...</svg>LinkedIn</a>
  <!-- the copy button -->
</div>
```

React: `ShareRow` from `capsomer/react/share-row` takes `url`, `title`, `targets`, `label` and `children` (the copy button). `shareHref(target, url, title)` from `capsomer/behavior/share-row` builds an address. Load `share-row.css`.

## Exceptions in production

None yet.
