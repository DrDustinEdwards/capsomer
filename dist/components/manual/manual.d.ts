export interface PatchOptions {
    /** A unique id on the page, for the patch's text paths. */
    id: string;
    /** Set round the top, in capitals. */
    name: string;
    /** Set round the foot, in capitals: the site or the series. */
    foot: string;
    /** The number on the disc, and the number of dots round it (at most 24). */
    count: number;
    /** The word under the number, in capitals. */
    unit: string;
}
/** The dots round a patch's disc, one per count (at most 24), as [cx, cy] strings: the SVG and the React patch share them. */
export declare function patchDots(count: number): [string, string][];
/**
 * A project's round patch as SVG markup, as each Apollo crew wore its mission's (capsomer/manual.css
 * draws it). Plain string building, so a server or a static build can write it into the page. The
 * patch is decorative: the page says the same in words beside it, so it is hidden from screen readers.
 */
export declare function patchSvg({ id, name, foot, count, unit }: PatchOptions): string;
export interface ChecklistItem {
    name: string;
    /** Where the step is; without one the name is bold, unlinked. */
    href?: string;
    kind: string;
    note: string;
}
/** A checklist card: a dark strip naming it (`strip`, two parts), then each item as a step. */
export declare function checklistHtml(options: {
    label: string;
    strip: readonly [string, string];
    items: readonly ChecklistItem[];
}): string;
export interface TimelineStep {
    /** The step's mark at its tick (a year, a time, a number). */
    mark: string;
    /** A bold lead before the text, ending in a period. */
    lead?: string;
    text: string;
}
/** A time line of dated steps. */
export declare function timelineHtml(steps: readonly TimelineStep[]): string;
export interface FormBox {
    label: string;
    value: string | number;
    span?: 2 | "all";
    weight?: "bold";
}
/** Form boxes: facts in ruled boxes. `variant` is readings, tones, panel or grid. */
export declare function formBoxesHtml(boxes: readonly FormBox[], { variant }?: {
    variant?: "readings" | "tones" | "panel" | "grid";
}): string;
export interface LeaderRow {
    name: string;
    /** The count or page at the right. */
    fact: string | number;
    /** The row's number; the row's place from 1 when left out. */
    no?: string | number;
    href?: string;
    /** Marks the row you are on (aria-current="page"). */
    current?: boolean;
}
/** A leader index: number, bold name, a dotted leader and a fact at the right; a row with an href is a link. */
export declare function leaderIndexHtml(rows: readonly LeaderRow[]): string;
/** A cue card: the strip (two parts), a title with its id (the section's aria-labelledby), and its lines. */
export declare function cueCardHtml(options: {
    id: string;
    strip: readonly [string, string];
    title: string;
    lines: readonly {
        name: string;
        value: string;
    }[];
    /** Extra classes beside cap-cue. */
    className?: string;
    /** A line under the card's lines. */
    note?: string;
}): string;
export interface Sign {
    text: string;
    href: string;
    /** prev or next draws the arrow that way; forward is next's look for a first step. */
    way?: "prev" | "next" | "forward";
    /** rel values beside the way (external, nofollow). */
    rel?: string;
    /** The words a screen reader hears before the title ("Next part"), as React's `Signs` reads them. */
    label?: string;
}
/** Signs: the ways on as dark panels. `label` names the nav. */
export declare function signsHtml(label: string, signs: readonly Sign[]): string;
/**
 * A route's folio for the running head's right side, from its loader data: `export const handle = { folio }`. The
 * route handle contract every site's routes use.
 */
export type RunningHeadHandle = {
    folio?: (data: unknown) => string | null | undefined;
};
/** The deepest route's folio, from the router's matches (React Router's useMatches), or undefined. */
export declare function folioOf(matches: readonly {
    handle?: unknown;
    loaderData?: unknown;
    data?: unknown;
}[]): string | undefined;
