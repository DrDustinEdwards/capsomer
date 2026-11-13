---
name: manual
title: Manual theme
summary: The public pages of the dustinedwards.info sites set after the 1975 NASA Graphics Standards Manual, in the page's own family color. Opt-in, for public pages only.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [running head, running head as a sign, a numbered part with its lead, form boxes as a title block, form boxes as readings on a tone scale, form boxes as an instrument panel, leader index, checklist card, plate, signs, mission patch, letterhead, layout grid, direction strip, cheatline and stripe, roll blocks, time line, cue card, holding position marking, annunciator panel]
added: 0.23.0
source: capsid explorer/src/explorer.css (the NASA blocks, capsid #560, #562, #583) and pages.mjs (patch)
replaces:
  - "\\.manual-head|\\.title-block|\\.contents-dots|\\.foot-plate|\\.cue-strip|\\.patch-rim"
---

# Manual theme

The look the public pages of dustinedwards.info, capsid.dustinedwards.info, Capsomer's public site and Prelum's specimen share: the NASA Graphics Standards Manual (Danne & Blackburn, 1975) and the Apollo papers around it. Hairline rules, numbered parts with the title on the left, ruled form boxes, an index with dotted leaders, dark sign panels for the way on, checklist cards, boxed plates, round patches and a letterhead at the foot. Each site keeps its family: the one color, in the strips and on the patch's disc, is the family's `--on`, as the manual kept NASA Red for one job.

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
- **Form boxes** (`dl.cap-form-boxes`, `.cap-form-boxes-box`): facts in ruled boxes that share their rules, a mono label over each value. Four columns, two on a phone. `data-span="2"` or `"all"` on a box widens it; `data-weight="bold"` sets its value bold (the page number in a title block). `data-variant="readings"` sets each value as a large figure; `data-variant="tones"` also steps the boxes through one ink from light to dark, the type turning light on the two dark steps. `data-variant="grid"` fills each row with as many boxes as fit at `--box-min` (10rem) each, for facts of any count. `data-variant="panel"` sets them as an instrument panel (the Apollo DSKY): the dark sign in both themes, legends in drafting capitals (`--drafting`) and each value lit in seven segments (`--readout`, DSEG7) in the family's light color (`--on-sign-here`, the current-page sign's); for numbers only, since DSEG7 has no letters.
- **Leader index** (`ol.cap-leader-index`): number, bold name, a dotted leader and a count or page at the right. `aria-current` on a link marks the one you are on.
- **Checklist card** (`.cap-checklist`): a list of procedures as an Apollo checklist card. A dark strip names the card; each step has a drawn box, its number, its name as a link, a dotted leader to its kind, and a note. The box is drawn, not a control. The leaders drop on a phone.
- **Plate** (`figure.cap-plate`): a drawing or photo in a ruled box on the raised surface, its plate number at the top left, the caption under it with the figure number at the right. The drawing carries its own scale bar.
- **Signs** (`nav.cap-signs` of `a.cap-sign`): the ways on as dark panels with light type. `rel="prev"` adds a left arrow and `rel="next"` a right arrow and the family color along the top, as does `data-variant="forward"`. The arrow is the family arrow (`--cap-arrow`); under the pointer or focus it steps 3px the way it points, so a sign has no underline. With reduced motion the panel lightens instead. 48px tall. Signs are for the way on; an action is a button (`.cap-btn`). In React, `Signs` from `capsomer/react/manual` renders them from `prev` and `next` (`{ href, title, label }`, one or a list), with the label read before each title ("Next part: ") and nothing when there is no way on.
- **Mission patch** (`patchSvg()` from `capsomer/behavior/manual`, drawn by `.cap-patch`): a project's round patch, the name round the top, a line round the foot, the count on a disc of the family color with a dot round it for each. `data-size="s"` makes it 96px. In React, `<Patch>` from `capsomer/react/manual` draws the same SVG without injecting markup; `PageHead`'s `patch` sets one beside a page's title.
- **Letterhead** (`.cap-letterhead`): the foot of a page, the site's name as the logotype, the address beside it and the folio at the right. Put it in the page's `footer`.
- **Layout grid** (`.cap-layout-grid`): the head of a page drawn on the manual's layout grid in fine red lines, as the manual prints its grids: twelve columns and a 24px baseline, four columns on a phone. It carries no label by default (the label is words beside a decoration); add `data-labeled` where the grid is the subject, as on a colophon, and the label sits at its foot on the right. The red is the family's `--crit`, faint. Put it on the block that holds the page's `h1`. Forced colors drop it.
- **Direction strip** (`nav.cap-direction > ol > li`): the trail to a page as an airport's direction signs. A dark band of Overpass Bold (`--wayfinding`, the FAA sign face), a white FAA arrow (`--faa-arrow`) between the ways, and the page you are on (`aria-current="page"`) as a location sign: `--on-sign-here` type and a 2px outline of it on the `--sign-here` box, 3px corners, at AAA. Links hover as every link does, here a white 18% tint on the dark band.
- **Livery** (`.cap-livery`, `[data-livery]`): an airliner's cheatline, three stripes from wide to thin in the family's chart ramp (steps 3, 2 and 1), so the foot of a page shares its tones with the site's sequential charts. It goes across the foot of a page, before the letterhead; `data-livery` on a card gives it a 6px length of the family color along its top.
- **Holding position marking** (`hr.cap-hold`): the FAA's runway hold-short marking, two solid lines over two dashed ones, in the page's ink. A divider at the end of a post, before what other sites said. It carries no words; on an element other than `hr`, mark it `aria-hidden="true"`.
- **Annunciator panel** (`ul.cap-annunciator` of `li[data-state]`, each holding its name and `span.cap-annunciator-state`): a cockpit caution and warning panel, one tile per system, on the dark sign panel. `normal` is unlit, `caution` lights amber (`--warn`), `warning` red (`--crit`), `off` is dark with an outline. Every tile says its state in words. For a site's own health checks, such as its colophon's.
- **Roll blocks** (`ol.cap-roll` of `li[data-state]`): the blocks painted round a Saturn V, one a step. `done` fills two quarters in the ink, `now` in the family's color, `ahead` is faint. Drawn: mark the list `aria-hidden="true"` and say the step in words beside it.
- **Time line** (`ol.cap-timeline` of `li` holding `.cap-timeline-mark` and `.cap-timeline-body`): dated steps on the Apollo flight plan's time line, a ticked scale down the left and each step's mark (a year, a time, a number) at its tick. On a phone the mark sits over the step.
- **Cue card** (`.cap-cue`, `.cap-cue-strip`, `.cap-cue-title`, `ul.cap-cue-lines` of `li` holding `.cap-cue-name` and `.cap-cue-value`): one step as an Apollo cue card. The strip names the procedure and the card; each line has a drawn box, a name, a dotted leader and its value. Roll blocks may sit under the strip. On a phone the value drops under the name.

