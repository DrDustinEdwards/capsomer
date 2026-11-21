// The poll's one piece of behavior: each option's share of the votes as `--share`, through the CSSOM, so the
// page keeps `style-src 'self'`. Server-rendered options carry `data-votes`; the module reads them and sets the
// shares from the total.
export function shares(votes) {
    const total = votes.reduce((a, b) => a + Math.max(0, b), 0);
    return votes.map((v) => (total > 0 ? Math.max(0, v) / total : 0));
}
export function setShares(poll) {
    const options = Array.from(poll.querySelectorAll(".cap-poll-option[data-votes]"));
    const s = shares(options.map((o) => Number(o.dataset.votes) || 0));
    options.forEach((o, i) => o.style.setProperty("--share", (s[i] ?? 0).toFixed(4)));
}
export function enhance(root = document) {
    const polls = Array.from(root.querySelectorAll('[data-cap="poll"]:not([data-cap-ready])'));
    const observers = [];
    for (const poll of polls) {
        poll.dataset.capReady = "";
        setShares(poll);
        // A vote that changes a count updates the shares.
        const mo = new MutationObserver(() => setShares(poll));
        mo.observe(poll, { subtree: true, attributes: true, attributeFilter: ["data-votes"] });
        observers.push(mo);
    }
    return () => {
        for (const mo of observers)
            mo.disconnect();
    };
}
