---
name: manual
title: Manual theme
summary: The public pages of the dustinedwards.info sites set after the 1976 NASA Graphics Standards Manual, in the page's own family color. Opt-in, for public pages only.
parts: [css, behavior]
tool: native + own JavaScript
states: [running head, running head as a sign, a numbered part with its lead, form boxes as a title block, form boxes as readings on a tone scale, leader index, checklist card, plate, signs, mission patch, letterhead, layout grid, direction strip, livery band and stripe, roll blocks, time line, cue card]
added: 0.23.0
source: capsid explorer/src/explorer.css (the NASA blocks, capsid #560, #562, #583) and pages.mjs (patch)
replaces:
  - "\\.manual-head|\\.title-block|\\.contents-dots|\\.foot-plate|\\.cue-strip|\\.patch-rim"
---

# Manual theme

The look the public pages of dustinedwards.info, capsid.dustinedwards.info, Capsomer's public site and Prelum's specimen share: the NASA Graphics Standards Manual (Danne & Blackburn, 1976) and the Apollo papers around it. Hairline rules, numbered parts with the title on the left, ruled form boxes, an index with dotted leaders, dark sign panels for the way on, checklist cards, boxed plates, round patches and a letterhead at the foot. Each site keeps its family: the one color, in the strips and on the patch's disc, is the family's `--on`, as the manual kept NASA Red for one job.

Capsomer's components, its admin board and every product (Foxhound, Foxing, txasm, Germomics) do not use it (Dustin, 2026-10-26: "capsomer stays the modern board it is now. we are just theming our public pages"). An app imports `capsomer/manual.css` only on its public pages.

NASA's own marks (the worm, the meatball, the seal) are protected and never drawn; the theme borrows layouts only.

## When to use it

On a public page of a dustinedwards.info site: a home page, an index of papers or tools, a post, a protocol.

## When not to

- Inside an app or admin: use the shell, page head, row list and the rest of Capsomer.
- On a product's public site (Foxhound, Foxing): it has its own look.

## The parts and their defaults

- **Running head** (`.cap-running-head`): the section's number and name in bold on the left, a folio or date on the right, over a hairline. `data-variant="sign"` sets it as a building sign: a dark panel, the family color in a 10px strip along its top, the number on a light plate.
- **Part** (`.cap-part`, `.cap-part-title`, `.cap-part-no`, `.cap-part-lead`): a numbered part of a page. From 52rem the title takes the left third and the lead sits beside it; everything after them runs full width. The number is plain text in the heading, so it is read with the title.
- **Form boxes** (`dl.cap-form-boxes`, `.cap-form-boxes-box`): facts in ruled boxes that share their rules, a mono label over each value. Four columns, two on a phone. `data-span="2"` or `"all"` on a box widens it; `data-weight="bold"` sets its value bold (the page number in a title block). `data-variant="readings"` sets each value as a large figure; `data-variant="tones"` also steps the boxes through one ink from light to dark, the type turning light on the two dark steps.
- **Leader index** (`ol.cap-leader-index`): number, bold name, a dotted leader and a count or page at the right. `aria-current` on a link marks the one you are on.
- **Checklist card** (`.cap-checklist`): a list of procedures as an Apollo checklist card. A dark strip names the card; each step has a drawn box, its number, its name as a link, a dotted leader to its kind, and a note. The box is drawn, not a control. The leaders drop on a phone.
- **Plate** (`figure.cap-plate`): a drawing or photo in a ruled box on the raised surface, its plate number at the top left, the caption under it with the figure number at the right. The drawing carries its own scale bar.
- **Signs** (`nav.cap-signs` of `a.cap-sign`): the ways on as dark panels with light type. `rel="prev"` adds a left arrow and `rel="next"` a right arrow and the family color along the top, as does `data-variant="forward"`. 48px tall.
- **Mission patch** (`patchSvg()` from `capsomer/behavior/manual`, drawn by `.cap-patch`): a project's round patch, the name round the top, a line round the foot, the count on a disc of the family color with a dot round it for each. `data-size="s"` makes it 96px.
- **Letterhead** (`.cap-letterhead`): the foot of a page, the site's name as the logotype, the address beside it and the folio at the right. Put it in the page's `footer`.
- **Layout grid** (`.cap-layout-grid`): the head of a page drawn on the manual's layout grid in fine red lines, as the manual prints its grids: twelve columns and a 24px baseline, four columns on a phone, labeled at its foot on the right. The red is the family's `--crit`, faint. Put it on the block that holds the page's `h1`. Forced colors drop it.
- **Direction strip** (`nav.cap-direction > ol > li`): the trail to a page as a sign's directional strip. A dark band of light type, an arrow in the family's color between the ways, and the page you are on (`aria-current="page"`) lit in the family's color.
- **Livery** (`.cap-livery`, `[data-livery]`): a 40px band of the family's color with a pin stripe under it, as NASA painted its cars and aircraft. The band goes across the foot of a page, before the letterhead; `data-livery` on a card gives it a 6px length of the band along its top.
- **Roll blocks** (`ol.cap-roll` of `li[data-state]`): the blocks painted round a Saturn V, one a step. `done` fills two quarters in the ink, `now` in the family's color, `ahead` is faint. Drawn: mark the list `aria-hidden="true"` and say the step in words beside it.
- **Time line** (`ol.cap-timeline` of `li` holding `.cap-timeline-mark` and `.cap-timeline-body`): dated steps on the Apollo flight plan's time line, a ticked scale down the left and each step's mark (a year, a time, a number) at its tick. On a phone the mark sits over the step.
- **Cue card** (`.cap-cue`, `.cap-cue-strip`, `.cap-cue-title`, `ul.cap-cue-lines` of `li` holding `.cap-cue-name` and `.cap-cue-value`): one step as an Apollo cue card. The strip names the procedure and the card; each line has a drawn box, a name, a dotted leader and its value. Roll blocks may sit under the strip. On a phone the value drops under the name.

Running text stays in the page's reading face (`--prose` on dustinedwards.info), at its reading size: the rules and mono labels frame the reading, they do not replace it.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the links in the index, the checklist and the signs, in reading order. Nothing else takes focus. |

## Accessibility

- Every label and value is text in `--text` or `--muted` on the ground; the sign panels and strips set `--ground` on `--text`, so both themes keep the page's own contrast.
- The checklist's box, the leaders and the patch are drawn and hidden from screen readers. The patch says nothing the page does not say beside it.
- The arrows on the signs are generated content with an empty alternative, so a sign is read as its words.
- In forced colors the sign panels, the running-head sign and the direction strip keep a border, as their dark fill is dropped, and the layout grid is not drawn.
- The direction strip's lit page sets `--primary-fg` on `--on`, the family's button pair. The roll blocks, the livery and the layout grid are drawn and say nothing the page does not say in words.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-running-head"><span class="cap-running-head-name"><span class="cap-running-head-no">1</span>Research</span><span class="cap-running-head-folio">Dustin Edwards</span></div>

<section class="cap-part">
  <h2 class="cap-part-title"><span class="cap-part-no">1.3</span>Protocols</h2>
  <p class="cap-part-lead">The lab's methods, each on its own page.</p>
  <section class="cap-checklist" aria-label="Lab protocols">
    <p class="cap-checklist-strip" aria-hidden="true"><span>Lab · Protocols</span><span>6 cards</span></p>
    <ol class="cap-checklist-items">
      <li class="cap-checklist-item">
        <div class="cap-checklist-line"><a href="/research/protocols/phage-isolation">Phage isolation</a><span class="cap-checklist-dots" aria-hidden="true"></span><span class="cap-checklist-kind">Protocol</span></div>
        <p class="cap-checklist-note">Direct and enriched isolation, plaque purification and titers.</p>
      </li>
    </ol>
  </section>
</section>

<dl class="cap-form-boxes">
  <div class="cap-form-boxes-box"><dt>First published</dt><dd>2026-10-04</dd></div>
  <div class="cap-form-boxes-box" data-span="all"><dt>Written for</dt><dd>Writers and developers.</dd></div>
</dl>

<nav class="cap-signs" aria-label="More"><a class="cap-sign" rel="prev" href="/about">About</a><a class="cap-sign" rel="next" href="/teaching">Teaching</a></nav>

<footer><div class="cap-letterhead"><p class="cap-letterhead-logo">Dustin<br>Edwards</p><p class="cap-letterhead-address"><b>Department of Biological Sciences</b><br>Tarleton State University</p><span class="cap-letterhead-folio">1</span></div></footer>
```

```js
import { patchSvg } from "capsomer/behavior/manual";
patchSvg({ id: "carrel", name: "Carrel", foot: "dustinedwards.info", count: 6, unit: "sites" });
```

## Exceptions in production

None yet.
