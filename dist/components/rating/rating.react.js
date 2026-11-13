import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from "react";
// A star rating out of five, in halves (rating.md). `Rating` shows one: an image whose name says
// the value ("3.5 out of 5 stars"), the stars drawn filled to that half. `RatingInput` asks for
// one: a native select of the half-star values (the keyboard and screen reader control every
// platform already knows), with the stars beside it showing the choice.
export const RATING_MAX = 5;
// Rounds to the nearest half within 0..5.
export function toHalves(value) {
    if (!Number.isFinite(value))
        return 0;
    return Math.min(RATING_MAX, Math.max(0, Math.round(value * 2) / 2));
}
export function ratingWords(value) {
    const v = toHalves(value);
    return `${v} out of ${RATING_MAX} ${v === 1 ? "star" : "stars"}`;
}
function Stars({ value }) {
    return (_jsxs("span", { className: "cap-rating-stars", "data-half": Math.round(toHalves(value) * 2), "aria-hidden": "true", children: [_jsx("span", { className: "cap-rating-empty", children: "☆".repeat(RATING_MAX) }), _jsx("span", { className: "cap-rating-fill", children: "★".repeat(RATING_MAX) })] }));
}
export function Rating({ value, children, size = "default", className }) {
    return (_jsxs("span", { className: className ? `cap-rating ${className}` : "cap-rating", "data-size": size === "default" ? undefined : size, children: [_jsx("span", { role: "img", "aria-label": ratingWords(value), className: "cap-rating-img", children: _jsx(Stars, { value: value }) }), children ? _jsx("span", { className: "cap-rating-note", children: children }) : null] }));
}
export function ratingChoices(whole = false) {
    const step = whole ? 1 : 0.5;
    const out = [];
    for (let v = step; v <= RATING_MAX; v += step)
        out.push(v);
    return out;
}
export function RatingInput(props) {
    const { name, label, defaultValue = 0, value, onChange, noneLabel = "No rating", whole = false, } = props;
    const auto = useId();
    const id = props.id ?? auto;
    const [own, setOwn] = useState(toHalves(defaultValue));
    const shown = value === undefined ? own : toHalves(value);
    const change = (e) => {
        const next = Number(e.target.value) || 0;
        if (value === undefined)
            setOwn(next);
        onChange?.(next);
    };
    return (_jsxs("div", { className: "cap-field cap-rating-input", children: [_jsx("label", { className: "cap-field-label", htmlFor: id, children: label }), _jsxs("div", { className: "cap-rating-control", children: [_jsx("span", { className: "cap-select-wrap", children: _jsxs("select", { className: "cap-select", id: id, name: name, value: shown ? String(shown) : "", onChange: change, children: [_jsx("option", { value: "", children: noneLabel }), ratingChoices(whole).map((v) => (_jsx("option", { value: String(v), children: ratingWords(v) }, v)))] }) }), _jsx(Stars, { value: shown })] })] }));
}
