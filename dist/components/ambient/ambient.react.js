import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { drawHexes, pauseOffscreen } from "./ambient.js";
const SPANS = { blobs: 4, equalizer: 28, "hex-field": 0 };
// The HTML contract in ambient.md. Always aria-hidden: it carries no information.
export function Ambient({ variant, count, phoneCount, random }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        // The hexagons are drawn in the browser only, into a field React leaves empty.
        if (variant === "hex-field")
            drawHexes(el, { count, phoneCount, random });
        return pauseOffscreen(el);
    }, [variant, count, phoneCount, random]);
    return (_jsx("div", { ref: ref, className: "cap-ambient", "data-variant": variant, "data-cap-ready": "", "aria-hidden": "true", children: Array.from({ length: SPANS[variant] }, (_, i) => (_jsx("span", {}, i))) }));
}
