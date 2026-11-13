export interface JsonLdProps {
    data: unknown;
}
/**
 * The value as a JSON-LD data block. Prelum's `jsonLdText` escapes `<`, `>`, `&` and U+2028/9, so a
 * string in the data that holds `</script>` cannot close the element; the data is unchanged when parsed.
 * The text goes through the `capsomer` Trusted Types policy (`markup`), because React sets it with
 * `innerHTML` when it renders in the browser. A data block is not script: no nonce, and `script-src`
 * does not gate it.
 */
export declare function JsonLd({ data }: JsonLdProps): import("react").JSX.Element;
