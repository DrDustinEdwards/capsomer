import { type Block } from "./email.ts";
/** Turn a body written as HTML into Capsomer blocks, in order. Pure. */
export declare function htmlToBlocks(html: string): Block[];
