---
name: copy
title: Copy
summary: A button that copies another element's text, or shares a link, and says Copied or Copy failed in a bubble beside it.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [rest, copied, failed, icon only, with a label, share, repeated block]
added: 0.99.0
updated: 0.99.0
source: Chrome's Modern Web Guidance copy-button guide; replaces the copy code in germomics (copy-status.ts, use-copy-feedback.ts, CopyLink.tsx, site/share.ts), Foxhound (copy-link-button.tsx, islands/copy-link.ts, api-keys RevealKey), dustinedwards.info (lib/clipboard.ts), the Capsid Portal (App.tsx) and Capsomer's own media actions
replaces:
  - 'navigator\.clipboard\.writeText'
  - 'execCommand\(["'']copy'
  - 'navigator\.share\('
---

# Copy

## Usage

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

```tsx
<CopyButton text={key} aria-label="Copy API key" />
<CopyButton share={{ url, title }}>Share</CopyButton>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to the button; in a repeated block, also reveals it |
| Enter, Space | Copies, or opens the share sheet |

- An icon-only button is named for what it copies (`aria-label="Copy API key"`); a button with visible text is named by that text.
- At least `var(--target)` in each direction, and allowed to grow.
- In a repeated block the button is hidden with opacity only where hover exists, and shows on hover, on focus within the block and while its message shows. On touch it stays visible, in flow beside the block. It is never `hidden`, `inert` or `aria-hidden`.
- Forced colors: the bubble has an edge.
