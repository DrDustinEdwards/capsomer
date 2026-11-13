---
name: site-footer
title: Site footer
summary: A site's own plain footer, for a site outside the family footer: a hairline over a row of links, a mark and a line of small print, in the page's column.
parts: [css]
tool: native
states: [plain, raised, quiet links, with a mark]
added: 0.124.0
source: txasm app/app.css (.txasm-footer) and julieedwards.info app/app.css (.je-footer, .footer-links, .footer-note)
replaces:
  - "\\.(txasm|je)-footer|\\.footer-(links|note)"
---

# Site footer

The foot of a site that is not one of dustinedwards.info's centers: a hairline, then the site's links in one row that wraps, its mark if it has one, and a line of small print (the copyright, who runs it). The content sits in the page's column (`.cap-page` inside the footer), so it lines up with the header and the page above it.

## When to use it

- A site with its own look and no place in the family footer (txasm, julieedwards.info).

## When not to

- dustinedwards.info and its centers (Capsid, Carrel, Enarratio): the [Family footer](../family-footer/family-footer.md).
- An admin or app shell: it has no footer.

## The default and its reason

Transparent, on the page's ground, with the text at `--fs-detail`, 2.5rem inside top and bottom. A footer is the least read part of a page, so it is quiet; `data-tone="raised"` puts it on the raised surface where a site closes its pages with a band. Links keep the network's link cues; `data-links="quiet"` on the row draws them in the muted color, turning the link color under the pointer, for a site whose footer links should not compete with the page (julieedwards.info).

Slots: `--site-footer-gap` (space above it, 0), `--site-footer-pad` (2.5rem), `--site-footer-bg`, `--site-footer-fs` (`--fs-detail`). Lay out its inside with the layout utilities (`.cap-stack`, `.cap-spread`).

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the links in reading order |

## Accessibility

- `footer` is the page's contentinfo landmark; its links row is a `nav` named "Footer".
- A decorative mark is `aria-hidden`; the small print names the site in words.
- Quiet links are the muted text color (Lc 60 and 4.5:1) and semibold, so they stay links without the link color.
- Screen readers: no manual run by decision; the axe scan and a front-end review stand in.

## Markup

```html
<footer class="cap-site-footer" data-tone="raised">
  <div class="cap-page">
    <nav class="cap-site-footer-links" aria-label="Footer">
      <a href="/contact">Contact</a>
      <a href="/accessibility">Accessibility</a>
    </nav>
    <p class="cap-site-footer-note">© Texas Branch ASM</p>
  </div>
</footer>
```
