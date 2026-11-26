import { jsx as _jsx } from "react/jsx-runtime";
// Structured data for a page: one `<script type="application/ld+json">` from a value.
import { scriptJson } from "@dustinedwards/site-runtime/html";
import { markup } from "../trusted-html/trusted-html.js";
/** The value as a JSON-LD data block. site-runtime's `scriptJson` escapes `<`, `>`, `&` and U+2028/9 so `</script>` in the data cannot close the element.
The text goes through the `capsomer` Trusted Types policy because React sets it with `innerHTML` in the browser. A data block is not script: no nonce. */
export function JsonLd({ data }) {
    return _jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: markup(scriptJson(data)) });
}
