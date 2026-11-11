// Share preview's width meter: how wide a search result's title or description is, in pixels, in
// the font Google sets it in, against the width past which a desktop result cuts it. Search
// engines cut by width, not by characters, so a title of capitals clips sooner than one of small
// letters. The widths and limits are Prelum's (`serpWidth`, `SERP_TITLE`, `SERP_DESCRIPTION`), the
// ones the sites' head tags and `prelum-audit` use, so the meter and the audit agree. Pure.

import { SERP_DESCRIPTION, SERP_TITLE, serpWidth } from "@drdustinedwards/site-helpers/head";

export type SerpPart = "title" | "description";

export const SERP_LIMITS: Record<SerpPart, { px: number; font: number }> = {
  title: SERP_TITLE,
  description: SERP_DESCRIPTION,
};

// The text's width in whole pixels, from Arial's advance widths at the part's size.
export function serpTextWidth(text: string, part: SerpPart): number {
  return Math.round(serpWidth(text, SERP_LIMITS[part].font));
}

export interface SerpReading {
  // Wider than the limit: a desktop result cuts it.
  over: boolean;
  // What the meter shows: "412 of 600 px · 52 characters".
  display: string;
  // What a screen reader hears, with the cut said in words.
  valueText: string;
}

const charsOf = (text: string) => {
  const n = Array.from(text).length;
  return `${n} character${n === 1 ? "" : "s"}`;
};

// The meter's words for a width. `px` null is still being measured.
export function serpReading(text: string, px: number | null, limit: number): SerpReading {
  const chars = charsOf(text);
  const over = px !== null && px > limit;
  return {
    over,
    display: `${px ?? 0} of ${limit} px · ${chars}`,
    valueText: `${px ?? 0} of ${limit} pixels, ${chars}.${over ? ` Google cuts it off past about ${limit} pixels.` : ""}`,
  };
}
