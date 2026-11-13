---
name: share-preview
title: Share preview
summary: How a page appears when shared, as a search result and social card, with a width meter.
group: pattern
parts: [css, behavior, react]
tool: native
states: [search result, search result with a note, social card, social card with a note in a narrow space, width meter that fits, width meter past the cut]
added: 0.5.0
updated: 0.98.0
source: The site admin's SerpPreview and OgPreview (dustinedwards-info app/components/admin/social-previews.tsx, .serp-* and .og-* in app/admin.css; PR #320, gap 5); Carrel's WidthMeter (app/components/editor/search-fields.tsx, app/lib/serp-width.ts)
replaces:
  - 'class="(?:[^"]*\s)?(serp-preview|og-preview)[\s"]'
  - 'className="(?:[^"]*\s)?(serp-preview|og-preview)[\s"]'
  - "function WidthMeter\\b"
  - "measureText\\(text\\)\\.width"
---

# Share preview

## Usage

```html
<div class="cap-serp" role="group" aria-label="Search result preview">
  <p class="cap-serp-url">example.com › blog › post</p>
  <p class="cap-serp-title">Title</p>
  <p class="cap-serp-description">Description</p>
  <p class="cap-serp-note">Optional note</p>
</div>

<div class="cap-og-card" role="group" aria-label="Social card preview">
  <div class="cap-og-card-image"><img src="..." alt="..." width="1200" height="630" /></div>
  <div class="cap-og-card-body">
    <p class="cap-og-card-host">example.com</p>
    <p class="cap-og-card-title">Title</p>
    <p class="cap-og-card-description">Description (optional)</p>
  </div>
  <p class="cap-og-card-note">Optional note</p>
</div>
```

## Accessibility

Nothing in a preview takes focus. The page's order is the reading order.

- Text is `--text`, `--muted` and `--accent-text` on `--surface`; each pair is in the contrast report.
- The card image must carry its own alt text. When the image is a stand-in, say so in the alt text and in the note, as the site admin does.
