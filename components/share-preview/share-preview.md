---
name: share-preview
title: Share preview
summary: How a page appears where it is shared, as a search result and as a social card, before it goes out, with a meter for how wide its title and description are against the width a result cuts at.
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
- **The result's title takes the accent text color**, as a link would, so the preview reads like a result, but it is not a link and takes no focus.
- **Each preview is a named group** ("Search result preview", "Social card preview"; `label` changes it), so a screen reader says what the text is before it reads it.

## HTML contract

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

React: `SerpPreview` (`url`, `title`, `description`, `note`, `label`) and `OgCardPreview` (`image`, `host`, `title`, `description`, `note`, `label`) from `capsomer/react/share-preview`.

## The width meter

`SerpWidthMeter` sits under a search title or description box and says how wide the text is as a desktop result sets it (Arial, 20 px for a title, 14 px for a description) against the width past which the result cuts it (600 and 920 px). It is the Meter, small, in the ok tone until the text is too wide, then the warn tone with "Google cuts it off" in words; too wide only warns, since the limit is an approximation. Its value is said as "412 of 600 pixels, 52 characters." and, past the cut, "Google cuts it off past about 600 pixels."

The widths and limits are Prelum's (`serpWidth`, `SERP_TITLE`, `SERP_DESCRIPTION` in `site-helpers/head`), the ones `prelum-audit` reports a too-wide title with, so the editor and the audit agree; they need no canvas, so a server render already shows the number. An app that measures in the browser's real font passes `measure(text)`, returning null while it cannot (the meter then says "Measuring").

```tsx
import { SerpWidthMeter } from "capsomer/react/share-preview";

<SerpWidthMeter label="Search title width" text={searchTitle} />
<SerpWidthMeter label="Description width" part="description" text={description} />
```

Props: `label`, `text`, `part` (`"title"` or `"description"`), `limit`, `measure`, `size` (default `"sm"`). `capsomer/behavior/share-preview` holds the pure part: `serpTextWidth(text, part)`, `serpReading(text, px, limit)` and `SERP_LIMITS`.

## Keyboard

Nothing in a preview takes focus. The page's order is the reading order.

## Accessibility

- Text is `--text`, `--muted` and `--accent-text` on `--surface`; each pair is in the contrast report.
- The card image must carry its own alt text. When the image is a stand-in, say so in the alt text and in the note, as the site admin does.

## Swaps

dustinedwards-info's `SerpPreview` and `OgPreview` (and `.serp-*`, `.og-*`) take it.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
