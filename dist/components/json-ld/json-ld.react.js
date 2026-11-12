import { jsx as _jsx } from "react/jsx-runtime";
// Structured data for a page: one `<script type="application/ld+json">` from a value, in place of a
// hand-written `dangerouslySetInnerHTML` in every route.
import { jsonLdText } from "@drdustinedwards/site-helpers/xml";
import { markup } from "../trusted-html/trusted-html.js";
/**
 * The value as a JSON-LD data block. Prelum's `jsonLdText` escapes `<`, `>`, `&` and U+2028/9, so a
 * string in the data that holds `</script>` cannot close the element; the data is unchanged when parsed.
 * The text goes through the `capsomer` Trusted Types policy (`markup`), because React sets it with
 * `innerHTML` when it renders in the browser. A data block is not script: no nonce, and `script-src`
 * does not gate it.
 */
export function JsonLd({ data }) {
    return _jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: markup(jsonLdText(data)) });
}
