---
"capsomer": minor
---

JsonLd (`capsomer/react/json-ld`) escapes through site-runtime's `scriptJson` (`@dustinedwards/site-runtime/html`) instead of Prelum's `jsonLdText`, which Prelum removes in favor of the one shared helper. The output is the same bytes. The optional peer `@dustinedwards/site-runtime` is now `>=0.160.0` (the release that exports `scriptJson` from `./html`). No token, class or HTML contract changed.
