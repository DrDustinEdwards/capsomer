import { jsx as _jsx } from "react/jsx-runtime";
// The HTML contract in section-band.md.
export function SectionBand({ children, cut, overlap, id, label }) {
    return (_jsx("section", { className: "cap-section-band", "data-cut": cut, "data-overlap": overlap ? "" : undefined, id: id, "aria-label": label, children: children }));
}
