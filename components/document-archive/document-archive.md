---
name: document-archive
title: Document archive
summary: Past documents by category as lists of links, and a document page with download and viewer.
group: pattern
parts: [css, behavior, react]
tool: native
states: [every category with one cut short and one empty, one category's list, a document's page with Previous and Next, the first in its category, the last in its category, phone width]
added: 0.98.0
updated: 0.98.0
source: txasm app/routes/archive.$category.tsx, app/routes/archive.$category.$slug.tsx, app/components/document-list.tsx (DocumentList), app/components/document-detail.tsx (DocumentDetail), app/lib/document-nav.ts (adjacentSlugs)
replaces:
  - 'className="(?:[^"]*\s)?doc-pager[\s"]'
  - 'function (adjacentSlugs|DocumentList|DocumentDetail)\b'
  - 'aria-label=\{`More in \$\{'
---

# Document archive

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves through the rows' links, or on a page through the download, the viewer's controls, Previous and Next |
| Enter | Follows the focused link |
| `j`, `k` | Move between the rows of a category's list (row-list) |

- Each category's list is named by its heading (`aria-labelledby`); a lone list takes `label`.
- The pager is a `nav` named "More in <category>"; its links carry `rel="prev"` and `rel="next"`.
- Contrast: the subtitle, the empty line, the size and the direction words in `--muted` (4.5:1), the titles in `--accent-text`, the pager links' edge `--line` beside their text.
- Forced colors: the pager links keep a `LinkText` edge.