Running text stays in the page's reading face (`--prose` on dustinedwards.info), at its reading size: the rules and mono labels frame the reading, they do not replace it.

## Building a page without React

`capsomer/behavior/manual` writes each part's markup as a string, every value escaped, for a static build script or a Worker's own page, so no build hand-types the classes: `checklistHtml({ label, strip, items })`, `timelineHtml(steps)`, `formBoxesHtml(boxes, { variant })`, `leaderIndexHtml(rows)`, `cueCardHtml({ id, strip, title, lines, note })`, `signsHtml(label, signs)` and `patchSvg(options)`.

## The running head and the route handle

Prelum's `sectionOf(path, sections)` (`@drdustinedwards/site-helpers/site-map`) picks the section a path sits in; the site keeps each section's number and trail beside its id. A route names its folio with `export const handle = { folio: (data) => ... }` (`RunningHeadHandle`); `folioOf(useMatches())` returns the deepest one. `<RunningHead no trail folio>` (`capsomer/react/manual`) draws the head across a tracks page's wide track, hidden from screen readers.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the links in the index, the checklist and the signs, in reading order. Nothing else takes focus. |

## Accessibility

- Every label and value is text in `--text` or `--muted` on the ground; the sign panels and strips set `--ground` on `--text`, so both themes keep the page's own contrast.
- The checklist's box, the leaders and the patch are drawn and hidden from screen readers. The patch says nothing the page does not say beside it.
- The arrows on the signs are generated content with an empty alternative, so a sign is read as its words. In forced colors they are drawn in `LinkText`.
- In forced colors the sign panels, the running-head sign and the direction strip keep a border, as their dark fill is dropped, and the layout grid is not drawn.
- The annunciator's tiles set `--on-sign` on the sign panel, mixed with the status color when lit; the state is a word on every tile, so the color is never alone. The holding marking is drawn; on an `hr` it is a separator, elsewhere it is hidden.
- The direction strip's page you are on sets `--on-sign-here` on `--sign-here`, checked at 7:1 (AAA) by palette.mjs. The roll blocks, the livery and the layout grid are drawn and say nothing the page does not say in words.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-running-head"><span class="cap-running-head-name"><span class="cap-running-head-no">1</span>Programs</span><span class="cap-running-head-folio">Alex Rivera</span></div>

<section class="cap-part">
  <h2 class="cap-part-title"><span class="cap-part-no">1.3</span>Guides</h2>
  <p class="cap-part-lead">The team's field methods, each on its own page.</p>
  <section class="cap-checklist" aria-label="Field guides">
    <p class="cap-checklist-strip" aria-hidden="true"><span>Field · Guides</span><span>6 cards</span></p>
    <ol class="cap-checklist-items">
      <li class="cap-checklist-item">
        <div class="cap-checklist-line"><a href="/guides/site-survey">Site survey</a><span class="cap-checklist-dots" aria-hidden="true"></span><span class="cap-checklist-kind">Guide</span></div>
        <p class="cap-checklist-note">Choosing sites, walking transects and logging each sample.</p>
      </li>
    </ol>
  </section>
</section>

<dl class="cap-form-boxes">
  <div class="cap-form-boxes-box"><dt>First published</dt><dd>2026-10-04</dd></div>
  <div class="cap-form-boxes-box" data-span="all"><dt>Written for</dt><dd>Writers and developers.</dd></div>
</dl>

<nav class="cap-signs" aria-label="More"><a class="cap-sign" rel="prev" href="/about">About</a><a class="cap-sign" rel="next" href="/contact">Contact</a></nav>

<footer><div class="cap-letterhead"><p class="cap-letterhead-logo">Alex<br>Rivera</p><p class="cap-letterhead-address"><b>Research Office</b><br>Example Co</p><span class="cap-letterhead-folio">1</span></div></footer>
```

```js
import { patchSvg } from "capsomer/behavior/manual";
patchSvg({ id: "desk", name: "The desk", foot: "example.com", count: 6, unit: "sites" });
```

## Exceptions in production

None yet.
