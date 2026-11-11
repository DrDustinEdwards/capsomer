---
name: document-archive
title: Document archive
summary: Past documents by category as lists of links, and a document's page with its download, the app's viewer and Previous and Next in its category.
parts: [css, behavior, react]
tool: native
states: [every category with one cut short and one empty, one category's list, a document's page with Previous and Next, the first in its category, the last in its category, phone width]
added: 0.96.0
updated: 0.96.0
source: txasm app/routes/archive.$category.tsx, app/routes/archive.$category.$slug.tsx, app/components/document-list.tsx (DocumentList), app/components/document-detail.tsx (DocumentDetail), app/lib/document-nav.ts (adjacentSlugs)
replaces:
  - 'className="(?:[^"]*\s)?doc-pager[\s"]'
  - 'function (adjacentSlugs|DocumentList|DocumentDetail)\b'
  - 'aria-label=\{`More in \$\{'
---

# Document archive

An archive of past documents, the newsletters, programs and abstract books of earlier meetings: each category a list whose rows link to a document's page, and the page itself, with the document's title and subtitle, its download, the app's viewer and Previous and Next within its category.

**Provenance.** EXTRACTED and REWROTE, from txasm. Extracted: `adjacentSlugs` (as `adjacent`, which returns the neighbors themselves so the pager can name them), the category list (txasm's `card-list` of title links with a "Fall 1991 · Editor" line), the page's order (breadcrumb, title, subtitle, a primary Download button, the viewer, then a `nav` named "More in Programs" with `rel="prev"` and `rel="next"` links). Rewritten: the list is row-list's (`.cap-rows`), so each row is one link with the subtitle as its description; Previous and Next say the neighbor's title as well as the direction, and an end is left out instead of a hidden empty `span`; the download says its format and size; `groupByCategory` is added for a page that shows every category. The PDF viewer (txasm's PDF.js island, `components/pdf-viewer.tsx`) stays the app's and goes in as `children`: Capsomer has no PDF viewer yet.

## When to use it

Documents that come one per meeting, season or year and are read as a set: newsletters, programs, abstract books, annual reports.

## When not to

- **Posts in a blog**: the posts list, and the reading page's own next link (`data-link="next"`).
- **Files a person manages** (upload, rename, delete): the media library.
- **Search results**: a list with pagination.

## The default and its reason

- **A category is a named list of links**, a row list with the document's title as the link and the season, year and editor as the line under it. A screen reader user hears the list's name and size and moves link to link; the line is the link's description.
- **Previous and Next name the neighbor.** "Previous: Annual report 2026", so a person knows where it goes; the word is above the title, muted, with a drawn chevron a reader does not hear.
- **An end is left out, and Next keeps the right.** The first document has only Next, at the right edge, where it always is. txasm drew an empty `aria-hidden` span to hold the place; a flex margin does it.
- **The order is the app's.** `adjacent` takes the category's list as the app sorts it (newest first, by year then season), so the list and the pager agree.
- **A document outside the list has no neighbors.** `adjacent` returns none when the key is not in the list, never a neighbor from elsewhere.
- **The download is a primary button with the format and size beside it**, since reading it offline is the page's main action.
- **The page is an `article`**, the title its `h1` by default (`level`), the breadcrumb before it (`before`).

## Keyboard

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves through the rows' links, or on a page through the download, the viewer's controls, Previous and Next |
| Enter | Follows the focused link |
| `j`, `k` | Move between the rows of a category's list (row-list) |

## Accessibility

- Each category's list is named by its heading (`aria-labelledby`); a lone list takes `label`.
- The pager is a `nav` named "More in <category>"; its links carry `rel="prev"` and `rel="next"`.
- Contrast: the subtitle, the empty line, the size and the direction words in `--muted` (4.5:1), the titles in `--accent-text`, the pager links' edge `--line` beside their text.
- Forced colors: the pager links keep a `LinkText` edge.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-archive">
  <section class="cap-archive-group">
    <div class="cap-archive-head">
      <h2 class="cap-archive-title" id="cat-programs">Programs</h2>
      <a class="cap-archive-more" href="/archive/programs">All 24 programs</a>
    </div>
    <ul class="cap-rows" data-cap="row-list" role="list" aria-labelledby="cat-programs">
      <li class="cap-row">
        <div class="cap-row-title"><a href="/archive/programs/fall-2026" aria-describedby="r1-detail">Fall 2026 program</a></div>
        <p class="cap-row-detail" id="r1-detail">Fall 2026 · Editor: Sam Lee</p>
        <span class="cap-row-meta">PDF, 2.4 MB</span>
      </li>
    </ul>
  </section>
</div>

<article class="cap-docview">
  <header class="cap-docview-head">
    [breadcrumb]
    <h1 class="cap-docview-title">Fall 2026 program</h1>
    <p class="cap-docview-sub">Fall 2026 · Editor: Sam Lee</p>
    <p class="cap-docview-download"><a href="/documents/fall-2026/download" class="cap-btn" data-variant="primary" download>Download the PDF</a> <span class="cap-link-meta">PDF, 2.4 MB</span></p>
  </header>
  <div class="cap-docview-body">[the app's PDF viewer]</div>
  <nav class="cap-docpager" aria-label="More in Programs">
    <a class="cap-docpager-link" rel="prev" href="/archive/programs/spring-2027"><span class="cap-docpager-dir">Previous</span> <span class="cap-docpager-title">Spring 2027 program</span></a>
    <a class="cap-docpager-link" rel="next" href="/archive/programs/spring-2026"><span class="cap-docpager-dir">Next</span> <span class="cap-docpager-title">Spring 2026 program</span></a>
  </nav>
</article>
```

Load `capsomer/document-archive.css` with `capsomer/row-list.css`, `capsomer/button.css` and, for the download's format and size (`.cap-link-meta`), `capsomer/link-file.css` (or the whole `capsomer/link.css`, which imports it).

The helpers, with no DOM: `import { adjacent, groupByCategory } from "capsomer/behavior/document-archive"`. `adjacent(list, slug, (d) => d.slug)` gives `{ prev, next }`; `groupByCategory(docs, (d) => d.category, ["newsletter", "program", "abstract_book"])` gives the categories in that order, empty ones kept.

In React, `import { DocumentArchive, DocumentList, DocumentViewer, DocumentPager } from "capsomer/react/document-archive"`:

```tsx
<DocumentList docs={docs.map((d) => ({ key: d.slug, title: d.title, href: `${basePath}/${d.slug}`, detail: documentSubtitle(d) }))}
  label="Programs" empty="Documents are being added and will be listed here." renderLink={renderLink} />

<DocumentViewer title={doc.title} subtitle={documentSubtitle(doc)} before={<Breadcrumb items={trail} />}
  download={{ href: `/documents/${doc.slug}/download`, bytes: doc.size }}
  prev={prev && { title: prev.title, href: `${basePath}/${prev.slug}` }}
  next={next && { title: next.title, href: `${basePath}/${next.slug}` }}
  collection="Programs" renderLink={renderLink}>
  <PdfViewer url={`/documents/${doc.slug}/inline`} title={doc.title} />
</DocumentViewer>
```

`DocumentArchive` takes `groups` (`id`, `title`, `docs`, and `href` and `more` for a category cut short) and `level`. `renderLink` draws every link with the app's router link; it gets `href`, `className`, `rel`, `aria-describedby` and `children`.

## Exceptions in production

None yet.
