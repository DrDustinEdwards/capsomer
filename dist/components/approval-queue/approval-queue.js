// The approval queue's data and its pure helpers (approval-queue.react.tsx draws the markup). It is
// the moderation queue's markup (.cap-mq, its rows and its open row) for things your own side
// drafted and a person approves one by one: a social post, a reply, a generated summary. Each item
// carries its text, which can be edited before the decision, what a check held it for, and the
// decisions the app offers for it. Nothing here knows what an item is: the site passes the words.
// The keys a queue answers by default, when an action names none: a approves, r rejects.
export const DEFAULT_KEYS = { approve: "a", reject: "r" };
// The key an action answers, or undefined.
export function keyOf(action) {
    return action.key ?? DEFAULT_KEYS[action.intent];
}
// The action a key runs on an item, or null where the item offers none for it.
export function actionForKey(item, key) {
    return item.actions.find((a) => keyOf(a) === key) ?? null;
}
// After an item is decided and leaves the queue, the item focus goes to: the next one, else the
// one before, else null (the empty state).
export function nextAfter(ids, decided) {
    const at = ids.indexOf(decided);
    if (at === -1)
        return ids[0] ?? null;
    return ids[at + 1] ?? ids[at - 1] ?? null;
}
// The live line: how many items wait, and by what word, most first, in the order they first
// appear. "3 waiting: 2 awaiting approval, 1 held by the lint"; "Nothing waiting".
export function summaryLine(items) {
    if (items.length === 0)
        return "Nothing waiting";
    const counts = new Map();
    for (const i of items)
        counts.set(i.status.word, (counts.get(i.status.word) ?? 0) + 1);
    if (counts.size === 1)
        return `${items.length} waiting`;
    const parts = [...counts]
        .map(([word, n], order) => ({ word, n, order }))
        .sort((a, b) => b.n - a.n || a.order - b.order)
        .map(({ word, n }) => `${n} ${word.toLowerCase()}`);
    return `${items.length} waiting: ${parts.join(", ")}`;
}
