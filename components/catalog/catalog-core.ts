// The catalog's core: one declaration of a collection's fields, and the pure functions that turn the
// address's query string and the items into the page's state. No DOM and no framework, so a server
// renders what a browser would and the filter works with no script.

import type {
  CatalogChip,
  CatalogDefinition,
  CatalogFacet,
  CatalogFacetResult,
  CatalogField,
  CatalogGroup,
  CatalogRange,
  CatalogResult,
  CatalogRowGroup,
  CatalogSortOption,
  CatalogState,
} from "./catalog-types.ts";
import { RESERVED_PARAMS, asList, catalogHref, rangeParams, readRange } from "./catalog-address.ts";
export type * from "./catalog-types.ts";
export {
  RESERVED_PARAMS,
  catalogHref,
  catalogRedirect,
  listParam,
  oneOf,
  parseCatalogParams,
  readRange,
  yearParam,
} from "./catalog-address.ts";

export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase();
}

function spanOf<T>(field: CatalogField<T>, item: T): readonly [number, number] | null {
  if (field.facet?.span) return field.facet.span(item);
  const nums = asList(field.value(item))
    .map(Number)
    .filter((n) => Number.isFinite(n));
  return nums.length ? [Math.min(...nums), Math.max(...nums)] : null;
}

function inRange<T>(field: CatalogField<T>, item: T, value: string): boolean {
  const { from, to } = readRange(value);
  if (from === null && to === null) return true;
  const span = spanOf(field, item);
  if (!span) return false;
  if (from !== null && span[1] < from) return false;
  if (to !== null && span[0] > to) return false;
  return true;
}

// Checks a declaration once, at definition time, so a mistake throws where it is made.
export function defineCatalog<T>(def: CatalogDefinition<T>): CatalogDefinition<T> {
  const keys = new Set<string>();
  for (const field of def.fields) {
    if (!/^[a-z][a-z0-9_-]*$/.test(field.key))
      throw new Error(
        `catalog ${def.id}: field key "${field.key}" must be lower case letters, digits, - or _`,
      );
    if ((RESERVED_PARAMS as readonly string[]).includes(field.key))
      throw new Error(`catalog ${def.id}: "${field.key}" is a reserved parameter`);
    if (keys.has(field.key))
      throw new Error(`catalog ${def.id}: two fields are named "${field.key}"`);
    keys.add(field.key);
    if (field.facet?.kind === "range") {
      const { from, to } = rangeParams(field);
      for (const name of [from, to]) {
        if (
          (RESERVED_PARAMS as readonly string[]).includes(name) ||
          def.fields.some((f) => f.key === name)
        )
          throw new Error(`catalog ${def.id}: range parameter "${name}" is already a parameter`);
      }
    }
  }
  if (def.defaultSort !== undefined) {
    const key = def.defaultSort.replace(/^-/, "");
    const field = def.fields.find((f) => f.key === key);
    if (!field?.sort)
      throw new Error(
        `catalog ${def.id}: defaultSort "${def.defaultSort}" is not a sortable field`,
      );
  }
  if (def.group) {
    const field = def.fields.find((f) => f.key === def.group?.field);
    if (!field?.sort)
      throw new Error(
        `catalog ${def.id}: group field "${def.group.field}" is not a sortable field`,
      );
    if (def.defaultSort?.replace(/^-/, "") !== def.group.field) {
      throw new Error(
        `catalog ${def.id}: group field "${def.group.field}" must be the field the default sort orders by`,
      );
    }
  }
  if (!def.basePath.startsWith("/") || def.basePath.includes("?"))
    throw new Error(`catalog ${def.id}: basePath is a path with no query`);
  return def;
}

const DIRECTION_WORDS = {
  text: { asc: "A to Z", desc: "Z to A" },
  number: { asc: "low to high", desc: "high to low" },
  date: { asc: "oldest first", desc: "newest first" },
} as const;

function compareValues(
  a: string | undefined,
  b: string | undefined,
  type: "text" | "number" | "date",
): number {
  // An item with no value sorts last in either direction: the caller handles that.
  if (type === "number") return Number(a) - Number(b);
  if (type === "date") return (a ?? "") < (b ?? "") ? -1 : (a ?? "") > (b ?? "") ? 1 : 0;
  return fold(a ?? "").localeCompare(fold(b ?? ""), "en", { numeric: true });
}

