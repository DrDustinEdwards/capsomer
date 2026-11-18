import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { drawHexes, pauseOffscreen } from "./ambient.js";
const SPANS = { blobs: 4, equalizer: 28, "hex-field": 0 };
// The HTML contract in ambient.md, `data-cap="ambient"` included, so a page that is server-rendered
// and never hydrated still has a layer its `enhance()` finds. Always aria-hidden: it carries no
// information.
export function Ambient({ variant, count, phoneCount, random, hideOnPhone }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        // A layer the page's enhance() already took is left to it.
        if (!el || el.dataset.capReady !== undefined)
            return;
        el.dataset.capReady = "";
        // The hexagons are drawn in the browser only, into a field React leaves empty.
        if (variant === "hex-field")
            drawHexes(el, { count, phoneCount, random });
        const stop = pauseOffscreen(el);
        return () => {
            stop();
            delete el.dataset.capReady;
        };
    }, [variant, count, phoneCount, random]);
    return (_jsx("div", { ref: ref, className: "cap-ambient", "data-cap": "ambient", "data-variant": variant, "data-hide": hideOnPhone && variant === "equalizer" ? "phone" : undefined, "aria-hidden": "true", children: Array.from({ length: SPANS[variant] }, (_, i) => (_jsx("span", {}, i))) }));
}
