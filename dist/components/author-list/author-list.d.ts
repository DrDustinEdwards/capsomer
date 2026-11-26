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
/** Folds a long list to its first `keep` names and "and N more", keeping the owner in view (one name fewer, then the owner after an ellipsis). `keep` under 1 is 1. */
export declare function foldAuthors<A extends Author>(authors: readonly A[], isOwner?: (name: string) => boolean, keep?: number): Fold<A>;
