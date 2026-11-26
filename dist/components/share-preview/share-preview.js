// Share preview's width meter: a title or description's width in pixels, in the font Google sets it in,
// against the width past which a desktop result cuts it (engines cut by width, not characters). The
// widths and limits are Prelum's (`serpWidth`, `SERP_TITLE`, `SERP_DESCRIPTION`), so the meter and the audit agree.
import { plural } from "@drdustinedwards/site-helpers/text";
import { SERP_DESCRIPTION, SERP_TITLE, serpWidth } from "@drdustinedwards/site-helpers/head";
export const SERP_LIMITS = {
    title: SERP_TITLE,
    description: SERP_DESCRIPTION,
};
export function serpTextWidth(text, part) {
    return Math.round(serpWidth(text, SERP_LIMITS[part].font));
}
const charsOf = (text) => {
    const n = Array.from(text).length;
    return plural(n, "character");
};
export function serpReading(text, px, limit) {
    const chars = charsOf(text);
    const over = px !== null && px > limit;
    return {
        over,
        display: `${px ?? 0} of ${limit} px · ${chars}`,
        valueText: `${px ?? 0} of ${limit} pixels, ${chars}.${over ? ` Google cuts it off past about ${limit} pixels.` : ""}`,
    };
}
