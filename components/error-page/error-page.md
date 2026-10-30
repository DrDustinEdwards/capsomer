---
name: error-page
title: Error page
summary: The page a site's root ErrorBoundary shows for 404, 410 and 500, in plain words, under the site's own header.
parts: [css, react]
tool: native
states: [404, 410, 500, development, phone width]
added: 0.47.0
updated: 0.48.0
source: dustinedwards.info, app/components/error-page.tsx; Foxhound, app/components/error-view.tsx
replaces:
  - 'isRouteErrorResponse\(error\)'
---

# Error page

What a React Router site shows when a page is missing, gone or broke: the failed [Empty](../empty/empty.md) as the page's subject, under the site's own header.

## When to use it

- As the root `ErrorBoundary` in `app/root.tsx`, and in a layout route's boundary that should keep the public frame.
- `errorTitle(error, siteName)` in the root `meta`, for the error path only: an unmatched address matches no route but the root, so without it the 404 page has no title (WCAG 2.4.2).

## When not to

- A part of a page that could not load, with the rest fine: the failed Empty in place (`Empty kind="failed"`), or a banner over earlier data.
- An admin or app inside the shell: the shell's own boundary, which keeps the rail.

## The default and its reason

- **Plain words, one per case.** 404 "Page not found", 410 "This page is gone" (taken down on purpose, not coming back: nothing to retry), any other refusal "This page cannot be shown" with its status, and anything else, a thrown error included, "Something went wrong", which says it is not the reader's doing. `errorWords(error)` gives the status, title and sentence.
- **The way out is a link.** Go to the home page always; Try again only for a server error, as a link to the same address (`href=""`), so it works before hydration and with no script, where Foxhound's `location.reload()` button did not.
- **Never indexed.** `<meta name="robots" content="noindex">` is rendered with the page; React hoists it into the head.
- **The stack only in development.** `dev` (pass `import.meta.env.DEV`) shows the thrown error's message and stack; off by default, so production never shows one.
- **The site's frame stays.** `siteHeader` and `siteFooter` are slots: the skip link, the banner and the footer landmark stay on the error page. They must read no loader data, since the error path has none.
- **main is `#main` with `tabIndex={-1}`**, the skip link's target. The title is the page's `h1` (`Empty`'s `titleAs="h1"`).
- **A site's own words.** `title`, `text` and `homeLabel` replace the default words for this error, for a site whose copy is edited content (julieedwards.info's 404 is Carrel copy in D1). `as="div"` renders the region as a div when the site's Layout already has the page's one `main`.
- No router import: a route error is read by its shape (a numeric `status` and a string `statusText`), so the package needs no `react-router`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | The header's skip link first, then the header, then Try again (server errors) and Go to the home page |
| Enter on the skip link | Moves to main |

## Accessibility

- The failed Empty's contract: shape, word and color together, `role="alert"`, the title in `--crit` at 4.5:1 in both themes.
- One `h1`, the title; one `main`. The header's skip link and landmarks come from the site's own header.
- The development stack is a named, focusable region, so it scrolls by keyboard on a phone.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```tsx
import { ErrorPage, errorTitle } from "capsomer/react/error-page";
import "capsomer/empty.css";
import "capsomer/error-page.css";

export function meta({ error }: Route.MetaArgs) {
  return error ? [{ title: errorTitle(error, SITE.name) }] : [];
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} home="/" siteHeader={<SiteHeader />} siteFooter={<SiteFooter />} dev={import.meta.env.DEV} />;
}
```

It renders:

```html
<meta name="robots" content="noindex">
[the site header, with its skip link]
<main id="main" tabindex="-1" class="cap-error-page" data-status="404">
  <div class="cap-empty" data-kind="failed" role="alert">
    <div class="cap-empty-header">
      <h1 class="cap-empty-title">[critical glyph]Page not found</h1>
      <p class="cap-empty-text">There is nothing at this address. Check it for a typo, or start again from the home page.</p>
    </div>
    <div class="cap-empty-content"><a class="cap-btn" data-variant="primary" href="/">Go to the home page</a></div>
  </div>
  [children]
</main>
[the site footer]
```

`children` goes inside main under the message (dustinedwards.info's not-found help). `className` adds the site's page frame class to main.

## Exceptions in production

- Foxhound's 410 is a blog withdrawal with its own heading, reason and a link to the blog; it keeps its own view until it passes those as `children` or the words become a prop.
