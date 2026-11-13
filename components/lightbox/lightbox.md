---
name: lightbox
title: Lightbox
summary: A picture in a page opens full size in the shared dialog and shrinks back into place.
parts: [css, behavior]
tool: native + own JavaScript (the shared dialog)
states: [picture in the page, open, diagram image, reduced motion]
added: 0.81.0
source: Prelum's image lightbox (render-enhance.mjs), moved here so one viewer serves every site
replaces:
  - 'class="lightbox"'
  - 'className = "lightbox"'
---

# Lightbox

## Usage

```html
<article data-cap="lightbox">
  <figure>
    <a class="image-link" href="/media/cohort-2024.jpg">
      <img src="/media/cohort-2024-800.jpg" alt="The 2024 cohort outside the lab" />
    </a>
  </figure>
  <img class="diagram-image" src="/media/pipeline.svg" alt="Reads go to assembly, then annotation." />
</article>
```

```ts
import { enhance } from "capsomer/behavior/lightbox";
enhance(); // every [data-cap="lightbox"]
```

## Accessibility

| Key | Does |
| --- | --- |
| Enter or Space on a diagram image | Opens the viewer |
| Tab | Moves between the viewer's controls; focus stays inside |
| Esc | Closes the viewer; focus returns to the picture's link |

- The viewer is a modal dialog with an accessible name; the page behind is inert.
- The Close button is the dialog block's icon button (a target at least 24 px, larger on a coarse pointer) with the name "Close".
- The picture keeps its alt text.
- Forced colors: the Close button gains an edge.
