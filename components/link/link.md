---
name: link
title: Link
summary: The link system. Every link has four cues (the link color, semibold, a tint under the pointer, the focus ring) and a visited and a pressed state; each kind of link adds one cue more, named by data-link. With React Router's Link and NavLink, which prefetch on hover and focus.
parts: [css, ts, react]
tool: own JavaScript
states: [rest, hover, pressed, visited, focus, away, family, file, jump, email, phone, lang, footnote, xref, address, next, title, tag]
added: 0.45.0
updated: 0.56.0
source: site-runtime's ./prefetch (NEVER_PREFETCH, FILE_EXTENSIONS), which this rule follows for client navigation
replaces:
  - '\{[^}]*\b(Nav)?Link\b[^}]*\} from "react-router(-dom)?"'
---

# Link

How a link looks and what it says it does. `css/base.css` gives every link its base; `capsomer/link.css` (`components/link/link.css`) gives each kind its one cue. `capsomer/react/link` is React Router's `Link` and `NavLink`, prefetching on intent (below).

## The base: four cues and two states

Every text link (an `a` with no component class, or any `a[data-link]`) has:

| Cue | What | Why |
| --- | --- | --- |
| Color | `--accent-text` | The family's link color, Lc 75 on every ground |
| Weight | semibold, never underlined | Not color alone (WCAG 1.4.1; F73 names weight); Dustin, "I hate underlined stuff" |
| Hover | `--accent-hover` on an `--accent-soft` tint, with a 2px shadow of the tint and a 3px radius, cloned onto each wrapped line | Says "this is the one under the pointer" without a line |
| Focus | the base `:focus-visible` ring | 3:1 in both themes |
| Pressed (`:active`) | a stronger tint (`--accent-5`) | Shows the press landed |
| Visited | `--accent-visited` | Where you have been; a color of its own in every family |

`--accent-visited` is generated for every family (`tokens/palette-core.mjs`): the link's hue turned 90 degrees toward violet, the web's visited color, kept 30 degrees clear of the error red, at Lc 75 on every ground in both themes and under "increase contrast", and at least 7 (OKLab x 100) from the link color and 10 from body text (`apart()`; the palette check and report cover it). In forced colors the system paints links, and hover underlines, since no tint shows there.

A link that is a control (a menu, a tab, a button) is drawn by its component. Menus and navigation (site header, shell, admin shell, tabs, breadcrumb, family footer, pagination, anchor bar) are told by placement: they keep a hover tint and the focus ring, take no visited color, and mark the current page with `aria-current`, drawn as the place you are, not as a link.

## The kinds

Each kind adds one cue, named by `data-link="<kind>"` on the `a`. Where CSS can tell the kind from the markup it finds it with no attribute (the fallback). The kind is read from `data-link` only: Prelum puts `rel="external"` on every link off the family, whatever its kind, so `rel` and `target` count only on a link with no `data-link`.

| Kind | Cue | Fallback with no attribute | Why |
| --- | --- | --- | --- |
| `away` (another site) | ↗ after the text, or the site's own icon (`.cap-link-icon`) before it | `a[rel~="external"]`, `a[target="_blank"]` | You are leaving; the arrow is the web's sign for it |
| `family` (a family site) | that site's icon before the text, `data-site="<id>"` | none | One of ours: the icon says which, and that you stay in the family |
| `file` (a download) | ↓ after the text; format and size after it in `.cap-link-meta` | `a[download]`, `.pdf .zip .csv .epub .docx .xlsx .pptx` | Says a file comes, how big, before the click |
| `jump` (same page) | `#` after the text | `a[href^="#"]` directly in `p li dd td blockquote figcaption`, never in a `nav`, a footnote or a component | `#` is the fragment's own character; ↓ is the download's, and points wrong to a place above |
| `email`, `phone` | ✉ or ☎ before the text | `mailto:`, `tel:` | It opens mail or the phone, not a page |
| `lang` | the language's name after it in `.cap-link-meta` | `a[hreflang]` (shows nothing: the name needs text) | The page is in another language |
| `footnote` | the superscript number, `.cap-footnote-ref`; the way back is ↩ | `sup > a`, GFM's `a[data-footnote-ref]`, `a[data-footnote-backref]` | A note, not a page |
| `xref` (same site) | italic | none | A cross-reference, as in print |
| `address` (the text is a URL, DOI or email) | the mono face, breaking anywhere | none | An address is read character by character, and must not run past a phone's edge |
| `next` (a link on its own line) | the family arrow after it, nudging 3px on hover (still under reduced motion) | none: `p > a:only-child` also matches a link with text around it, which CSS cannot see | Onward, as `.cap-go` |
| `title` (a heading that is a link) | the heading's size, and the family arrow on hover or focus | `:is(h1, h2, h3, h4) > a` | The heading says it is a heading; the arrow says it goes somewhere |
| `tag` (a tag or category) | a pill: `--ring` edge, `--accent-soft` fill, rounded | none | A label to browse by; the catalog's active-filter chip is the same pill |

Family icons: dustinedwards, germomics, julieedwards, foxing, foxhound, txasm, bsw, carrel, capsid, capsomer, prelum, each the site's favicon or mark reduced to one color on a 24-unit grid and drawn as a mask in the link's color, so it follows the theme and turns `LinkText` in forced colors. Nothing is loaded from the sites. The list is `FAMILY_LINK_SITES` (`components/family-footer/family-footer.ts`) beside the footer's `FAMILY_SITES`; Enarratio has no icon yet and keeps the family arrow turned out. An outside site's icon (`img.cap-link-icon`, fetched by the site, not by Capsomer) is sized and placed as the family icons, sits on a light plate in dark, and gives way to ↗ in forced colors.

