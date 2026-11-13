---
name: pagination
title: Pagination
summary: Move between pages of a long list, with a "Showing 21 to 40 of 312" line, as links or as buttons.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [links in the middle, a gap on both sides, first page, last page, few pages, other words for the ends, buttons client-side, narrow space compact form, steps form, steps form with a total that moves]
added: 0.3.0
updated: 0.110.0
source: The site's Pager (app/components/post-row.tsx, .pager in app/styles/listing.css) and the admin's "Showing N of M posts" line (app/components/admin/posts-table.tsx); shadcn/ui Pagination
replaces:
  - '<nav[^>]*aria-label="Pagination'
  - 'class="(?:[^"]*\s)?(pager|pagination|paginator)[\s"]'
  - 'className="(?:[^"]*\s)?(pager|pagination|paginator)[\s"]'
---

# Pagination

## Usage

```html
<nav class="cap-pagination" aria-label="Posts pages">
  <p class="cap-pagination-status">Showing 41 to 60 of 312 posts</p>
  <ul class="cap-pagination-list">
    <li><a class="cap-page" data-kind="prev" href="?page=2" rel="prev">Previous</a></li>
    <li class="cap-pagination-num"><a class="cap-page" aria-label="Page 1" href="?page=1">1</a></li>
    <li class="cap-pagination-num"><a class="cap-page" aria-label="Page 3" aria-current="page" href="?page=3">3</a></li>
    <li class="cap-pagination-num"><span class="cap-page-gap"><span aria-hidden="true">&hellip;</span><span class="cap-sr-only">More pages</span></span></li>
    <li class="cap-pagination-where">Page 3 of 16</li>
    <li><a class="cap-page" data-kind="next" href="?page=4" rel="next">Next</a></li>
  </ul>
</nav>
```

```html
<nav class="cap-pagination" aria-label="Posts pages" data-cap="pagination"
     data-page="1" data-page-count="16" data-total="312" data-per-page="20" data-noun="posts">
```

```tsx
<Pagination page={3} pageCount={16} total={312} perPage={20} noun="posts"
  hrefFor={(n) => `?page=${n}`} label="Posts pages" />

<Pagination page={page} pageCount={16} onPageChange={setPage} total={312} perPage={20} noun="posts" />
```

```tsx
// A loader: read the address, keep it in range, query one page.
const { page, offset, perPage, pageCount, total } = pageEnvelope(parsePage(url.searchParams.get("page")), 25, count);
const hrefFor = (n: number) => pageHref("/admin/webhooks", { type, errors: errorsOnly }, n);
export const links = () => pageRelLinks(page, pageCount, hrefFor);

<Pagination form="steps" page={page} pageCount={pageCount} hrefFor={hrefFor} prevLabel="Newer" nextLabel="Older" label="Journal pages" />
<Pagination form="steps" page={page} pageCount={0} hasNext={rows.length > perPage} hrefFor={hrefFor} label="Result pages" />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves through Previous, the page numbers and Next. A disabled link is not a stop; a disabled button is |
| Enter | Follows the focused link, or chooses the focused page (buttons) |
| Space | Chooses the focused page (buttons) |

In the buttons form, focus stays on the control that was used: after Next it is on Next while there are more pages, otherwise on the current page.

- A `nav` named "Pagination"; give each pager on a page its own name ("Posts pages", "Mentions pages").
- Page links have `aria-label="Page n"`; the current one `aria-current="page"`. The gap is "More pages" to a reader and `…` to the eye.
- A disabled end: `aria-disabled="true"`; its text keeps 4.5:1.
- Contrast: link text 4.5:1; the current page's edge, Previous's and Next's edges 3:1.
- Hit areas at least `var(--control)` square; forced colors draw the current page in Highlight.
