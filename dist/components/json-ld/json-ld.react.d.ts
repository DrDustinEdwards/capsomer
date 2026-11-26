export interface JsonLdProps {
    data: unknown;
}
/** The value as a JSON-LD data block. site-runtime's `scriptJson` escapes `<`, `>`, `&` and U+2028/9 so `</script>` in the data cannot close the element.
The text goes through the `capsomer` Trusted Types policy because React sets it with `innerHTML` in the browser. A data block is not script: no nonce. */
export declare function JsonLd({ data }: JsonLdProps): import("react").JSX.Element;
