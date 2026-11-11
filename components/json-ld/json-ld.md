---
name: json-ld
title: JSON-LD
summary: A page's structured data as one script type="application/ld+json" from a value, escaped so the data cannot end the element, and set through the Trusted Types policy.
parts: [react]
tool: own JavaScript
states: [one node, a list whose strings hold markup and line separators]
added: 0.93.0
updated: 0.93.0
source: dustinedwards.info app/routes/content-page.tsx:128-134, about.tsx:96, blog.$slug.tsx:244, cv.tsx:390, home.tsx:412, kb-library.tsx:131, phages.tsx:127, procedure.tsx:101, procedure.version.tsx:92, protocols.tsx:146, publications.$slug.tsx:297, publications.tsx:308
replaces:
  - 'type="application/ld\+json"[^>]*dangerouslySetInnerHTML'
  - "dangerouslySetInnerHTML=\\{\\{\\s*__html:\\s*jsonLdText\\("
---

# JSON-LD

`<JsonLd data={node} />`: a schema.org node, or a list of them, as the page's JSON-LD data block. One component in place of a `script` element with `dangerouslySetInnerHTML` written out in every route.

**Provenance.** EXTRACTED from dustinedwards.info, where twelve routes write `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(value) }} />` by hand. Kept: the escaping is Prelum's `jsonLdText` (`<`, `>`, `&`, U+2028 and U+2029 as `\u` escapes; the data is unchanged when parsed), and no nonce, as the site's root says ("`script-src` does not gate application/ld+json"). REWRITTEN: the text goes through the `capsomer` Trusted Types policy (`markup()` in trusted-html). The site stages Trusted Types in its Report-Only policy; once enforced, React's browser render of a hand-written block would hand `innerHTML` a plain string and be refused.

## When to use it

- Every JSON-LD block a React page renders: an Article, a BreadcrumbList, a Person, a ScholarlyArticle.

## When not to

- Meta tags in the head (`og:*`, `citation_*`): the route's `meta` export and Prelum's head helpers.
- JSON a script on the page reads: give it to the script as a module's data, not a data block.

## The default and its reason

- **Escaped by Prelum's `jsonLdText`, not by hand.** A string in the data that holds `</script>` (a title, a quoted abstract) would otherwise end the element and let the rest run as markup.
- **Through the Trusted Types policy.** React sets a `dangerouslySetInnerHTML` with `innerHTML` when it renders in the browser (a client navigation), and a page that enforces `require-trusted-types-for 'script'` refuses a plain string there. A server-rendered block that hydrates sets nothing; the spec hydrates one under that policy enforced and checks there is no violation.
- **One limit is React's, not this component's.** To make a `script` element in the browser, React itself writes `div.innerHTML = "<script></script>"` with a plain string, so under enforced Trusted Types a block React creates on a client navigation is refused before its text is set. A site that enforces Trusted Types and navigates on the client needs a `default` policy that passes exactly that string (and nothing else) and lists `default` in `trusted-types`; until then, keep Trusted Types Report-Only (as dustinedwards.info does) or render JSON-LD on server-rendered pages only.
- **No nonce.** A data block is not script: `script-src` does not apply to it, and the browser never runs it.
- **A list is one block**, a JSON array, as the site writes it now.

## Keyboard

| Key | Does |
| --- | --- |
| None | A data block is not drawn |

## Accessibility

Nothing is drawn and nothing is read: the user agent hides every `script` element.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"Spring update"}</script>
```

In React, `import { JsonLd } from "capsomer/react/json-ld"`: `<JsonLd data={[...paperJsonLd(paper, options)]} />`. It needs `@drdustinedwards/site-helpers` (Prelum 0.40 or later), which every site that writes JSON-LD already has.

## Exceptions in production

None yet.
