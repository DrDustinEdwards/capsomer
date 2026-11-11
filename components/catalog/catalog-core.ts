// The catalog's core: one declaration of a collection's fields, and the pure functions that turn the
// address's query string and the items into the page's state. No DOM and no framework, so a server
// renders the same result a browser would, the filter works with no script, and every site that uses
// the catalog gets the same counts, chips and addresses.
//
// A collection declares each field once (is it searched, is it a facet, is it a column, can it sort).
// `parseCatalogParams` reads the address; `queryCatalog` applies it and returns what the page shows.
// The result never depends on how it is drawn.

export type CatalogValue = string | number | boolean | null | undefined;

export interface CatalogFacet<T = unknown> {
  // "many": values of the field combine with "or" (checkboxes). "one": a single value (radios, with "Any").
  // "range": a span of numbers (years) chosen from two menus, From and To; an item matches when its own
  // span overlaps the chosen one.
  kind?: "one" | "many" | "range";
  // A range facet: the span an item covers (a post's year as [2024, 2024], a job held 2019 to now as
  // [2019, Infinity]), or null for an item with none, which no range matches. Default: the field's
  // numeric values, lowest to highest.
  span?: (item: T) => readonly [number, number] | null;
  // A range facet's two URL parameters. Default "<key>-from" and "<key>-to".
  params?: { from: string; to: string };
  // General facets are listed first and start open; the rest start folded.
  general?: boolean;
  // The options' order: most items first (default), alphabetical, or a fixed list.
  order?: "count" | "alpha" | readonly string[];
  // How a value reads as an option and as a chip, when the value is not already words.
  label?: (value: string) => string;
  // How many options show before "Show more". Default 8.
  limit?: number;
}

export interface CatalogColumn {
  header?: string;
  align?: "end";
  // Opt in to dropping the column on a narrow region (the table's `data-drop`).
  drop?: 1 | 2;
  // A small note under the header ("last 24 hours").
  note?: string;
  // The column is left out while the rows are grouped, because the group heading already says it (a Year column
  // under year headings). It shows again in every flat view.
  hideWhenGrouped?: boolean;
}

// Rows under headings, in the default order only. The group field must be the one the default sort orders by, so
// each heading's rows are together; a search or another sort shows the same rows flat.
export interface CatalogGroup<T> {
  // The sortable field the default sort orders by (its key, not "-key").
  field: string;
  // What puts an item in a group, when the field's own value is finer than a heading (a month, not a day).
  value?: (item: T) => string;
  // How a group's value reads as its heading. Default: the value.
  label?: (value: string) => string;
  // The heading for items with no value (default "Other": "Undated" for years).
  empty?: string;
}

export interface CatalogSort<T> {
  // How the two directions read in the sort menu. Defaults follow the field's `type`.
  labels?: { asc: string; desc: string };
  // Replaces comparing the field's value: for a field whose order is not alphabetical or numeric.
  compare?: (a: T, b: T) => number;
}

export interface CatalogField<T> {
  // The field's name, and its URL parameter when it is a facet. Not q, sort or page.
  key: string;
  label: string;
  // What the field says about one item: a value, a list of values, or nothing.
  value: (item: T) => CatalogValue | readonly CatalogValue[];
  // The field is typed by the search box. A number is its weight in the ranking (true is 1).
  search?: boolean | number;
  facet?: CatalogFacet<T>;
  column?: CatalogColumn;
  sort?: boolean | CatalogSort<T>;
  // Reading and ordering: text (A to Z), number (low to high) or date (oldest first, ISO strings).
  type?: "text" | "number" | "date";
}

export interface CatalogDefinition<T> {
  // Names the live regions and the form: unique on a page.
  id: string;
  // The items' name, singular and plural, for the count ("3 of 14 articles").
  noun: readonly [string, string];
  // The page's address, with no query: the canonical, and where every filtered address is built from.
  basePath: string;
  fields: readonly CatalogField<T>[];
  itemKey: (item: T) => string;
  // The order with nothing typed: a field key, "-" first for descending ("-updated").
  defaultSort?: string;
  // Rows per page; leave out for one page.
  pageSize?: number;
  // Headings over the rows in the default order (see CatalogGroup).
  group?: CatalogGroup<T>;
}

