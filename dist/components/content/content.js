// What a list calls its items: the site's words, else `fallback` ("post", "file") and its "s".
export function nounsOf(labels = {}, fallback) {
    const noun = labels.noun ?? fallback;
    return { noun, plural: labels.plural ?? `${noun}s` };
}
// "24 files", or "Showing 48 of 210 files" when the page holds fewer than the total.
export function countText(shown, total, { noun, plural }) {
    const word = (k) => (k === 1 ? noun : plural);
    return total != null && total > shown
        ? `Showing ${shown} of ${total} ${word(total)}`
        : `${shown} ${word(shown)}`;
}
// ---------------------------------------------------------------------------------------
// The script path, pure.
// The form an IntentResult's undo, or a confirm request, posts: the intent and its fields, a list
// value as one field per item.
// A list's address with a query, its keys in one fixed order and the empty ones left out, so the
// same view is always the same address. `base` is the route (any query on it is dropped).
export function queryHref(base, q, order) {
    const params = new URLSearchParams();
    for (const k of order) {
        const v = q[k];
        if (typeof v === "string" && v)
            params.set(String(k), v);
    }
    const path = base.split("?")[0] || "";
    const s = params.toString();
    return s ? `${path}?${s}` : path || "?";
}
export function intentForm(intent, fields = {}) {
    const form = new FormData();
    form.set("intent", intent);
    for (const [k, v] of Object.entries(fields)) {
        if (k === "intent")
            continue;
        for (const one of typeof v === "string" ? [v] : v)
            form.append(k, one);
    }
    return form;
}
// A result's outcomes as the bulk bar lists them, each named as the person knows it. An item that
// is gone (deleted) keeps the name it had when the form was posted.
export function outcomesOf(result, names) {
    return (result.outcomes ?? []).map((o) => ({
        id: o.id,
        label: names.get(o.id) ?? o.id,
        ok: o.ok,
        message: o.message,
        usedBy: o.usedBy?.map((u) => (u.detail ? `${u.title} (${u.detail})` : u.title)),
    }));
}