## What a screen reader hears

Every mark is hidden: a glyph is written `content: "↗" / ""`, an icon has no content and an `img` has `alt=""`. The words are in the markup:

- `away`: `<span class="cap-sr-only"> (opens another site)</span>` inside the link. A fallback with no attribute speaks it as the glyph's alt text instead (", opens another site", or ", opens in a new tab" for `target="_blank"`).
- `file` and `lang`: the meta is the words, read after the link.
- `email`, `phone`, `jump`, `family`, `xref`, `address`, `next`, `title`, `tag`: the link text says it.
- Footnotes: GFM's `aria-describedby` on the reference and `aria-label="Back to reference 1"` on the way back.

## The HTML contract

What a site or Prelum writes. A meta is a sibling after the link, a space between.

```html
<a href="https://example.org/" data-link="away" rel="external">Example Org<span class="cap-sr-only"> (opens another site)</span></a>
<a href="https://fieldnotes.example.com/" data-link="away" rel="external"><img class="cap-link-icon" src="/link-icons/fieldnotes.example.com.png" alt="" width="16" height="16">Field Notes<span class="cap-sr-only"> (opens another site)</span></a>
<a href="https://germomics.com" data-link="family" data-site="germomics">Germomics</a>
<a href="/files/survey-protocol.pdf" data-link="file">The survey protocol</a> <span class="cap-link-meta">PDF, 2 MB</span>
<a href="#methods" data-link="jump">Methods</a>
<a href="mailto:editor@example.com" data-link="email">Write to the editor</a>
<a href="tel:+15550100" data-link="phone">Call the office</a>
<a href="/es/" hreflang="es" data-link="lang">Read it</a> <span class="cap-link-meta" lang="es">Español</span>
<sup><a href="#fn-1" id="fnref-1" class="cap-footnote-ref" aria-describedby="footnote-label">1</a></sup>
<a href="#fnref-1" data-footnote-backref aria-label="Back to reference 1">↩</a>
<a href="/writing/sampling" data-link="xref">sampling</a>
<a href="https://doi.org/10.5555/12345678" data-link="address" rel="external">doi.org/10.5555/12345678<span class="cap-sr-only"> (opens another site)</span></a>
<p><a href="/writing/part-two" data-link="next">Part two: the notebooks</a></p>
<h2><a href="/writing/field-notebooks">Why field notebooks keep coming back</a></h2>
<a href="/tags/survey" data-link="tag">survey</a>

```

Load `capsomer/link.css` after `capsomer/base.css`. `data-force="hover|pressed|visited|focus"` shows a state on a states page (`:visited` cannot be read by script).

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the link; focus prefetches it in a React Router app, as hover does |
| Enter | Follows it |

## Accessibility

- Every link is a real `<a href>`, announced as a link, opening in a new tab with the browser's own keys.
- Marks are hidden from assistive technology and their words are in the contract (above). The sweep checks that every text link has the base cues, that each kind shows its mark, that marks are hidden, that visited and pressed differ from rest, and forced colors.
- Text links are inline in a sentence (WCAG 2.5.8's inline exception); a tag pill and a footnote's way back reach the target size.
- `NavLink` sets `aria-current="page"` on the link to the current route (React Router's own).

Last checked by hand: not yet. Automated: the sweep (`test/sweep.spec.ts`), the palette check, and `test/unit/link.test.mjs` (the prefetch rule, and the family icons against `FAMILY_LINK_SITES`).

## Prefetching: React Router's Link and NavLink

`capsomer/react/link` exports `Link` and `NavLink`: React Router's own, with the same props, prefetching the page on hover and focus by default (`prefetch="intent"`). `capsomer/behavior/link` exports `mayPrefetch`, the rule that decides whether a link may prefetch, and `underPath`, the path match it uses.

- **Use it** for every link between routes in a hydrated React Router app (the Portal, Carrel, Foxhound). A link a person is about to follow opens at once, because its route's modules and loader data are already fetched.
- **Not** on a site without script, or one that renders HTML on each visit (a plain `<a href>`, with site-runtime's speculation rules, `./prefetch`); not for an action (a `<button>`, or a form that posts); not back to the page a person came from (the back link, `.cap-go[data-go="back"]`, on the breadcrumb page).
- **Never where a GET acts.** A prefetch runs the target's loader, so a link renders with `prefetch="none"`, whatever it asked for, when it loads a whole document (`reloadDocument`), opens elsewhere (`target` other than `_self`), downloads, leaves the app, points at a file (site-runtime's `FILE_EXTENSIONS`) or goes under site-runtime's `NEVER_PREFETCH`. `/admin` prefetches only from a page already under `/admin`. `<LinkPrefetch exclude={["/demos/:product"]}>` at the root adds an app's own paths; `:name` and `*` stand for one segment.

```tsx
import { Link, LinkPrefetch, NavLink } from "capsomer/react/link";

<LinkPrefetch exclude={["/demos/:product"]}>
  <NavLink to="/sites">Sites</NavLink>
  <Link to="/admin/export" reloadDocument>Download the export</Link>
</LinkPrefetch>
```

Without React: `mayPrefetch({ href, from, exclude, reloadDocument, target, download })` from `capsomer/behavior/link` gives the same answer.

## Exceptions in production

None yet.