// How well the typed words match an item: every word must appear, and a word that starts a word of a field
// counts double. null is no match.
function searchScore<T>(def: CatalogDefinition<T>, item: T, tokens: string[]): number | null {
  const fields = def.fields.filter((f) => f.search);
  const folded = fields.map((f) => ({
    weight: f.search === true ? 1 : Number(f.search),
    text: asList(f.value(item)).map(fold).join(" "),
  }));
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const { weight, text } of folded) {
      if (!text.includes(token)) continue;
      const starts = text.startsWith(token) || text.includes(` ${token}`);
      best = Math.max(best, weight * (starts ? 2 : 1));
    }
    if (best === 0) return null;
    total += best;
  }
  return total;
}

function matchesFilters<T>(
  def: CatalogDefinition<T>,
  item: T,
  filters: Record<string, string[]>,
  except?: string,
): boolean {
  for (const field of def.fields) {
    if (field.key === except) continue;
    const chosen = filters[field.key];
    if (!chosen || chosen.length === 0) continue;
    if (field.facet?.kind === "range") {
      if (!inRange(field, item, chosen[0] ?? "")) return false;
      continue;
    }
    const has = asList(field.value(item));
    if (!chosen.some((value) => has.includes(value))) return false;
  }
  return true;
}

export function queryCatalog<T>(
  def: CatalogDefinition<T>,
  items: readonly T[],
  state: CatalogState,
): CatalogResult<T> {
  const tokens = fold(state.q).split(" ").filter(Boolean);
  const searching = tokens.length > 0;
  const scores = new Map<string, number>();
  const matchesSearch = (item: T): boolean => {
    if (!searching) return true;
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
  const sortValue = state.sort || (searching ? "" : (def.defaultSort ?? ""));
  const rank = (item: T) => scores.get(def.itemKey(item)) ?? 0;
  const byField = (value: string) => {
    const key = value.replace(/^-/, "");
    const dir = value.startsWith("-") ? -1 : 1;
    const field = def.fields.find((f) => f.key === key);
    const type = field?.type ?? "text";
    const custom = typeof field?.sort === "object" ? field.sort.compare : undefined;
    return (a: T, b: T) => {
      if (custom) return dir * custom(a, b);
      const av = asList(field?.value(a) ?? null)[0];
      const bv = asList(field?.value(b) ?? null)[0];
      if (av === undefined && bv === undefined) return 0;
      if (av === undefined) return 1;
      if (bv === undefined) return -1;
      return dir * compareValues(av, bv, type);
    };
  };
  const fallback = def.defaultSort ? byField(def.defaultSort) : () => 0;
  const primary = sortValue ? byField(sortValue) : (a: T, b: T) => rank(b) - rank(a);
  const rows = [...matched].sort(
    (a, b) =>
      primary(a, b) ||
      (searching && !state.sort ? rank(b) - rank(a) : 0) ||
      fallback(a, b) ||
      def.itemKey(a).localeCompare(def.itemKey(b)),
  );

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
  const facets: CatalogFacetResult[] = def.fields
    .filter((f) => f.facet)
    .map((field) => {
      const facet = field.facet as CatalogFacet<T>;
      const base = searched.filter((item) => matchesFilters(def, item, state.filters, field.key));
      if (facet.kind === "range") {
        // Each value an item covers, with the items that cover it (the other filters held). An open
        // end (Infinity) covers up to the highest value any item names.
        const ends = items.flatMap((item) => spanOf(field, item) ?? []).filter(Number.isFinite);
        const top = ends.length ? Math.max(...ends) : 0;
        const bottom = ends.length ? Math.min(...ends) : 0;
        const counts = new Map<number, number>();
        for (let v = bottom; ends.length && v <= top && counts.size < 500; v++) counts.set(v, 0);
        for (const item of base) {
          const span = spanOf(field, item);
          if (!span) continue;
          for (let v = Math.max(bottom, span[0]); v <= Math.min(top, span[1]); v++)
            counts.set(v, (counts.get(v) ?? 0) + 1);
        }
        const chosen = readRange(state.filters[field.key]?.[0]);
        const label = facet.label ?? ((v: string) => v);
        const values = [...counts.keys()];
        return {
          key: field.key,
          label: field.label,
          kind: "range" as const,
          general: facet.general === true,
          limit: values.length,
          range: { ...chosen, params: rangeParams(field), values },
          options: values.map((v) => ({
            value: String(v),
            label: label(String(v)),
            count: counts.get(v) ?? 0,
            selected:
              (chosen.from !== null || chosen.to !== null) &&
              (chosen.from === null || v >= chosen.from) &&
              (chosen.to === null || v <= chosen.to),
          })),
          selected: chosen.from !== null || chosen.to !== null ? 1 : 0,
        };
      }
      const counts = new Map<string, number>();
      for (const item of items)
        for (const value of asList(field.value(item))) if (!counts.has(value)) counts.set(value, 0);
      for (const item of base)
        for (const value of new Set(asList(field.value(item))))
          counts.set(value, (counts.get(value) ?? 0) + 1);
      const chosen = state.filters[field.key] ?? [];
      for (const value of chosen) if (!counts.has(value)) counts.set(value, 0);
      const label = facet.label ?? ((v: string) => v);
      let values = [...counts.keys()];
      if (Array.isArray(facet.order)) {
        const fixed = facet.order as readonly string[];
        values.sort(
          (a, b) =>
            (fixed.indexOf(a) === -1 ? 1e6 : fixed.indexOf(a)) -
              (fixed.indexOf(b) === -1 ? 1e6 : fixed.indexOf(b)) || a.localeCompare(b),
        );
      } else if (facet.order === "alpha") {
        values.sort((a, b) =>
          fold(label(a)).localeCompare(fold(label(b)), "en", { numeric: true }),
        );
      } else {
        values.sort(
          (a, b) =>
            (counts.get(b) ?? 0) - (counts.get(a) ?? 0) ||
            fold(label(a)).localeCompare(fold(label(b)), "en", { numeric: true }),
        );
      }
      values = values.filter((v) => (counts.get(v) ?? 0) > 0 || chosen.includes(v));
      return {
        key: field.key,
        label: field.label,
        kind: facet.kind ?? "many",
        general: facet.general === true,
        limit: facet.limit ?? 8,
        options: values.map((value) => ({
          value,
          label: label(value),
          count: counts.get(value) ?? 0,
          selected: chosen.includes(value),
        })),
        selected: chosen.length,
      };
    })
    // General facets first, the rest in the order they were declared.
    .sort((a, b) => Number(b.general) - Number(a.general));

  const href = (change: Partial<CatalogState> = {}): string =>
    catalogHref(def, { ...state, ...change });

  const chips: CatalogChip[] = [];
  if (state.q)
    chips.push({
      id: "q",
      field: "q",
      value: state.q,
      label: `"${state.q}"`,
      href: href({ q: "", page: 1 }),
    });
  for (const facet of facets) {
    if (facet.kind === "range") {
      const r = facet.range as CatalogRange;
      if (r.from === null && r.to === null) continue;
      const label = def.fields.find((f) => f.key === facet.key)?.facet?.label ?? ((v: string) => v);
      const words =
        r.from !== null && r.to !== null
          ? r.from === r.to
            ? label(String(r.from))
            : `${label(String(r.from))} to ${label(String(r.to))}`
          : r.from !== null
            ? `from ${label(String(r.from))}`
            : `to ${label(String(r.to))}`;
      chips.push({
        id: `${facet.key}:range`,
        field: facet.key,
        value: state.filters[facet.key]?.[0] ?? "",
        label: `${facet.label}: ${words}`,
        href: href({ filters: { ...state.filters, [facet.key]: [] }, page: 1 }),
      });
      continue;
    }
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

  const sorts: CatalogSortOption[] = [];
  if (searching) sorts.push({ value: "", label: "Best match", selected: !state.sort });
  for (const field of def.fields) {
    if (!field.sort) continue;
    const words =
      (typeof field.sort === "object" ? field.sort.labels : undefined) ??
      DIRECTION_WORDS[field.type ?? "text"];
    for (const dir of ["asc", "desc"] as const) {
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
    clearHref:
      chips.length > 0 ? catalogHref(def, { q: "", filters: {}, sort: state.sort, page: 1 }) : null,
    sorts,
    href,
  };
}

// The rows in order, cut into runs of one group value. An item with no value goes under "Other".
function groupRows<T>(def: CatalogDefinition<T>, rows: readonly T[]): CatalogRowGroup<T>[] {
  const group = def.group as CatalogGroup<T>;
  const field = def.fields.find((f) => f.key === group.field) as CatalogField<T>;
  const groups: CatalogRowGroup<T>[] = [];
  for (const row of rows) {
    const value = group.value ? group.value(row) : (asList(field.value(row))[0] ?? "");
    const last = groups[groups.length - 1];
    if (last && last.value === value) last.rows.push(row);
    else
      groups.push({
        value,
        label: value === "" ? (group.empty ?? "Other") : (group.label?.(value) ?? value),
        rows: [row],
      });
  }
  return groups;
}

// "3 of 14 articles", "14 articles", "1 article": the live count in words with its total.
export function countText<T>(
  def: CatalogDefinition<T>,
  result: Pick<CatalogResult<T>, "count" | "total">,
): string {
  const noun = (n: number) => (n === 1 ? def.noun[0] : def.noun[1]);
  return result.count === result.total
    ? `${result.total} ${noun(result.total)}`
    : `${result.count} of ${result.total} ${noun(result.total)}`;
}
