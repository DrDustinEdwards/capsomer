---
name: error-ad
title: Error ad
summary: The ad slot of an error page, one vintage-style ad as decoration at the foot of a 404 or a 500.
parts: [css, react]
tool: native
states: [corner, large]
added: 0.92.0
source: dustinedwards.info's utility ads (app/utility-ads/, components/utility-ad.tsx)
replaces:
  - 'class="ad"'
  - 'utility-ads.css'
---

# Error ad

One original, period-style ad (1940s to 1970s) drawn as inline SVG at the foot of a utility page: a 404, a 500, an offline page. It is decoration that gives a dead end some character; it links nowhere and says nothing the page needs.

## When to use it

The error and utility pages of a site that has ads of its own to show. The ads are the site's content (each an `ad.json` and an `art.svg` in the site's repository); this component checks them, draws them and picks one.

## When not to

- **Anything the reader must read or click**: the ad is hidden from assistive technology and takes no pointer.
- **A real advertisement** or a sponsor: this is art, not an ad unit.

## The default and its reason

- **Inline SVG, real text in real fonts** (Bangers and Alfa Slab One, OFL 1.1, self-hosted with `font-display: optional`), so the lettering is crisp at every size and costs no image request.
- **Data, not drawings**: an ad is a list of parts (`text`, `burst`, `rect`, `use` of a symbol in its art). `adProblems(ad, art)` lists everything wrong with one, so a site's test gates each ad folder.
- **`scopeArt(art, id)`** prefixes the art's ids with the ad's, so two ads on one page never collide.
- **`chooseAd(ads, search)`**: the ad `?ad=` names, else a random one, so a gallery can link to each.
- **The ink follows the theme**: `fill: "ink"` is dark on a light page and light on a dark one.
- **Loaded only where it shows**: pass the stylesheet's and fonts' emitted addresses (`?url`) as `stylesheet` and `fonts`, never an import in the root error boundary.
- **Not printed, and not drawn in forced colors**: it is decoration.

## Keyboard

None. The ad has no controls.

## Accessibility

- `aria-hidden="true"` on the whole ad, and `focusable="false"` on its SVGs; the page's own message carries the content.
- `pointer-events: none` and no links.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

```html
<div class="cap-ad" data-size="corner" aria-hidden="true" data-ad="field-notes">
  <svg class="cap-ad-defs" focusable="false"><!-- the scoped art's symbols --></svg>
  <svg class="cap-ad-art" viewBox="0 0 600 360" focusable="false">
    <g><text class="cap-ad-f-display">FIELD NOTES!</text></g>
    <text class="cap-ad-f-serif cap-ad-ink">The pocket notebook</text>
    <text class="cap-ad-f-slab">NEW!</text>
  </svg>
</div>
```

React: `ErrorAd` from `capsomer/react/error-ad` takes `ad` (an `Ad` with its scoped `art`), `size` (`corner` or `large`), `stylesheet` and `fonts`. The model (`adProblems`, `burstPoints`, `scopeArt`, `chooseAd`) is `capsomer/behavior/error-ad`.

## Exceptions in production

None yet.
