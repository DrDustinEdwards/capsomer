// The catalog's core: one declaration of a collection's fields, and the pure functions that turn the
// address's query string and the items into the page's state. No DOM and no framework, so a server
// renders the same result a browser would, the filter works with no script, and every site that uses
// the catalog gets the same counts, chips and addresses.
//
// A collection declares each field once (is it searched, is it a facet, is it a column, can it sort).
// `parseCatalogParams` reads the address; `queryCatalog` applies it and returns what the page shows.
// The result never depends on how it is drawn.
export const RESERVED_PARAMS = ["q", "sort", "page"];
// Folds case and accents, so "Report" matches "report" and "Genève" matches "geneve".
export function fold(text) {
    return text.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
}
const asList = (v) => (Array.isArray(v) ? v : [v]).filter((x) => x !== null && x !== undefined && x !== "").map(String);
// Checks a declaration once, at definition time, so a mistake is a thrown error where it is made and not a
// filter that quietly does nothing.
export function defineCatalog(def) {
    const keys = new Set();
    for (const field of def.fields) {
        if (!/^[a-z][a-z0-9_-]*$/.test(field.key))
            throw new Error(`catalog ${def.id}: field key "${field.key}" must be lower case letters, digits, - or _`);
        if (RESERVED_PARAMS.includes(field.key))
            throw new Error(`catalog ${def.id}: "${field.key}" is a reserved parameter`);
        if (keys.has(field.key))
            throw new Error(`catalog ${def.id}: two fields are named "${field.key}"`);
        keys.add(field.key);
    }
    if (def.defaultSort !== undefined) {
        const key = def.defaultSort.replace(/^-/, "");
        const field = def.fields.find((f) => f.key === key);
        if (!field?.sort)
            throw new Error(`catalog ${def.id}: defaultSort "${def.defaultSort}" is not a sortable field`);
    }
    if (def.group) {
        const field = def.fields.find((f) => f.key === def.group?.field);
        if (!field?.sort)
            throw new Error(`catalog ${def.id}: group field "${def.group.field}" is not a sortable field`);
        if (def.defaultSort?.replace(/^-/, "") !== def.group.field) {
            throw new Error(`catalog ${def.id}: group field "${def.group.field}" must be the field the default sort orders by`);
        }
    }
    if (!def.basePath.startsWith("/") || def.basePath.includes("?"))
        throw new Error(`catalog ${def.id}: basePath is a path with no query`);
    return def;
}
export function parseCatalogParams(def, input) {
    const params = typeof input === "string" ? new URLSearchParams(input) : input;
    const filters = {};
    for (const field of def.fields) {
        if (!field.facet)
            continue;
        const values = params.getAll(field.key).map((v) => v.trim()).filter(Boolean);
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
// The address a request should have, or null when it already has it. A browser submitting the form with no script
// sends every control, including the ones at their defaults (`?q=billing&sort=-updated&kind=`); a server answers
// that with a redirect to the one address the state has, so what is shared and cached is the clean one.
export function catalogRedirect(def, url) {
    const wanted = catalogHref(def, parseCatalogParams(def, url.searchParams));
    return `${url.pathname}${url.search}` === wanted ? null : wanted;
}
const DIRECTION_WORDS = {
    text: { asc: "A to Z", desc: "Z to A" },
    number: { asc: "low to high", desc: "high to low" },
    date: { asc: "oldest first", desc: "newest first" },
};
function compareValues(a, b, type) {
    // An item with no value sorts last in either direction: the caller handles that.
    if (type === "number")
        return Number(a) - Number(b);
    if (type === "date")
        return (a ?? "") < (b ?? "") ? -1 : (a ?? "") > (b ?? "") ? 1 : 0;
    return fold(a ?? "").localeCompare(fold(b ?? ""), "en", { numeric: true });
}
// How well the typed words match an item: every word must appear, and a word that starts a word of a field
// counts double. null is no match.
function searchScore(def, item, tokens) {
    const fields = def.fields.filter((f) => f.search);
    const folded = fields.map((f) => ({ weight: f.search === true ? 1 : Number(f.search), text: asList(f.value(item)).map(fold).join(" ") }));
    let total = 0;
    for (const token of tokens) {
        let best = 0;
        for (const { weight, text } of folded) {
            if (!text.includes(token))
                continue;
            const starts = text.startsWith(token) || text.includes(` ${token}`);
            best = Math.max(best, weight * (starts ? 2 : 1));
        }
        if (best === 0)
            return null;
        total += best;
    }
    return total;
}
function matchesFilters(def, item, filters, except) {
    for (const field of def.fields) {
        if (field.key === except)
            continue;
        const chosen = filters[field.key];
        if (!chosen || chosen.length === 0)
            continue;
        const has = asList(field.value(item));
        if (!chosen.some((value) => has.includes(value)))
            return false;
    }
    return true;
}
export function queryCatalog(def, items, state) {
    const tokens = fold(state.q).split(" ").filter(Boolean);
    const searching = tokens.length > 0;
    const scores = new Map();
    const matchesSearch = (item) => {
        if (!searching)
            return true;
        const key = def.itemKey(item);
        if (!scores.has(key)) {
            const s = searchScore(def, item, tokens);
            scores.set(key, s ?? -1);
        }
        return (scores.get(key) ?? -1) >= 0;
    };
    const searched = items.filter(matchesSearch);
    const matched = searched.filter((item) => matchesFilters(def, item, state.filters));
    // The order. An explicit sort wins; with a search typed and no sort, best match first; else the default.
    const sortValue = state.sort || (searching ? "" : def.defaultSort ?? "");
    const rank = (item) => scores.get(def.itemKey(item)) ?? 0;
    const byField = (value) => {
        const key = value.replace(/^-/, "");
        const dir = value.startsWith("-") ? -1 : 1;
        const field = def.fields.find((f) => f.key === key);
        const type = field?.type ?? "text";
        const custom = typeof field?.sort === "object" ? field.sort.compare : undefined;
        return (a, b) => {
            if (custom)
                return dir * custom(a, b);
            const av = asList(field?.value(a) ?? null)[0];
            const bv = asList(field?.value(b) ?? null)[0];
            if (av === undefined && bv === undefined)
                return 0;
            if (av === undefined)
                return 1;
            if (bv === undefined)
                return -1;
            return dir * compareValues(av, bv, type);
        };
    };
    const fallback = def.defaultSort ? byField(def.defaultSort) : () => 0;
    const primary = sortValue ? byField(sortValue) : (a, b) => rank(b) - rank(a);
    const rows = [...matched].sort((a, b) => primary(a, b) || (searching && !state.sort ? rank(b) - rank(a) : 0) || fallback(a, b) || def.itemKey(a).localeCompare(def.itemKey(b)));
    const pageSize = def.pageSize ?? 0;
    const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
    const page = Math.min(state.page, pageCount);
    const slice = pageSize > 0 ? rows.slice((page - 1) * pageSize, page * pageSize) : rows;
    const from = slice.length === 0 ? 0 : (page - 1) * (pageSize || rows.length) + 1;
    // Headings only in the default order with nothing typed: any other order would scatter a group's rows.
    const grouped = def.group !== undefined && !searching && sortValue === def.defaultSort;
    const groups = grouped ? groupRows(def, slice) : null;
    // Facet counts hold every other filter and the search, and not the facet's own, so the options of a field
    // show what choosing each would give.
    const facets = def.fields
        .filter((f) => f.facet)
        .map((field) => {
        const facet = field.facet;
        const base = searched.filter((item) => matchesFilters(def, item, state.filters, field.key));
        const counts = new Map();
        for (const item of items)
            for (const value of asList(field.value(item)))
                if (!counts.has(value))
                    counts.set(value, 0);
        for (const item of base)
            for (const value of new Set(asList(field.value(item))))
                counts.set(value, (counts.get(value) ?? 0) + 1);
        const chosen = state.filters[field.key] ?? [];
        for (const value of chosen)
            if (!counts.has(value))
                counts.set(value, 0);
        const label = facet.label ?? ((v) => v);
        let values = [...counts.keys()];
        if (Array.isArray(facet.order)) {
            const fixed = facet.order;
            values.sort((a, b) => (fixed.indexOf(a) === -1 ? 1e6 : fixed.indexOf(a)) - (fixed.indexOf(b) === -1 ? 1e6 : fixed.indexOf(b)) || a.localeCompare(b));
        }
        else if (facet.order === "alpha") {
            values.sort((a, b) => fold(label(a)).localeCompare(fold(label(b)), "en", { numeric: true }));
        }
        else {
            values.sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || fold(label(a)).localeCompare(fold(label(b)), "en", { numeric: true }));
        }
        values = values.filter((v) => (counts.get(v) ?? 0) > 0 || chosen.includes(v));
        return {
            key: field.key,
            label: field.label,
            kind: facet.kind ?? "many",
            general: facet.general === true,
            limit: facet.limit ?? 8,
            options: values.map((value) => ({ value, label: label(value), count: counts.get(value) ?? 0, selected: chosen.includes(value) })),
            selected: chosen.length,
        };
    })
        // General facets first, the rest in the order they were declared.
        .sort((a, b) => Number(b.general) - Number(a.general));
    const href = (change = {}) => catalogHref(def, { ...state, ...change });
    const chips = [];
    if (state.q)
        chips.push({ id: "q", field: "q", value: state.q, label: `"${state.q}"`, href: href({ q: "", page: 1 }) });
    for (const facet of facets) {
        for (const option of facet.options.filter((o) => o.selected)) {
            const remaining = (state.filters[facet.key] ?? []).filter((v) => v !== option.value);
            chips.push({
                id: `${facet.key}:${option.value}`,
                field: facet.key,
                value: option.value,
                label: `${facet.label}: ${option.label}`,
                href: href({ filters: { ...state.filters, [facet.key]: remaining }, page: 1 }),
            });
        }
    }
    const sorts = [];
    if (searching)
        sorts.push({ value: "", label: "Best match", selected: !state.sort });
    for (const field of def.fields) {
        if (!field.sort)
            continue;
        const words = (typeof field.sort === "object" ? field.sort.labels : undefined) ?? DIRECTION_WORDS[field.type ?? "text"];
        for (const dir of ["asc", "desc"]) {
            const value = dir === "asc" ? field.key : `-${field.key}`;
            sorts.push({ value, label: `${field.label}, ${words[dir]}`, selected: sortValue === value });
        }
    }
    return {
        state: { ...state, page },
        total: items.length,
        count: rows.length,
        rows: slice,
        groups,
        page,
        pageCount,
        from,
        to: from === 0 ? 0 : from + slice.length - 1,
        facets,
        chips,
        clearHref: chips.length > 0 ? catalogHref(def, { q: "", filters: {}, sort: state.sort, page: 1 }) : null,
        sorts,
        href,
    };
}
// The rows in order, cut into runs of one group value. An item with no value goes under "Other".
function groupRows(def, rows) {
    const group = def.group;
    const field = def.fields.find((f) => f.key === group.field);
    const groups = [];
    for (const row of rows) {
        const value = group.value ? group.value(row) : (asList(field.value(row))[0] ?? "");
        const last = groups[groups.length - 1];
        if (last && last.value === value)
            last.rows.push(row);
        else
            groups.push({ value, label: value === "" ? "Other" : (group.label?.(value) ?? value), rows: [row] });
    }
    return groups;
}
// "3 of 14 articles", "14 articles", "1 article": the live count in words with its total.
export function countText(def, result) {
    const noun = (n) => (n === 1 ? def.noun[0] : def.noun[1]);
    return result.count === result.total ? `${result.total} ${noun(result.total)}` : `${result.count} of ${result.total} ${noun(result.total)}`;
}
// The state as a downloadable table: the matching items' columns, so a CSV or JSON export is the same
// rows the page shows (not a second query).
export function catalogRecords(def, items, state) {
    const everything = queryCatalog({ ...def, pageSize: undefined }, items, { ...state, page: 1 });
    return everything.rows.map((item) => {
        const record = {};
        for (const field of def.fields) {
            if (!field.column)
                continue;
            record[field.column.header ?? field.label] = asList(field.value(item)).join("; ");
        }
        return record;
    });
}
