export type PostState = "draft" | "scheduled" | "published";
export interface Transition {
    id: string;
    label: string;
    wantsDraft: boolean;
    ceremony: boolean;
    danger: boolean;
}
export declare function transitionsFor(state: PostState, everPublished: boolean): [Transition, ...Transition[]];
/** Publish is the ask and this is the answer; both mean draft: false, only this passes the ceremony. */
export declare const PUBLISH_CONFIRMED_INTENT = "publish-confirmed";
/** What the first-publication confirmation says, with or without script. */
export declare const FIRST_PUBLICATION_NOTE = "It has never been public. Publishing puts it on the blog, in the feed, the sitemap, the search index and the AI answer layer.";
export declare const DRAFT_BY_INTENT: Readonly<Record<string, boolean>>;
/** Fails closed: an unknown intent is a draft, so the failure mode is a post that stays private. */
export declare function draftForIntent(intent: string | null): boolean;
/** Cmd+S submits with no submitter, so it has to name the transition that keeps the current state. */
export declare function saveInPlaceIntent(state: PostState): string;
/** Takes now rather than reading the clock, so a component recomputing it cannot hydrate a different word. */
export declare function stateOf(fields: {
    draft: boolean;
    publishAt: string;
}, now: number): PostState;
