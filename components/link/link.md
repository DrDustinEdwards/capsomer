---
name: link
title: Link
summary: React Router's Link and NavLink, prefetching on hover and focus, never where opening the page acts on something; the look of every link is the base styles'.
parts: [ts, react]
tool: own JavaScript
states: []
added: 0.45.0
updated: 0.45.0
source: site-runtime's ./prefetch (NEVER_PREFETCH, FILE_EXTENSIONS), which this rule follows for client navigation
replaces:
  - '\{[^}]*\b(Nav)?Link\b[^}]*\} from "react-router(-dom)?"'
---

# Link

`capsomer/react/link` exports `Link` and `NavLink`: React Router's own, with the same props, prefetching the page on hover and focus by default (`prefetch="intent"`). `capsomer/behavior/link` exports `mayPrefetch`, the rule that decides whether a link may prefetch, and `underPath`, the path match it uses. The link's look is not here: every `a` takes the accent text color, an underline and the hover color from `css/base.css`, and `.cap-go` (utilities) adds an arrow.

## When to use it

Every link between routes in a hydrated React Router app (the Portal, Carrel, Foxhound). A link a person is about to follow opens at once, because its route's modules and loader data are already fetched.

## When not to

- **A site without script**, or one that renders HTML on each visit: a plain `<a href>`, with site-runtime's speculation rules (`./prefetch`) doing the prefetching.
- **An action**: a `<button>`, or a form that posts. A link only goes somewhere, and a GET that changes something is never linked to be prefetched (see the default below).
- **Back to the page a person came from**: the back link (`.cap-go[data-go="back"]`, documented on the breadcrumb page), which is still a real link.

## The default and its reason

- **Prefetch on intent.** A hydrated app navigates on the client, so it prefetches what a client navigation reads (the route's modules and loader data), not the HTML speculation rules would fetch.
- **Never where a GET acts.** A prefetch runs the target's loader, so a link renders with `prefetch="none"`, whatever it asked for, when it loads a whole document (`reloadDocument`), opens elsewhere (`target` other than `_self`), downloads, leaves the app, points at a file (site-runtime's `FILE_EXTENSIONS`) or goes under site-runtime's `NEVER_PREFETCH`. `/admin` prefetches only from a page already under `/admin`. `<LinkPrefetch exclude={["/demos/:product"]}>` at the root adds an app's own paths; `:name` and `*` stand for one segment.
- **A link looks like a link.** Text links keep their underline (base.css), so a link is never told apart by color alone (WCAG 1.4.1). A link that is a control in a bar (the shell's rail, the site header's sections) is drawn by its component.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the link; focus prefetches it, as hover does |
| Enter | Follows it |

## Accessibility

- It renders a real `<a href>`, so it is announced as a link, opens in a new tab with the browser's own keys, and works before hydration.
- `NavLink` sets `aria-current="page"` on the link to the current route (React Router's own).
- The focus ring is the base `:focus-visible` outline, 3:1 in both themes.

Last checked by hand: not yet. Automated: `test/unit/link.test.mjs` holds the prefetch rule.

## Markup

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
