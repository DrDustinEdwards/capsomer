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

A link to a full-size image, or a diagram image, opens the picture large in the shared dialog (`components/dialog`) and shrinks back into the picture it came from. The platform supplies the top layer, the inert page and Esc; the dialog block supplies focus placement, Tab wrapping, the backdrop click and focus return.

## When to use it

A picture in a post, a page or a roster that a reader may want to see larger: a photo linked to its original, a diagram with small text.

## When not to

- A picture that is already shown full width needs no viewer.
- A gallery with next and previous is not this; this opens one picture.
- Never the only way to reach the full image: the link keeps its `href`, so a new tab, a modified click and a page with no script still reach it.

## The default and its reason

- **Built on the dialog block.** The viewer is a modal `<dialog class="cap-dialog cap-lightbox">`, so focus, Esc, Tab and the backdrop are the same as every other overlay.
- **Named from the picture's alt.** An empty alt means decorative, so the dialog is named "Full size image". A diagram's alt describes every node and is too long for a name, so it is named "Diagram, full size".
- **The full-size address, not the shown one.** The viewer loads the link's `href`, never `currentSrc`, which is whichever `srcset` rung the browser downloaded.
- **The picture grows into the viewer and shrinks back**, as a same-document View Transition (`cap-lightbox-figure`). Skipped under reduced motion and where the API is missing: then it simply appears. Esc closes at once.
- **A diagram image becomes a button**: `tabindex="0"`, `role="button"` and the name "Enlarge diagram: <alt>", so the keyboard and a screen reader reach it.
- **A modified click goes to the link**: Ctrl, Cmd, Shift or a non-primary button keeps the browser's own behavior.

## Keyboard

| Key | Does |
| --- | --- |
| Enter or Space on a diagram image | Opens the viewer |
| Tab | Moves between the viewer's controls; focus stays inside |
| Esc | Closes the viewer; focus returns to the picture's link |

## Accessibility

- The viewer is a modal dialog with an accessible name; the page behind is inert.
- The Close button is a 44 px target with the name "Close".
- The picture keeps its alt text.
- Forced colors: the Close button gains an edge.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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

`openViewer({ src, alt, label?, source?, opener? })` and `closeViewer(dialog, source?)` open and close one by hand. Clicks are delegated to the container, so pictures added later work with no second call.

## Matches shadcn

shadcn has no image viewer. The surface is its Dialog with the content as the only child.

## Deliberately different

- **No fill, edge or shadow on the dialog**: the picture is the surface.
- **The dialog's rise is off**: the grow from the picture is the motion.

## Exceptions in production

None yet.
