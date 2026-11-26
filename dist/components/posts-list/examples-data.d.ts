import type { ContentCan, PostOffers, PostRow, PostsData } from "../content/content.ts";
export declare const NOW: number;
export declare const ALL: ContentCan;
export declare const ROWS: PostRow[];
export declare const IDEAS: PostOffers;
export declare const IDEA_ROWS: PostRow[];
export declare function dataOf(rows: PostRow[], over?: Partial<PostsData>): PostsData;
