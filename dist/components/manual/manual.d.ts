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
/**
 * A project's round patch as SVG markup, as each Apollo crew wore its mission's (capsomer/manual.css
 * draws it). Plain string building, so a server or a static build can write it into the page. The
 * patch is decorative: the page says the same in words beside it, so it is hidden from screen readers.
 */
export declare function patchSvg({ id, name, foot, count, unit }: PatchOptions): string;
