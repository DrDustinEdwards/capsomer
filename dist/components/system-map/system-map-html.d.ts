import { escapeHtml } from "../email/email.ts";
import { type SystemMapData, type SystemMapOptions } from "./system-map-data.ts";
export { escapeHtml };
/**
 * The map as HTML, every text escaped: the network (level 1), or with `system` one system (level
 * 2). Delivered with no script it is whole: every card is a link, every tie and line is words, and
 * every flow is an ordered list.
 */
export declare function systemMapHtml(data: SystemMapData, options?: SystemMapOptions): string;
