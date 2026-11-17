/** An author: a name, or a name with a link (a profile, an ORCID record). */
export type Author = string | {
    name: string;
    href?: string;
};
export type Fold<A> = {
    folded: false;
    all: A[];
} | {
    folded: true;
    all: A[];
    lead: A[];
    owner: A | null;
    more: number;
};
export declare const nameOf: (a: Author) => string;
/**
 * Folds a long list to its first `keep` names and "and N more". Author order varies, so when the
 * owner falls outside the first `keep`, the fold shows one name fewer, then the owner after an
 * ellipsis: the owner is always in view. `keep` under 1 is taken as 1; a list no longer than
 * `keep` is not folded.
 */
export declare function foldAuthors<A extends Author>(authors: readonly A[], isOwner?: (name: string) => boolean, keep?: number): Fold<A>;
