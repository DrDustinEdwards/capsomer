---
name: json-ld
title: JSON-LD
summary: A page's structured data as one ld+json script from a value, escaped and set through Trusted Types.
parts: [react]
tool: own JavaScript
states: [one node, a list whose strings hold markup and line separators]
added: 0.98.0
updated: 0.98.0
source: dustinedwards.info app/routes/content-page.tsx:128-134, about.tsx:96, blog.$slug.tsx:244, cv.tsx:390, home.tsx:412, kb-library.tsx:131, phages.tsx:127, procedure.tsx:101, procedure.version.tsx:92, protocols.tsx:146, publications.$slug.tsx:297, publications.tsx:308
replaces:
  - 'type="application/ld\+json"[^>]*dangerouslySetInnerHTML'
  - "dangerouslySetInnerHTML=\\{\\{\\s*__html:\\s*jsonLdText\\("
---

# JSON-LD

## Usage

```html
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"Spring update"}</script>
```

## Accessibility

| Key | Does |
| --- | --- |
| None | A data block is not drawn |

Nothing is drawn and nothing is read: the user agent hides every `script` element.
