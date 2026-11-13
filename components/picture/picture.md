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

## Usage

```tsx
import { Picture } from "capsomer/react/picture";

<Picture attrs={image} alt="Alex Rivera at the spring survey" className="cover" priority />
<Picture picture={pictureProps(image, { alt: "" })} eager />
```

```html
<img class="has-lqip" src="/media/a.jpg?w=704" srcset="…" sizes="…" width="704" height="469" alt="…"
  loading="lazy" decoding="async"
  style="background-image:url(&quot;data:image/webp;base64,…&quot;);background-color:#3a5f6b">
```

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches Pause |
| Space on Pause | Stops the animation and shows the still, or starts it again |

- Pause is a native checkbox named by its visible word; checked means stopped. The focus ring goes round the whole control.
- The moving picture and its still carry the same alt text, and only one is ever displayed, so a screen reader reads it once.
- The control is a surface pill with a strong border, so it reads on any picture and in forced colors.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