export interface CatalogState {
  q: string;
  filters: Record<string, string[]>;
  // "" is the default order (best match while a search is typed).
  sort: string;
  page: number;
}

export interface CatalogOption {
  value: string;
  label: string;
  // Items that would match with this option chosen, the other filters held.
  count: number;
  selected: boolean;
}

export interface CatalogRange {
  // The chosen ends, null when open.
  from: number | null;
  to: number | null;
  // The URL parameters the two menus submit.
  params: { from: string; to: string };
  // Every value an item covers, lowest first: the menus' options.
  values: number[];
}

export interface CatalogFacetResult {
  key: string;
  label: string;
  kind: "one" | "many" | "range";
  // A range facet's ends and choices; its options are each value with the items that cover it.
  range?: CatalogRange;
  general: boolean;
  limit: number;
  options: CatalogOption[];
  selected: number;
}

export interface CatalogChip {
  id: string;
  field: string;
  value: string;
  // "Topic: Pricing", or the search typed in quotes.
  label: string;
  // The address with this one filter removed: a link that works with no script.
  href: string;
}

export interface CatalogSortOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface CatalogRowGroup<T> {
  value: string;
  label: string;
  rows: T[];
}

export interface CatalogResult<T> {
  state: CatalogState;
  total: number;
  count: number;
  rows: T[];
  // The shown rows under their headings, or null when the view is flat (a search, another sort, or no group declared).
  groups: CatalogRowGroup<T>[] | null;
  page: number;
  pageCount: number;
  // The 1-based position of the first and last row shown, of `count`.
  from: number;
  to: number;
  facets: CatalogFacetResult[];
  chips: CatalogChip[];
  clearHref: string | null;
  sorts: CatalogSortOption[];
  // The address for this state with changes; with none, the current address.
  href: (change?: Partial<CatalogState>) => string;
}

export const RESERVED_PARAMS = ["q", "sort", "page"] as const;

// Folds case and accents, so "Report" matches "report" and "Genève" matches "geneve".
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase();
}

const asList = (v: CatalogValue | readonly CatalogValue[]): string[] =>
  (Array.isArray(v) ? v : [v])
    .filter((x): x is string | number | boolean => x !== null && x !== undefined && x !== "")
    .map(String);

// A range facet's stored value is "from..to", either end empty when open.
export function readRange(value: string | undefined): { from: number | null; to: number | null } {
  const [a, b] = (value ?? "").split("..");
  const num = (x: string | undefined) => (x && /^-?\d+$/.test(x) ? Number(x) : null);
  return { from: num(a), to: num(b) };
}
const rangeParams = <T>(field: CatalogField<T>) =>
  field.facet?.params ?? { from: `${field.key}-from`, to: `${field.key}-to` };

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

// Checks a declaration once, at definition time, so a mistake is a thrown error where it is made and not a
// filter that quietly does nothing.
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

