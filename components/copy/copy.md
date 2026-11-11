---
name: copy
title: Copy
summary: A button that copies another element's text, or shares a link, and says Copied or Copy failed in a bubble beside it.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [rest, copied, failed, icon only, with a label, share, repeated block]
added: 0.96.0
updated: 0.96.0
source: Chrome's Modern Web Guidance copy-button guide; replaces the copy code in germomics (copy-status.ts, use-copy-feedback.ts, CopyLink.tsx, site/share.ts), Foxhound (copy-link-button.tsx, islands/copy-link.ts, api-keys RevealKey), dustinedwards.info (lib/clipboard.ts), the Capsid Portal (App.tsx) and Capsomer's own media actions
replaces:
  - 'navigator\.clipboard\.writeText'
  - 'execCommand\(["'']copy'
  - 'navigator\.share\('
---

# Copy

A `.cap-btn` that copies the text of another element (a code block, an address, a key, a field) and a status bubble beside it. The bubble is the visible message and the live region at once, so a sighted reader and a screen reader get the same words for both outcomes. With `command="--share"` it opens the system share sheet for a link, and copies the link where there is none.

## When to use it

A value someone will paste elsewhere: an API key, a post's address, a code sample, an email address in an admin row.

## When not to

- **The browser already offers it**: a selected passage in prose. Prelum's selection link covers that.
- **A download**: a link with `download`, not a copy.

## The default and its reason

- **Invoker Commands** (`command="--copy" commandfor="<id>"`) name the target in markup, so no button needs its own wiring. Where the browser lacks them (`CommandEvent`), one click listener resolves `commandfor` the same way; only one path is registered, so a press never copies twice.
- **The Async Clipboard API, and nothing older.** Sites are served over HTTPS; a refused write shows Copy failed. `copyText` never throws.
- **The bubble sits outside the button** (a button's children are presentational, so a live region inside one is not read), and is shown with opacity only, so it stays in the accessibility tree.
- **The button is never disabled while a message shows**: copying is idempotent, a disabled button drops focus, and a failed copy can be retried at once. A repeat press restarts the message.
- **A repeated message gets a no-break space**, because VoiceOver skips a message equal to the one before it.
- **Not color alone**: the icon turns to a check on success, and both outcomes are words.
- **A canceled share says nothing**: an `AbortError` from the share sheet is the person's choice, not a failure.
- Copied stays 2.5 s; Copy failed stays 8 s, time to copy by hand.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the button; in a repeated block, also reveals it |
| Enter, Space | Copies, or opens the share sheet |

## Accessibility

- An icon-only button is named for what it copies (`aria-label="Copy API key"`); a button with visible text is named by that text.
- At least `var(--target)` in each direction, and allowed to grow.
- In a repeated block the button is hidden with opacity only where hover exists, and shows on hover, on focus within the block and while its message shows. On touch it stays visible, in flow beside the block. It is never `hidden`, `inert` or `aria-hidden`.
- Forced colors: the bubble has an edge.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<span class="cap-copy">
  <button type="button" class="cap-btn cap-copy-button" data-variant="quiet"
          command="--copy" commandfor="api-key" aria-label="Copy API key">
    <span class="cap-copy-icon"><svg aria-hidden="true">…</svg></span>
    <span class="cap-copy-done"><svg aria-hidden="true">…</svg></span>
  </button>
  <span class="cap-copy-tip" role="status"></span>
</span>
<code id="api-key">fh_live_…</code>
```

A repeated block: wrap it in `.cap-copyable` with the `.cap-copy` first or last inside it. Share: `command="--share"` with `commandfor` naming a link (its address is shared) or any element holding the address. `data-cap-copied`, `data-cap-failed` and `data-cap-share-title` on the button change the words.

`import { enhance } from "capsomer/behavior/copy"` attaches once for the whole page. `copyText(text)` and `shareLink({ url, title })` are exported for code that copies without the button.

In React, `import { CopyButton, useCopy } from "capsomer/react/copy"`:

```tsx
<CopyButton text={key} aria-label="Copy API key" />
<CopyButton share={{ url, title }}>Share</CopyButton>
```

`useCopy()` gives `{ copy, share, state, message }` for a control that is not a button of its own.

## Exceptions in production

None yet.
