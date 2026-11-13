---
name: manual
title: Manual theme
summary: The public pages of the dustinedwards.info sites set after the 1975 NASA Graphics Standards Manual, in the page's own family color.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [running head, running head as a sign, a numbered part with its lead, form boxes as a title block, form boxes as readings on a tone scale, form boxes as an instrument panel, leader index, checklist card, plate, signs, mission patch, letterhead, layout grid, direction strip, cheatline and stripe, roll blocks, time line, cue card, holding position marking, annunciator panel]
added: 0.23.0
source: capsid explorer/src/explorer.css (the NASA blocks, capsid #560, #562, #583) and pages.mjs (patch)
replaces:
  - "\\.manual-head|\\.title-block|\\.contents-dots|\\.foot-plate|\\.cue-strip|\\.patch-rim"
---

# Manual theme

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the links in the index, the checklist and the signs, in reading order. Nothing else takes focus. |

- Every label and value is text in `--text` or `--muted` on the ground; the sign panels and strips set `--ground` on `--text`, so both themes keep the page's own contrast.
- The checklist's box, the leaders and the patch are drawn and hidden from screen readers. The patch says nothing the page does not say beside it.
- The arrows on the signs are generated content with an empty alternative, so a sign is read as its words. In forced colors they are drawn in `LinkText`.
- In forced colors the sign panels, the running-head sign and the direction strip keep a border, as their dark fill is dropped, and the layout grid is not drawn.
- The annunciator's tiles set `--on-sign` on the sign panel, mixed with the status color when lit; the state is a word on every tile, so the color is never alone. The holding marking is drawn; on an `hr` it is a separator, elsewhere it is hidden.
- The direction strip's page you are on sets `--on-sign-here` on `--sign-here`, checked at 7:1 (AAA) by palette.mjs. The roll blocks, the livery and the layout grid are drawn and say nothing the page does not say in words.
