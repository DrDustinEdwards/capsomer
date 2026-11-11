---
name: trusted-html
title: Trusted HTML and rich text
summary: The one Trusted Types policy Capsomer's scripts use, and RichText, which renders stored, already sanitized HTML through it, with the reading measure as an option.
parts: [css, behavior, react]
tool: own JavaScript
states: [stored statement kept to the measure, titles inside a line, an empty title with its fallback, a paragraph with the page's class]
added: 0.79.3
updated: 0.93.0
source: Capsomer's own scripts (0.79.3, trusted-html.ts); RichText from txasm, 28 dangerouslySetInnerHTML of stored sanitized HTML in 20 files (routes/meetings.$slug.abstracts.$ref.tsx, awards.$slug.tsx, review.$assignmentId.tsx and the rest) and routes/accessibility.tsx's inline maxWidth 65ch
replaces:
  - "dangerouslySetInnerHTML=\\{\\{\\s*__html:\\s*(?!jsonLdText)"
  - "style=\\{\\{\\s*maxWidth:\\s*\"65ch\""
---

# Trusted HTML and rich text

Two things in one place. `trusted-html.ts` is the one Trusted Types policy, named `capsomer`, that Capsomer's scripts use for the little markup they must hand the DOM as a string. `RichText` is the React component a site uses to render HTML it stored and sanitized itself (an abstract, a bio, an accessibility statement), through that policy, in place of a hand-written `dangerouslySetInnerHTML`.

**Provenance.** The policy is Capsomer's own (0.79.3). RichText is EXTRACTED from txasm, which writes `dangerouslySetInnerHTML={{ __html: value }}` 28 times in 20 files for HTML its server sanitized on save (`sanitizeTitle`, `sanitizeBody` in app/lib/richtext.ts), and `title ? <span dangerouslySetInnerHTML /> : <span className="cap-muted">Untitled</span>` in about half of them. Kept: the element and class each place chose, and the fallback. REWRITTEN: the markup goes through the policy, so it keeps working when the site enforces Trusted Types; the accessibility statement's inline `style={{ maxWidth: "65ch" }}`, which a `style-src 'self'` page refuses, is the `measure` option, a class rule at `--measure`.

## When to use it

- Any HTML a React page renders that its own server rendered or sanitized: stored rich text, a statement from a file, a title with `<em>` or `<sub>`.
- In a plain script, `trustedHtml()`, `setStaticHtml()` and `markup()` for a constant in our own source or markup our own renderer built with every value escaped.

## When not to

- Anything a visitor typed that the server has not sanitized: render it as text, or sanitize it on the server first. RichText does not sanitize.
- A page's JSON-LD: JSON-LD, which escapes for a data block.
- Building DOM in a script: `createElement`, `textContent`, `replaceChildren` need no policy at all.

## The default and its reason

- **The policy passes HTML through unchanged.** It is not a sanitizer: it marks the two kinds of input a visitor cannot have written. Sanitizing is the server's, once, on save.
- **The same string gives the same object** (`markup`), so a re-render does not set the HTML again and drop what a script attached to it.
- **A page whose `trusted-types` list omits `capsomer` gets plain strings**, which that page's own policy then decides.
- **The measure is a rule, not a style.** `measure` sets `data-measure="text"`, which keeps the element to `--measure`. No `style` is ever rendered, even one spread in past the types.
- **Empty HTML shows the fallback**, or nothing, never an empty element.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through links in the stored HTML, as any link |

## Accessibility

- The stored HTML keeps its own structure (paragraphs, lists, `em`, `abbr`); RichText adds no role.
- It takes the text color and links of where it sits; the fallback a site passes (`.cap-muted`) is 4.5:1.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-rich-text" data-measure="text"><p>Stored, sanitized HTML.</p></div>
<span class="cap-rich-text">Field notes on <em>Quercus alba</em></span>
```

In React, `import { RichText } from "capsomer/react/trusted-html"`: `<RichText html={abstract.bodyText} className="stack-3" />`, `<RichText as="span" html={abstract.title} fallback={<span className="cap-muted">Untitled</span>} />`, `<RichText html={STATEMENT.html} measure className="stack-4" />`. Props: `html`, `as` (div, span, p, section, article, blockquote, h1 to h4, li, td, dd), `className`, `measure`, `fallback`, and any other HTML attribute but `style`. In a script, `import { trustedHtml, setStaticHtml, copyChildren, markup } from "capsomer/behavior/trusted-html"`; the CSS is `capsomer/trusted-html.css`.

## Exceptions in production

None yet.
