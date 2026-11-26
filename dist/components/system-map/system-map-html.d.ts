import { type SystemMapData, type SystemMapOptions } from "./system-map-data.ts";
/** The map as HTML, every text escaped. With no script it is whole: every card is a link, every
 * tie and line is words, and every flow is an ordered list. */
export declare function systemMapHtml(data: SystemMapData, options?: SystemMapOptions): string;
