---
name: picture
title: Picture
summary: What a stored image shows while it loads (its placeholder and main color), and the pause control an animated image needs, for site-runtime's pictureProps and Prelum's images alike.
parts: [css, react]
tool: native
states: [placeholder while loading, loaded, main color only, animated and playing, animated and paused, reduced motion]
added: 0.56.0
updated: 0.99.0
source: dustinedwards.info's prose.css (img.has-lqip, the placeholder Prelum writes); WCAG 2.2.2 Pause, Stop, Hide
replaces:
  - 'img\.has-lqip\s*\{'
  - '\.(gif-pause|motion-toggle|pause-gif)\s*\{'
---

# Picture

The look of one stored image around its pixels. A site uploads through site-api, which keeps a tiny placeholder and the main color for each picture; site-runtime's `pictureProps` (a JSX page) and Prelum's renderer (a post) write them onto the `<img>`, and this file shows them until the image paints. An animated image gets a Pause control beside its still. Import `capsomer/picture.css`.

## React

`capsomer/react/picture` writes site-runtime's `pictureProps` out as a `<picture class="cap-picture">` (display: contents, so the `<img>` is the box) with its AVIF and WebP sources, or the `<img>` alone when there are none:

```tsx
import { Picture } from "capsomer/react/picture";

<Picture attrs={image} alt="Alex Rivera at the spring survey" className="cover" priority />
<Picture picture={pictureProps(image, { alt: "" })} eager />
```

`priority` is the page's one LCP image (eager, `fetchpriority="high"`); `eager` loads at once at normal priority (the rest of a first row); every other picture is lazy. It replaces the local `Picture` in dustinedwards.info, Foxhound (cover-picture.tsx), Foxing, bsw, germomics and julieedwards.info.

## When to use it

Every image a site serves from its library, on any page: a cover, a body image, a card.

## When not to

- An icon or a logo with transparency: give it no placeholder, which would show through.
- A video: the player (`capsomer/player.css`) has its own poster.

## The default and its reason

- **The placeholder is in the image's own style attribute**, so it paints with the first HTML, before any script, and the image's width and height hold its box. The tiny picture is drawn at the box's size; the browser smooths it into a blur, so no filter has to touch the real pixels. The main color sits under it and stands alone where a file has no placeholder. It is the one style attribute a React wrapper renders (components/README.md asks for none), so a page that shows placeholders sets site-runtime's `styleAttributesInline`; under a plain `style-src 'self'` the browser drops it and the image paints alone.
- **No fade.** The image paints over the placeholder when it arrives; a fade would need script on every image and delays the picture.
- **Pause is a checkbox, not a scripted button.** It works with no script, before hydration and in a feed reader's cached page. Checked, the moving picture is hidden and its still shows; the still is lazy, so it is fetched only when shown.
- **Less motion wins.** With `prefers-reduced-motion: reduce` the still shows and the control is hidden, as the `<picture>`'s own still sources already do.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches Pause |
| Space on Pause | Stops the animation and shows the still, or starts it again |

## Accessibility

- Pause is a native checkbox named by its visible word; checked means stopped. The focus ring goes round the whole control.
- The moving picture and its still carry the same alt text, and only one is ever displayed, so a screen reader reads it once.
- The control is a surface pill with a strong border, so it reads on any picture and in forced colors.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

A stored image with its placeholder (`pictureProps` with the file's `placeholder` and `color`; Prelum writes the same from the resolver's):

```html
<img class="has-lqip" src="/media/a.jpg?w=704" srcset="…" sizes="…" width="704" height="469" alt="…"
  loading="lazy" decoding="async"
  style="background-image:url(&quot;data:image/webp;base64,…&quot;);background-color:#3a5f6b">
```

An animated image (a GIF): the `<picture>` `pictureProps` writes, the still at the same size, and the control. In a post the wrapper holds the image link, and the label sits outside it.

```html
<span class="cap-motion">
  <picture>
    <source type="image/avif" srcset="/media/a.gif?w=704&f=avif&still=1 704w" media="(prefers-reduced-motion: reduce)">
    <source type="image/webp" srcset="/media/a.gif?w=704&still=1 704w" media="(prefers-reduced-motion: reduce)">
    <source type="image/webp" srcset="/media/a.gif?w=704 704w">
    <img src="/media/a.gif?w=704" width="704" height="396" alt="…" loading="lazy" decoding="async">
  </picture>
  <img class="cap-motion-still" src="/media/a.gif?w=704&still=1" srcset="/media/a.gif?w=704&still=1 704w" width="704" height="396" alt="…" loading="lazy" decoding="async">
  <label class="cap-motion-toggle"><input type="checkbox" class="cap-motion-pause"> Pause</label>
</span>
```

## Exceptions in production

None yet.
