---
name: error-page
title: Error page
summary: The page a site's root ErrorBoundary shows for 404, 410 and 500, in plain words.
group: pattern
parts: [css, react]
tool: native
states: [404, 410, 410 with its own way out, a second way out, a site's own title band, signed out, session ended, 500, database down, development, phone width]
added: 0.47.0
updated: 0.104.0
source: dustinedwards.info, app/components/error-page.tsx; Foxhound, app/components/error-view.tsx
replaces:
  - 'error\.status === 404 \? "404" : "Error"'
  - 'The requested page could not be found\.'
---

# Error page

## Usage

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

```html
<main id="main" tabindex="-1" class="cap-error-page" data-status="signed-out">
  <div class="cap-empty" data-kind="nothing-yet" role="status">
    <div class="cap-empty-header">
      <h1 class="cap-empty-title">Signed out</h1>
      <p class="cap-empty-text">You signed out of Example in this browser.</p>
    </div>
    <div class="cap-empty-content"><a class="cap-btn" data-variant="primary" href="/sign-in">Sign in again</a></div>
  </div>
</main>
```

```html
<main id="main" tabindex="-1" class="cap-error-page" data-status="410">
  <div class="cap-empty" data-kind="nothing-yet">
    <div class="cap-empty-header">
      <h1 class="cap-empty-title">This page is gone</h1>
      <p class="cap-empty-text">It was taken down on purpose.</p>
    </div>
    <div class="cap-empty-content"><a class="cap-btn" data-variant="primary" href="/blog">Read the blog</a></div>
  </div>
</main>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | The header's skip link first, then the header, then Try again (server errors) and Go to the home page |
| Enter on the skip link | Moves to main |

- The failed Empty's contract: shape, word and color together, `role="alert"`, the title in `--crit` at 4.5:1 in both themes.
- One `h1`, the title; one `main`. The header's skip link and landmarks come from the site's own header.
- The development stack is a named, focusable region, so it scrolls by keyboard on a phone.
