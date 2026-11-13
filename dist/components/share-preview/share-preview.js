// Share preview's width meter: how wide a search result's title or description is, in pixels, in
// the font Google sets it in, against the width past which a desktop result cuts it. Search
// engines cut by width, not by characters, so a title of capitals clips sooner than one of small
// letters. The widths and limits are Prelum's (`serpWidth`, `SERP_TITLE`, `SERP_DESCRIPTION`), the
// ones the sites' head tags and `prelum-audit` use, so the meter and the audit agree. Pure.
import { plural } from "../hooks/hooks.js";
import { SERP_DESCRIPTION, SERP_TITLE, serpWidth } from "@drdustinedwards/site-helpers/head";
export const SERP_LIMITS = {
    title: SERP_TITLE,
    description: SERP_DESCRIPTION,
};
// The text's width in whole pixels, from Arial's advance widths at the part's size.
export function serpTextWidth(text, part) {
    return Math.round(serpWidth(text, SERP_LIMITS[part].font));
}
const charsOf = (text) => {
    const n = Array.from(text).length;
    return plural(n, "character");
};
// The meter's words for a width. `px` null is still being measured.
export function serpReading(text, px, limit) {
    const chars = charsOf(text);
    const over = px !== null && px > limit;
    return {
        over,
        display: `${px ?? 0} of ${limit} px · ${chars}`,
        valueText: `${px ?? 0} of ${limit} pixels, ${chars}.${over ? ` Google cuts it off past about ${limit} pixels.` : ""}`,
    };
}
