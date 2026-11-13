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

A `nav` named "Pagination" holding a "Showing 21 to 40 of 312 posts" line and a list: Previous, the page numbers, Next. The current page is `aria-current="page"`. Real links when each page is a URL; buttons when the list is filtered in the browser.

**Provenance.** EXTRACTED and REWROTE, from the site's `Pager` (`nav aria-label="Pagination"`, "Newer", "Page 3 of 16", "Older", links with `?page=n`, nothing when there is one page) and the admin posts table's count line ("Showing 20 of 312 posts."). Kept: the landmark and its name, real links to `?page=n`, words at the ends (Newer and Older are `prevLabel` and `nextLabel`), "Page 3 of 16" as the compact form, no pager for a single page. Added: page numbers with gaps, a count line that says which items, a disabled end that is still readable, and a button form. The site's links are 15 px text with a 44 px minimum on a touch screen only; here every page is at least 44 px square (`--control-h-coarse`) at every width.

## When to use it

A list too long for one page where a person may want a particular page: posts, mentions, media. The count line is worth having on every one.

## When not to

- **A feed read from the top** (a timeline, the activity log): a "Load more" button, or infinite scroll with a way to stop, since the page numbers mean nothing there.
- **A handful of items**: show them all.
- **Steps** (a form's pages): a stepper, with Back and Continue.
- **Search results with a total that moves**: Previous and Next only, as plain links, with no numbers or "of N".

## The default and its reason

- **Seven slots, always.** With more than seven pages the list shows the first and last page and a window around the current one, so it keeps the same width as a person moves and the Next button does not slide away from their pointer.
- **Page links are names, not bare numbers.** Each is `aria-label="Page 3"`; the current one is read "Page 3, current page".
- **Previous and Next have an edge and a word.** They are the main controls, so they look like outline buttons; the numbers are quiet. The chevron is generated, so a reader hears "Previous" only.
- **A disabled end is dashed, muted and still there** (and still readable), as a disabled button is. In the links form it is an `a` with no `href`, `role="link"` and `aria-disabled="true"`, so it is not a stop. In the buttons form it keeps its place in the tab order and does nothing, so a person who reaches it by keyboard hears that it is unavailable.
- **The count line is first.** "Showing 41 to 60 of 312 posts" is plain text, and in the buttons form a polite live region updated in place so the change is announced.
- **A narrow container changes the form, not the page.** Under about 34 rem the numbers are replaced by "Page 3 of 16" between Previous and Next. It is a container query on the pager itself, so it works in a narrow panel on a wide screen. The site's `.pager` was this form only.
- **The steps form** (`data-form="steps"`, React `form="steps"`): Previous and Next with "Page 3 of 16" between at every width and no numbers, for a list read in order (a journal, Newer and Older). With a total that moves (search results) it says "Page 3" alone: React `pageCount={0}` and `hasNext`.
- **The address is strict and has one form.** `parsePage("2")` is 2, and anything that is not whole digits from 1 (`"2.5"`, `"-1"`, `"1e3"`, `"2abc"`, empty) is page 1. `pageEnvelope(page, perPage, total)` keeps the page inside the list (a page past the end shows the last), gives the `offset` to query, the range shown and `hasPrev`/`hasNext`; an empty list still has its one page, an empty state rather than a 404. `pageHref(path, params, page)` leaves out empty and false parameters and `page` on page 1, so page 1 is the bare address and each page has one URL (Google: each page of a series has its own URL, and the first is not `?page=1`).
- **Prev and next in the head too.** `pageRelLinks(page, pageCount, hrefFor)` gives the `<link rel="prev">` and `<link rel="next">` for a route's `links` export. Google no longer reads them, but Bing and other readers do; the links in the pager carry `rel` as well.
- **A count without a range.** `countText(shown, total, nounsOf(labels, "mention"))` from `capsomer/behavior/content`: "Showing 20 of 312 mentions" when a list shows only its first rows, or "12 mentions" when it shows them all.
- **One page renders nothing.** Nowhere to go; the count line is the page's own business then.

## The shadcn component it matches

Pagination (`pagination.tsx`: Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis). Matched: the `nav` with a list, ghost page links with the current page outlined, Previous and Next with chevron and text, an ellipsis item that says "More pages". Different on purpose: the current page also has a tint and a heavier weight (an outline alone is hard to see); a disabled end exists (shadcn has none); the count line, the compact form and the button form are added; links are in the accent text color.

## Keyboard

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Moves through Previous, the page numbers and Next. A disabled link is not a stop; a disabled button is |
| Enter | Follows the focused link, or chooses the focused page (buttons) |
| Space | Chooses the focused page (buttons) |

In the buttons form, focus stays on the control that was used: after Next it is on Next while there are more pages, otherwise on the current page.

## Accessibility

- A `nav` named "Pagination"; give each pager on a page its own name ("Posts pages", "Mentions pages").
- Page links have `aria-label="Page n"`; the current one `aria-current="page"`. The gap is "More pages" to a reader and `…` to the eye.
- A disabled end: `aria-disabled="true"`; its text keeps 4.5:1.
- Contrast: link text 4.5:1; the current page's edge, Previous's and Next's edges 3:1.
- Hit areas at least `var(--control)` square; forced colors draw the current page in Highlight.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

Links, as a server renders them (the page's own URLs):

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

A disabled end in the links form: `<a class="cap-page" data-kind="prev" role="link" aria-disabled="true">Previous</a>`. In the buttons form every `a` is `<button type="button" class="cap-page" data-page="n">` and a disabled end is a button with `aria-disabled="true"` and no `data-page`; the `nav` carries its state:

```html
<nav class="cap-pagination" aria-label="Posts pages" data-cap="pagination"
     data-page="1" data-page-count="16" data-total="312" data-per-page="20" data-noun="posts">
```

`data-prev-label` and `data-next-label` change the words. `import { enhance, setPage, render, pageItems, statusText } from "capsomer/behavior/pagination"`: `enhance()` makes a click choose a page, draw the list again (the count line is updated in place) and fire `cap:page-change` (bubbles; `detail.page`), which the app answers by loading that page. `setPage(nav, 5)` does the same from script. The links form needs no script.

In React, `import { Pagination } from "capsomer/react/pagination"`:

```tsx
<Pagination page={3} pageCount={16} total={312} perPage={20} noun="posts"
  hrefFor={(n) => `?page=${n}`} label="Posts pages" />

<Pagination page={page} pageCount={16} onPageChange={setPage} total={312} perPage={20} noun="posts" />
```

With `hrefFor` it renders links; without, buttons and `onPageChange`. `renderLink` draws each link with the app's router link, so a page change is a client navigation: `renderLink={({ href, ...p }) => <Link to={href} {...p} />}` (the props are `PageLinkProps`).

```tsx
// A loader: read the address, keep it in range, query one page.
const { page, offset, perPage, pageCount, total } = pageEnvelope(parsePage(url.searchParams.get("page")), 25, count);
const hrefFor = (n: number) => pageHref("/admin/webhooks", { type, errors: errorsOnly }, n);
export const links = () => pageRelLinks(page, pageCount, hrefFor);

<Pagination form="steps" page={page} pageCount={pageCount} hrefFor={hrefFor} prevLabel="Newer" nextLabel="Older" label="Journal pages" />
<Pagination form="steps" page={page} pageCount={0} hasNext={rows.length > perPage} hrefFor={hrefFor} label="Result pages" />
```

The same pure functions come from `capsomer/behavior/pagination` and are re-exported by `capsomer/react/pagination`.

## Deliberately different

- The current page has a tint and a weight as well as its outline.
- A disabled end is shown, dashed and readable (shadcn removes it).
- A count line and a compact "Page 3 of 16" form, chosen by the container's width.
- A button form with focus kept where the person was.

## Exceptions in production

None yet.
