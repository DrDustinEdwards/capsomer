// The author list's one piece of logic: which names a folded list shows. Pure, shared by the React wrapper and a server renderer.
export const nameOf = (a) => (typeof a === "string" ? a : a.name);
/** Folds a long list to its first `keep` names and "and N more", keeping the owner in view (one name fewer, then the owner after an ellipsis). `keep` under 1 is 1. */
export function foldAuthors(authors, isOwner = () => false, keep = 3) {
    const all = [...authors];
    const k = Math.max(1, Math.floor(keep));
    if (all.length <= k)
        return { folded: false, all };
    const at = all.findIndex((a) => isOwner(nameOf(a)));
    const owner = at >= k ? (all[at] ?? null) : null;
    // With keep 1 and the owner outside it, the lead is empty and the owner stands alone.
    const lead = all.slice(0, owner ? k - 1 : k);
    return { folded: true, all, lead, owner, more: all.length - lead.length - (owner ? 1 : 0) };
}
