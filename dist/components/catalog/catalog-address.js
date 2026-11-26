export const RESERVED_PARAMS = ["q", "sort", "page"];
export const asList = (v) => (Array.isArray(v) ? v : [v])
    .filter((x) => x !== null && x !== undefined && x !== "")
    .map(String);
// A range facet's stored value is "from..to", either end empty when open.
export function readRange(value) {
    const [a, b] = (value ?? "").split("..");
    const num = (x) => (x && /^-?\d+$/.test(x) ? Number(x) : null);
    return { from: num(a), to: num(b) };
}
export const rangeParams = (field) => field.facet?.params ?? { from: `${field.key}-from`, to: `${field.key}-to` };
export function parseCatalogParams(def, input) {
    const params = typeof input === "string" ? new URLSearchParams(input) : input;
    const filters = {};
    for (const field of def.fields) {
        if (!field.facet)
            continue;
        if (field.facet.kind === "range") {
            const names = rangeParams(field);
            const num = (raw) => {
                const t = (raw ?? "").trim();
                return /^-?\d+$/.test(t) ? Number(t) : null;
            };
            let from = num(params.get(names.from));
            let to = num(params.get(names.to));
            // An inverted range is read the way it was meant.
            if (from !== null && to !== null && from > to)
                [from, to] = [to, from];
            if (from !== null || to !== null)
                filters[field.key] = [`${from ?? ""}..${to ?? ""}`];
            continue;
        }
        const values = params
            .getAll(field.key)
            .map((v) => v.trim())
            .filter(Boolean);
        const unique = [...new Set(values)];
        if (unique.length > 0)
            filters[field.key] = field.facet.kind === "one" ? unique.slice(0, 1) : unique;
    }
    const rawSort = params.get("sort") ?? "";
    const sortKey = rawSort.replace(/^-/, "");
    const sortable = def.fields.some((f) => f.key === sortKey && f.sort);
    const page = Number.parseInt(params.get("page") ?? "1", 10);
    return {
        q: (params.get("q") ?? "").trim().replace(/\s+/g, " ").slice(0, 200),
        filters,
        sort: sortable ? rawSort : "",
        page: Number.isFinite(page) && page > 1 ? page : 1,
    };
}
// The address for a state: only what differs from the default, in a fixed order, so one state has one
// address (which is also what keeps the base page the canonical).
export function catalogHref(def, state) {
    const params = new URLSearchParams();
    if (state.q)
        params.set("q", state.q);
    for (const field of def.fields) {
        if (field.facet?.kind === "range") {
            const { from, to } = readRange(state.filters[field.key]?.[0]);
            const names = rangeParams(field);
            if (from !== null)
                params.set(names.from, String(from));
            if (to !== null)
                params.set(names.to, String(to));
            continue;
        }
        for (const value of state.filters[field.key] ?? [])
            params.append(field.key, value);
    }
    if (state.sort && state.sort !== def.defaultSort)
        params.set("sort", state.sort);
    if (state.page > 1)
        params.set("page", String(state.page));
    const query = params.toString();
    return query ? `${def.basePath}?${query}` : def.basePath;
}
// The address a request should have, or null when it already has it. A form submitted with no script
// sends every control, including defaults; the server redirects to the one clean address so what is
// shared and cached is the clean one. `keepUnknown` leaves parameters the catalog does not read out of
// the comparison, so they are served rather than redirected away.
export function catalogRedirect(def, url, options = {}) {
    let search = url.search;
    if (options.keepUnknown) {
        const known = catalogParams(def);
        const kept = new URLSearchParams();
        for (const [k, v] of url.searchParams)
            if (known.has(k))
                kept.append(k, v);
        const q = kept.toString();
        search = q ? `?${q}` : "";
    }
    const wanted = catalogHref(def, parseCatalogParams(def, url.searchParams));
    return `${url.pathname}${search}` === wanted ? null : wanted;
}
function catalogParams(def) {
    const names = new Set(RESERVED_PARAMS);
    for (const field of def.fields) {
        if (!field.facet)
            continue;
        if (field.facet.kind === "range") {
            const p = rangeParams(field);
            names.add(p.from).add(p.to);
        }
        else
            names.add(field.key);
    }
    return names;
}
// Reading the address outside a catalog (a view's own settings, a page's options): a value from a
// fixed list or the fallback, so a stale or hand-typed link still opens the page.
export function oneOf(value, allowed, fallback) {
    return typeof value === "string" && allowed.includes(value)
        ? value
        : fallback;
}
// A list parameter, repeated (?tag=a&tag=b) or comma-separated (?tag=a,b). Trimmed, deduplicated in
// first-seen order, and, with `known`, only values in it.
export function listParam(params, key, known) {
    const out = [];
    for (const raw of params.getAll(key))
        for (const part of raw.split(",")) {
            const v = part.trim();
            if (v && (!known || known.has(v)) && !out.includes(v))
                out.push(v);
        }
    return out;
}
// A four-digit year, or null.
export function yearParam(raw) {
    const t = (raw ?? "").trim();
    return /^\d{4}$/.test(t) ? Number(t) : null;
}