export function parseCatalogParams<T>(
  def: CatalogDefinition<T>,
  input: URLSearchParams | string,
): CatalogState {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const filters: Record<string, string[]> = {};
  for (const field of def.fields) {
    if (!field.facet) continue;
    if (field.facet.kind === "range") {
      const names = rangeParams(field);
      const num = (raw: string | null) => {
        const t = (raw ?? "").trim();
        return /^-?\d+$/.test(t) ? Number(t) : null;
      };
      let from = num(params.get(names.from));
      let to = num(params.get(names.to));
      // An inverted range is read the way it was meant.
      if (from !== null && to !== null && from > to) [from, to] = [to, from];
      if (from !== null || to !== null) filters[field.key] = [`${from ?? ""}..${to ?? ""}`];
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
export function catalogHref<T>(def: CatalogDefinition<T>, state: CatalogState): string {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  for (const field of def.fields) {
    if (field.facet?.kind === "range") {
      const { from, to } = readRange(state.filters[field.key]?.[0]);
      const names = rangeParams(field);
      if (from !== null) params.set(names.from, String(from));
      if (to !== null) params.set(names.to, String(to));
      continue;
    }
    for (const value of state.filters[field.key] ?? []) params.append(field.key, value);
  }
  if (state.sort && state.sort !== def.defaultSort) params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  const query = params.toString();
  return query ? `${def.basePath}?${query}` : def.basePath;
}

// The address a request should have, or null when it already has it. A browser submitting the form with no script
// sends every control, including the ones at their defaults (`?q=billing&sort=-updated&kind=`); a server answers
// that with a redirect to the one address the state has, so what is shared and cached is the clean one.
// `keepUnknown` leaves parameters the catalog does not read (a campaign tag, a cache buster) out of the
// comparison, so they are served rather than redirected away; they are dropped only when a redirect
// happens anyway.
export function catalogRedirect<T>(
  def: CatalogDefinition<T>,
  url: URL,
  options: { keepUnknown?: boolean } = {},
): string | null {
  let search = url.search;
  if (options.keepUnknown) {
    const known = catalogParams(def);
    const kept = new URLSearchParams();
    for (const [k, v] of url.searchParams) if (known.has(k)) kept.append(k, v);
    const q = kept.toString();
    search = q ? `?${q}` : "";
  }
  const wanted = catalogHref(def, parseCatalogParams(def, url.searchParams));
  return `${url.pathname}${search}` === wanted ? null : wanted;
}

// Every URL parameter the catalog reads.
export function catalogParams<T>(def: CatalogDefinition<T>): Set<string> {
  const names = new Set<string>(RESERVED_PARAMS);
  for (const field of def.fields) {
    if (!field.facet) continue;
    if (field.facet.kind === "range") {
      const p = rangeParams(field);
      names.add(p.from).add(p.to);
    } else names.add(field.key);
  }
  return names;
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

// The state as a downloadable table: the matching items' columns, so a CSV or JSON export is the same
// rows the page shows (not a second query).
export interface RecordOptions<T> {
  // A first "id" column (a slug), and a "url" column with each item's absolute address.
  id?: (item: T) => string;
  url?: (item: T) => string;
  // The keys: each column's header as a person reads it (default), or the field's key, which a
  // JSON reader or a script expects.
  keys?: "header" | "key";
  // Every field, not only the table's columns (a description, a version).
  allFields?: boolean;
  // Between the values of a list field (default "; ").
  join?: string;
}

// The state as a downloadable table: the matching items' columns, so a CSV or JSON export is the same
// rows the page shows (not a second query). `state` may be the request's query.
export function catalogRecords<T>(
  def: CatalogDefinition<T>,
  items: readonly T[],
  state: CatalogState | URLSearchParams | string,
  options: RecordOptions<T> = {},
): Array<Record<string, string>> {
  const parsed =
    typeof state === "string" || state instanceof URLSearchParams
      ? parseCatalogParams(def, state)
      : state;
  const everything = queryCatalog({ ...def, pageSize: undefined }, items, { ...parsed, page: 1 });
  const join = options.join ?? "; ";
  return everything.rows.map((item) => {
    const record: Record<string, string> = {};
    if (options.id) record.id = options.id(item);
    if (options.url) record.url = options.url(item);
    for (const field of def.fields) {
      if (!field.column && !options.allFields) continue;
      const key = options.keys === "key" ? field.key : (field.column?.header ?? field.label);
      record[key] = asList(field.value(item)).join(join);
    }
    return record;
  });
}

// A Markdown table cell: pipes escaped, whitespace (newlines included) collapsed to one space.
export const markdownCell = (value: unknown): string =>
  String(value ?? "")
    .replaceAll("|", "\\|")
    .replace(/\s+/g, " ")
    .trim();

export interface MarkdownOptions<T> {
  // The site's address, before each item's link.
  origin?: string;
  // An item's path: the first column becomes a link to it.
  href?: (item: T) => string;
  // Said instead of a table when nothing matches.
  empty?: string;
  // Between the values of a list field (default ", ").
  join?: string;
}

// The catalog's rows as a Markdown table for a page's machine-readable twin (/library.md): the
// table's columns, the first one a link to each item, every cell escaped.
export function catalogMarkdown<T>(
  def: CatalogDefinition<T>,
  items: readonly T[],
  state: CatalogState | URLSearchParams | string = "",
  options: MarkdownOptions<T> = {},
): string {
  const parsed =
    typeof state === "string" || state instanceof URLSearchParams
      ? parseCatalogParams(def, state)
      : state;
  const rows = queryCatalog({ ...def, pageSize: undefined }, items, { ...parsed, page: 1 }).rows;
  const columns = def.fields.filter((f) => f.column);
  if (rows.length === 0 || columns.length === 0) return options.empty ?? `No ${def.noun[1]} yet.`;
  const join = options.join ?? ", ";
  const head = columns.map((f) => markdownCell(f.column?.header ?? f.label));
  const body = rows.map((item) =>
    columns.map((field, i) => {
      const text = markdownCell(asList(field.value(item)).join(join));
      return i === 0 && options.href
        ? `[${text}](${options.origin ?? ""}${options.href(item)})`
        : text;
    }),
  );
  return [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...body.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");
}

// The addresses of this view's downloads: the CSV and JSON of what is shown (they carry the
// filters), and the Markdown twin of the whole collection.
export function catalogDownloads<T>(
  def: CatalogDefinition<T>,
  result: Pick<CatalogResult<T>, "href">,
): { csv: string; json: string; markdown: string } {
  const href = result.href({ page: 1 });
  const at = href.indexOf("?");
  const query = at === -1 ? "" : href.slice(at);
  return {
    csv: `${def.basePath}.csv${query}`,
    json: `${def.basePath}.json${query}`,
    markdown: `${def.basePath}.md`,
  };
}

// How many filters are on: one for the search, one for each chosen value, one for a range.
export const activeCount = <T>(result: Pick<CatalogResult<T>, "chips">): number =>
  result.chips.length;

// A facet's counts by value: what each option would give, the other filters held.
export function facetCounts<T>(
  result: Pick<CatalogResult<T>, "facets">,
  key: string,
): Record<string, number> {
  const facet = result.facets.find((f) => f.key === key);
  return Object.fromEntries((facet?.options ?? []).map((o) => [o.value, o.count]));
}

// The status line in words, with the zero case: "Showing all 14 articles", "Showing 3 of 14
// articles", "No articles match. 14 in all."
export function summaryText<T>(
  def: CatalogDefinition<T>,
  result: Pick<CatalogResult<T>, "count" | "total">,
): string {
  const noun = (n: number) => (n === 1 ? def.noun[0] : def.noun[1]);
  if (result.count === 0 && result.total > 0)
    return `No ${def.noun[1]} match. ${result.total} in all.`;
  if (result.count === result.total)
    return result.total === 1
      ? `Showing the one ${def.noun[0]}`
      : `Showing all ${result.total} ${noun(result.total)}`;
  return `Showing ${result.count} of ${result.total} ${noun(result.total)}`;
}

// Reading the address outside a catalog (a view's own settings, a page's options): a value from a
// fixed list or the fallback, so a stale or hand-typed link still opens the page.
export function oneOf<V extends string, F>(
  value: unknown,
  allowed: readonly V[],
  fallback: F,
): V | F {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as V)
    : fallback;
}

// A list parameter, sent either way a person or a form sends it: repeated (?tag=a&tag=b) or as one
// comma list (?tag=a,b). Trimmed, deduplicated in first-seen order, and, with `known`, only values in it.
export function listParam(
  params: URLSearchParams,
  key: string,
  known?: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  for (const raw of params.getAll(key))
    for (const part of raw.split(",")) {
      const v = part.trim();
      if (v && (!known || known.has(v)) && !out.includes(v)) out.push(v);
    }
  return out;
}

// A four-digit year, or null.
export function yearParam(raw: string | null | undefined): number | null {
  const t = (raw ?? "").trim();
  return /^\d{4}$/.test(t) ? Number(t) : null;
}
