---
name: share-preview
title: Share preview
summary: How a page appears where it is shared: as a search result and as a social card, before it goes out.
parts: [css, react]
tool: native
states: [search result, search result with a note, social card, social card with a note in a narrow space]
added: 0.5.0
source: The site admin's SerpPreview and OgPreview (dustinedwards-info app/components/admin/social-previews.tsx, .serp-* and .og-* in app/admin.css; PR #320, gap 5)
replaces:
  - 'class="[^"]*\b(serp-preview|og-preview)\b'
  - 'className="[^"]*\b(serp-preview|og-preview)\b'
---

# Share preview

Two read-only previews an editor looks at before publishing: a search result (`.cap-serp`) and a social card (`.cap-og-card`).

**Provenance.** EXTRACTED from the site admin's `SerpPreview` and `OgPreview` and their CSS (`.serp-*`, `.og-preview-*`), renamed to `cap-serp` and `cap-og-card`. Nothing similar existed in Capsomer, so this is a new component. What stayed in the app: where the text comes from (`postSocial`), cutting it to the search engine's limits and deciding whether to show a note. The component draws what it is given.

## When to use it

Beside the editor of a post or page, so the person sees the title, description and image as a search engine or a social network will show them.

## When not to

- **Showing a live result or a link**: these are previews and nothing in them is interactive. A real result is a link.
- **A cover image picker**: that is the media component.

## The default and its reason

- **The text arrives already cut.** Search engines cut by pixel width, not by characters, so the limit is the app's approximation; the component says nothing about it except through the `note` the app passes.
- **The card's image box has the card's real 1200 x 630 shape** (`aspect-ratio`), with the image covering it, so the box never implies a crop the scrapers will not make. The image is whatever the app passes: an `img` with real alt text, or an `svg`.
- **The result's title takes the accent text colour**, as a link would, so the preview reads like a result, but it is not a link and takes no focus.
- **Each preview is a named group** ("Search result preview", "Social card preview"; `label` changes it), so a screen reader says what the text is before it reads it.

## HTML contract

```html
<div class="cap-serp" role="group" aria-label="Search result preview">
  <p class="cap-serp-url">dustinedwards.info › blog › post</p>
  <p class="cap-serp-title">Title</p>
  <p class="cap-serp-description">Description</p>
  <p class="cap-serp-note">Optional note</p>
</div>

<div class="cap-og-card" role="group" aria-label="Social card preview">
  <div class="cap-og-card-image"><img src="..." alt="..." width="1200" height="630" /></div>
  <div class="cap-og-card-body">
    <p class="cap-og-card-host">dustinedwards.info</p>
    <p class="cap-og-card-title">Title</p>
    <p class="cap-og-card-description">Description (optional)</p>
  </div>
  <p class="cap-og-card-note">Optional note</p>
</div>
```

React: `SerpPreview` (`url`, `title`, `description`, `note`, `label`) and `OgCardPreview` (`image`, `host`, `title`, `description`, `note`, `label`) from `capsomer/react/share-preview`.

## Keyboard

Nothing in a preview takes focus. The page's order is the reading order.

## Accessibility

- Text is `--text`, `--muted` and `--accent-text` on `--surface`; each pair is in the contrast report.
- The card image must carry its own alt text. When the image is a stand-in, say so in the alt text and in the note, as the site admin does.

## Swaps

dustinedwards-info's `SerpPreview` and `OgPreview` (and `.serp-*`, `.og-*`) take it.

Last checked by hand: not yet. Automated: see the site's Tests page.
