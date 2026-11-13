---
name: site-footer
title: Site footer
summary: "A site's own plain footer for a site outside the family footer, with links, a mark and small print."
group: pattern
parts: [css]
tool: native
states: [plain, raised, quiet links, with a mark]
added: 0.126.0
source: txasm app/app.css (.txasm-footer) and julieedwards.info app/app.css (.je-footer, .footer-links, .footer-note)
replaces:
  - "\\.(txasm|je)-footer|\\.footer-(links|note)"
---

# Site footer

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the links in reading order |

- `footer` is the page's contentinfo landmark; its links row is a `nav` named "Footer".
- A decorative mark is `aria-hidden`; the small print names the site in words.
- Quiet links are the muted text color (Lc 60 and 4.5:1) and semibold, so they stay links without the link color.
- Screen readers: no manual run by decision; the axe scan and a front-end review stand in.
